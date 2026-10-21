#!/usr/bin/env python3
"""Verifica capas do seed no Open Library sem seguir redirecionamentos.

Somente a biblioteca padrão é necessária. Um redirect conhecido confirma que o
Open Library associou uma capa ao ISBN; não representa um download dessa imagem.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor
import csv
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import hashlib
from pathlib import Path
import re
import struct
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener


FIELDS = (
    "isbn", "titulo", "url", "verificado_em_utc", "http_status", "resultado",
    "destino", "largura", "altura", "sha256",
)
MAX_BYTES = 10 * 1024 * 1024
SUCCESS = {"ok_jpeg", "ok_redirect"}
REDIRECTS = {301, 302, 303, 307, 308}


def valid_isbn(isbn):
    """Confere prefixo e dígito verificador de um ISBN-13 numérico."""
    isbn = str(isbn)
    return (
        re.fullmatch(r"(?:978|979)[0-9]{10}", isbn) is not None
        and sum(int(digit) * (1 if index % 2 == 0 else 3)
                for index, digit in enumerate(isbn)) % 10 == 0
    )


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def extract_books(sql_text):
    """Lê ISBN e título das tuplas de INSERT INTO livro do seed SQL."""
    sections = re.finditer(
        r"\bINSERT\s+INTO\s+`?livro`?\s*\([^)]*\)\s*VALUES\s*"
        r"(.*?)(?=\bINSERT\s+INTO\b|\Z)", sql_text, re.I | re.S,
    )
    books = []
    for section in sections:
        for match in re.finditer(
            r"^\s*\(\s*(\d{13})\s*,\s*'((?:''|\\.|[^'])*)'",
            section.group(1), re.M,
        ):
            title = match.group(2).replace("''", "'")
            title = re.sub(r"\\(.)", r"\1", title)
            books.append((match.group(1), title))
    if not books:
        raise ValueError("Nenhum ISBN de 13 dígitos encontrado em INSERT INTO livro.")
    if len({isbn for isbn, _ in books}) != len(books):
        raise ValueError("ISBN duplicado no INSERT INTO livro.")
    return books


def jpeg_dimensions(data):
    """Extrai dimensões de um JPEG completo por seus marcadores SOF."""
    if not data.startswith(b"\xff\xd8") or not data.endswith(b"\xff\xd9"):
        return None
    offset = 2
    sof = {0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
           0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF}
    while offset < len(data) - 1:
        if data[offset] != 0xFF:
            return None
        while offset < len(data) and data[offset] == 0xFF:
            offset += 1
        if offset >= len(data):
            return None
        marker = data[offset]
        offset += 1
        if marker in {0xD9, 0xDA}:
            return None
        if marker == 0x01 or 0xD0 <= marker <= 0xD7:
            continue
        if offset + 2 > len(data):
            return None
        length = int.from_bytes(data[offset:offset + 2], "big")
        if length < 2 or offset + length > len(data):
            return None
        if marker in sof:
            if length < 8:
                return None
            height, width = struct.unpack(">HH", data[offset + 3:offset + 7])
            return width, height
        offset += length
    return None


def valid_cover_redirect(destination):
    """Permite apenas URLs HTTPS conhecidas de capas, sem query/fragment."""
    try:
        parsed = urlsplit(destination)
    except ValueError:
        return False
    if parsed.scheme != "https" or parsed.query or parsed.fragment:
        return False
    if parsed.netloc == "covers.openlibrary.org":
        return re.fullmatch(r"/b/id/[1-9][0-9]*-L\.jpg", parsed.path) is not None
    if parsed.netloc == "archive.org":
        current_archive = (
            re.fullmatch(r"/download/l_covers_[A-Za-z0-9_.-]+/[A-Za-z0-9_./-]+\.jpg", parsed.path)
            is not None
            and all(part not in {".", ".."} for part in parsed.path.split("/"))
        )
        legacy_archive = re.fullmatch(
            r"/download/olcovers([0-9]+)/olcovers\1-L\.zip/[0-9]+-L\.jpg",
            parsed.path,
        ) is not None
        return current_archive or legacy_archive
    return False


def classify_response(status, headers, body=b""):
    """Classifica uma resposta HTTP sem confundir erro transitório com ausência."""
    normalized = {key.lower(): value for key, value in headers.items()}
    result = {"http_status": status, "resultado": "resposta_invalida",
              "destino": "", "largura": "", "altura": "", "sha256": ""}
    if status in REDIRECTS:
        result["destino"] = normalized.get("location", "")
        result["resultado"] = (
            "ok_redirect" if valid_cover_redirect(result["destino"])
            else "redirecionamento_invalido"
        )
    elif status == 200:
        dimensions = jpeg_dimensions(body)
        if dimensions:
            result["largura"], result["altura"] = dimensions
            result["sha256"] = hashlib.sha256(body).hexdigest()
            if min(dimensions) >= 100:
                result["resultado"] = "ok_jpeg"
            else:
                result["resultado"] = "imagem_placeholder"
    elif status == 404:
        result["resultado"] = "sem_capa"
    elif status in {408, 425, 429} or 500 <= status <= 599:
        result["resultado"] = "erro_temporario"
    else:
        result["resultado"] = "erro_http"
    return result


def retry_delay(headers, attempt):
    value = next((value for key, value in headers.items()
                  if key.lower() == "retry-after"), None)
    if value is not None:
        try:
            delay = float(value)
        except (ValueError, TypeError):
            try:
                delay = (parsedate_to_datetime(value)
                         - datetime.now(timezone.utc)).total_seconds()
            except (ValueError, TypeError, OverflowError):
                delay = 2 ** attempt
        return min(30, max(0, delay))
    return min(8, 2 ** attempt)


def check_isbn(isbn, titulo="", timeout=25, retries=3, opener=None, sleep_fn=time.sleep):
    """Verifica um ISBN (3 novas tentativas para falhas transitórias por padrão)."""
    isbn = str(isbn)
    if not valid_isbn(isbn):
        raise ValueError("ISBN-13 inválido: confira o prefixo 978/979 e o dígito verificador.")
    url = f"https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false"
    client = opener or build_opener(NoRedirect())
    result = None
    for attempt in range(retries + 1):
        headers = {}
        try:
            request = Request(url, headers={"User-Agent": "Quote-Cover-Check/1.0",
                                           "Accept": "image/jpeg"})
            try:
                response = client.open(request, timeout=timeout)
            except HTTPError as error:
                response = error
            with response:
                status = response.code
                headers = dict(response.headers.items())
                body = response.read(MAX_BYTES + 1) if status == 200 else b""
            result = classify_response(status, headers, body) if len(body) <= MAX_BYTES else {
                "http_status": status, "resultado": "imagem_excede_limite",
                "destino": "", "largura": "", "altura": "", "sha256": "",
            }
        except (URLError, TimeoutError, OSError):
            result = {"http_status": "", "resultado": "erro_temporario",
                      "destino": "", "largura": "", "altura": "", "sha256": ""}
        if result["resultado"] != "erro_temporario" or attempt == retries:
            break
        sleep_fn(retry_delay(headers, attempt))
    return {"isbn": isbn, "titulo": titulo, "url": url,
            "verificado_em_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            **result}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sql", type=Path, default=Path(__file__).with_name("script_insert.sql"))
    parser.add_argument("--output", type=Path, default=Path("capas_verificadas.csv"))
    parser.add_argument("--isbn", action="append", help="Verifica este ISBN, em vez de ler SQL; pode repetir.")
    parser.add_argument("--workers", type=int, default=1, choices=range(1, 5))
    parser.add_argument("--timeout", type=float, default=25)
    args = parser.parse_args(argv)
    if args.timeout <= 0:
        parser.error("--timeout precisa ser positivo.")
    try:
        books = [(isbn, "") for isbn in args.isbn] if args.isbn else extract_books(
            args.sql.read_text(encoding="utf-8")
        )
        if any(not valid_isbn(isbn) for isbn, _ in books):
            raise ValueError("ISBN-13 inválido: confira o prefixo 978/979 e o dígito verificador.")
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            rows = list(pool.map(lambda book: check_isbn(*book, timeout=args.timeout), books))
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with args.output.open("w", encoding="utf-8", newline="") as file:
            writer = csv.DictWriter(file, fieldnames=FIELDS)
            writer.writeheader()
            writer.writerows(rows)
    except (OSError, ValueError) as error:
        print(f"Erro: {error}", file=sys.stderr)
        return 2
    failures = sum(row["resultado"] not in SUCCESS for row in rows)
    print(f"{len(rows) - failures}/{len(rows)} capas confirmadas; relatório: {args.output}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
