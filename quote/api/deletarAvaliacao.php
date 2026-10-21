<?php
require_once __DIR__ . '/../../Quote/api/config.php';
// Explicit paths also work when the repository has both Quote/ and quote/.
require_once __DIR__ . '/../../quote/classes/base/Banco.php';
require_once __DIR__ . '/../../quote/classes/models/Avaliacao.php';
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => false, 'mensagem' => 'Método inválido.']);
    exit;
}
if (empty($_SESSION['codigoUsuario'])) {
    http_response_code(401);
    echo json_encode(['status' => false, 'mensagem' => 'Entre novamente na sua conta para excluir a resenha.']);
    exit;
}
if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) {
    http_response_code(415);
    echo json_encode(['status' => false, 'mensagem' => 'Envie os dados em JSON.']);
    exit;
}
$corpo = json_decode(file_get_contents('php://input'), true);
$codigo = filter_var($corpo['codigoAvaliacao'] ?? null, FILTER_VALIDATE_INT);
$livro = (string) ($corpo['codigoLivro'] ?? '');
if (!$codigo || $codigo < 1 || !ctype_digit($livro)) {
    http_response_code(400);
    echo json_encode(['status' => false, 'mensagem' => 'Avaliação ou livro inválido.']);
    exit;
}
try {
    $excluida = Avaliacao::ExcluirDoUsuario($codigo, $livro, $_SESSION['codigoUsuario']);
    if (!$excluida) {
        http_response_code(404);
        echo json_encode(['status' => false, 'mensagem' => 'A resenha não existe ou não pertence a você.']);
        exit;
    }
    echo json_encode(['status' => true]);
} catch (Throwable $erro) {
    http_response_code(500);
    echo json_encode(['status' => false, 'mensagem' => 'Não foi possível excluir a resenha. Tente novamente.']);
}
