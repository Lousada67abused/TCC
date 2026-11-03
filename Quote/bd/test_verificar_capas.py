import csv
from io import BytesIO
from pathlib import Path
import struct
import tempfile
import unittest
from unittest.mock import Mock, patch
from urllib.error import HTTPError, URLError

import verificar_capas as covers


def jpeg(width=300, height=450, marker=0xC0):
    return (b"\xff\xd8\xff\xe0\x00\x04AB\xff" + bytes([marker])
            + b"\x00\x0b\x08" + struct.pack(">HH", height, width)
            + b"\x01\x01\x11\x00\xff\xd9")


def response(status=200, body=None, headers=None):
    result = Mock(code=status, headers=headers or {})
    result.read.return_value = jpeg() if body is None else body
    result.__enter__ = Mock(return_value=result)
    result.__exit__ = Mock(return_value=False)
    return result


class ExtractionTests(unittest.TestCase):
    def test_isbn_checksum_and_prefix(self):
        self.assertTrue(covers.valid_isbn("9780306406157"))
        self.assertTrue(covers.valid_isbn("9791234567896"))
        self.assertFalse(covers.valid_isbn("9780306406158"))
        self.assertFalse(covers.valid_isbn("9770306406158"))

    def test_extracts_only_books_and_unescapes_apostrophes(self):
        text = """INSERT INTO livro (id_livro,titulo) VALUES
(9788535914849, 'L''homme'),
(9788582850350, 'D\\'água');
INSERT INTO avaliacao (id_livro,titulo) VALUES
(9788522031450, 'Outra tabela');"""
        self.assertEqual(covers.extract_books(text), [
            ("9788535914849", "L'homme"), ("9788582850350", "D'água")])

    def test_missing_or_duplicate_books_fail(self):
        with self.assertRaises(ValueError):
            covers.extract_books("INSERT INTO autor VALUES (1, 'Autor');")
        with self.assertRaises(ValueError):
            covers.extract_books("INSERT INTO livro (id_livro,titulo) VALUES\n"
                                 "(9788535914849,'A'),\n(9788535914849,'B');")


class ResponseTests(unittest.TestCase):
    def test_jpeg_dimensions_baseline_and_progressive(self):
        for marker in (0xC0, 0xC2):
            self.assertEqual(covers.jpeg_dimensions(jpeg(marker=marker)), (300, 450))
            self.assertEqual(covers.classify_response(200, {}, jpeg(marker=marker))["resultado"], "ok_jpeg")

    def test_blank_small_truncated_and_non_image_are_rejected(self):
        self.assertEqual(covers.classify_response(200, {}, jpeg(1, 1))["resultado"], "imagem_placeholder")
        for data in (b"", b"<html>error</html>", jpeg()[:-2], b"\xff\xd8\xff\xe0\xff\xff\xff\xd9"):
            self.assertEqual(covers.classify_response(200, {}, data)["resultado"], "resposta_invalida")

    def test_known_cover_redirects_remain_unverified(self):
        valid = ["https://archive.org/download/l_covers_0012/l_covers_0012_08.zip/0012089999-L.jpg",
                 "https://archive.org/download/olcovers542/olcovers542-L.zip/5423842-L.jpg",
                 "https://covers.openlibrary.org/b/id/123456-L.jpg"]
        invalid = ["http://archive.org/download/l_covers_0012/a.jpg",
                   "https://archive.org.evil.test/download/l_covers_0012/a.jpg",
                   "https://archive.org/download/other/a.jpg",
                   "https://archive.org/download/l_covers_0012/../a.jpg",
                   "https://archive.org/download/olcovers542/olcovers543-L.zip/5423842-L.jpg",
                   "https://archive.org/download/olcovers542/olcovers542-S.zip/5423842-L.jpg",
                   "https://archive.org/download/olcovers542/olcovers542-L.zip/5423842-M.jpg",
                   "https://archive.org/download/olcovers542/olcovers542-L.zip/../../5423842-L.jpg",
                   "https://archive.org/download/olcoversABC/olcoversABC-L.zip/5423842-L.jpg",
                   "https://covers.openlibrary.org/b/id/0-L.jpg",
                   "https://covers.openlibrary.org/b/id/1-S.jpg",
                   "https://user@archive.org/download/l_covers_0012/a.jpg",
                   "https://covers.openlibrary.org/b/id/1-L.jpg?default=true", ""]
        for url in valid + invalid:
            actual = covers.classify_response(302, {"Location": url})
            expected = "redirect_nao_verificado" if url in valid else "redirecionamento_invalido"
            self.assertEqual(actual["resultado"], expected, url)
            self.assertNotIn(actual["resultado"], covers.SUCCESS, url)
            self.assertEqual(actual["sha256"], "", url)

    def test_missing_and_transient_errors_are_distinct(self):
        self.assertEqual(covers.classify_response(404, {})["resultado"], "sem_capa")
        for status in (408, 429, 500, 503, 599):
            self.assertEqual(covers.classify_response(status, {})["resultado"], "erro_temporario")
        self.assertEqual(covers.classify_response(403, {})["resultado"], "erro_http")


class RequestTests(unittest.TestCase):
    def test_get_url_and_no_redirect_following(self):
        client = Mock()
        error = HTTPError("test", 302, "Found", {"Location": "https://covers.openlibrary.org/b/id/123-L.jpg"}, BytesIO())
        client.open.side_effect = error
        result = covers.check_isbn("9788535914849", opener=client)
        self.assertEqual(result["resultado"], "redirect_nao_verificado")
        self.assertEqual(client.open.call_count, 1)
        request = client.open.call_args.args[0]
        self.assertEqual(request.get_method(), "GET")
        self.assertEqual(request.full_url, "https://covers.openlibrary.org/b/isbn/9788535914849-L.jpg")
        self.assertIsNone(covers.NoRedirect().redirect_request(None, None, 302, "", {}, "https://example.com"))

    def test_retry_after_then_success(self):
        client = Mock()
        client.open.side_effect = [response(429, headers={"Retry-After": "1000"}), response()]
        sleep = Mock()
        result = covers.check_isbn("9788535914849", opener=client, sleep_fn=sleep)
        self.assertEqual(result["resultado"], "ok_jpeg")
        self.assertEqual(len(result["sha256"]), 64)
        sleep.assert_called_once_with(30)

    def test_retry_exhaustion_fails_closed(self):
        client, sleep = Mock(), Mock()
        client.open.side_effect = URLError("offline")
        result = covers.check_isbn("9788535914849", opener=client, sleep_fn=sleep)
        self.assertEqual(result["resultado"], "erro_temporario")
        self.assertEqual(client.open.call_count, 4)
        self.assertEqual(sleep.call_count, 3)

    def test_missing_not_retried(self):
        client = Mock()
        client.open.return_value = response(404)
        result = covers.check_isbn("9788535914849", opener=client)
        self.assertEqual(result["resultado"], "sem_capa")
        client.open.assert_called_once()

    def test_invalid_isbn_never_requests(self):
        client = Mock()
        for isbn in ("bad", "9780306406158", "9770306406158"):
            with self.subTest(isbn=isbn), self.assertRaises(ValueError):
                covers.check_isbn(isbn, opener=client)
        client.open.assert_not_called()

    def test_invalid_cli_isbn_never_requests(self):
        with patch.object(covers, "check_isbn") as check:
            self.assertEqual(covers.main(["--isbn", "9780306406158"]), 2)
            self.assertEqual(covers.main(["--isbn", "9770306406158"]), 2)
            check.assert_not_called()

    def test_cli_writes_csv_and_fails_on_unconfirmed_cover(self):
        row = {name: "" for name in covers.FIELDS}
        row.update(isbn="9788535914849", resultado="erro_temporario")
        with tempfile.TemporaryDirectory() as temp, patch.object(covers, "check_isbn", return_value=row):
            path = Path(temp) / "result.csv"
            self.assertEqual(covers.main(["--isbn", row["isbn"], "--output", str(path)]), 1)
            self.assertNotIn(b"\r\n", path.read_bytes())
            with path.open(encoding="utf-8", newline="") as file:
                reader = csv.DictReader(file)
                self.assertEqual(tuple(reader.fieldnames), covers.FIELDS)
                self.assertEqual(list(reader)[0]["resultado"], "erro_temporario")

    def test_cli_rejects_known_302_without_downloading_image(self):
        client = Mock()
        redirect = response(302, headers={
            "Location": "https://archive.org/download/olcovers542/olcovers542-L.zip/5423842-L.jpg",
        })
        client.open.return_value = redirect
        with tempfile.TemporaryDirectory() as temp, patch.object(covers, "build_opener", return_value=client) as build:
            path = Path(temp) / "redirect.csv"
            self.assertEqual(covers.main(["--isbn", "9788535914849", "--output", str(path)]), 1)
            with path.open(encoding="utf-8", newline="") as file:
                row = next(csv.DictReader(file))
            self.assertEqual(row["resultado"], "redirect_nao_verificado")
            self.assertEqual(row["url"], "https://covers.openlibrary.org/b/isbn/9788535914849-L.jpg")
            self.assertEqual(row["sha256"], "")
            self.assertIsInstance(build.call_args.args[0], covers.NoRedirect)
            client.open.assert_called_once()
            redirect.read.assert_not_called()
            self.assertNotIn(b"\r\n", path.read_bytes())


if __name__ == "__main__":
    unittest.main()
