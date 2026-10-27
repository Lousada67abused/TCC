<?php
require_once __DIR__ . '/../../Quote/api/config.php';
require_once __DIR__ . '/../classes/base/Banco.php';
require_once __DIR__ . '/../classes/models/Avaliacao.php';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => false, 'mensagem' => 'Método inválido.']);
    exit;
}
if (empty($_SESSION['codigoUsuario'])) {
    http_response_code(401);
    echo json_encode(['status' => false, 'mensagem' => 'Entre novamente na sua conta para editar a resenha.']);
    exit;
}
if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) {
    http_response_code(415);
    echo json_encode(['status' => false, 'mensagem' => 'Envie os dados em JSON.']);
    exit;
}
$corpo = json_decode(file_get_contents('php://input'), true);
if (!is_array($corpo)) {
    http_response_code(400);
    echo json_encode(['status' => false, 'mensagem' => 'Dados inválidos.']);
    exit;
}
$codigo = $corpo['codigo'] ?? null;
$livro = $corpo['codigoLivro'] ?? null;
$nota = $corpo['nota'] ?? null;
$resenha = $corpo['resenha'] ?? null;
if ((!is_int($codigo) && !is_string($codigo)) || !filter_var($codigo, FILTER_VALIDATE_INT) || $codigo < 1 ||
    (!is_int($livro) && !is_string($livro)) || !preg_match('/^[1-9][0-9]{0,18}$/D', (string) $livro)) {
    http_response_code(400);
    echo json_encode(['status' => false, 'mensagem' => 'Avaliação ou livro inválido.']);
    exit;
}
if ((!is_int($nota) && !is_string($nota)) || filter_var($nota, FILTER_VALIDATE_INT) === false || $nota < 1 || $nota > 5) {
    http_response_code(400);
    echo json_encode(['status' => false, 'mensagem' => 'Selecione uma nota de 1 a 5.']);
    exit;
}
if (!is_string($resenha) || preg_match('/^.{0,500}$/usD', $resenha) !== 1) {
    http_response_code(400);
    echo json_encode(['status' => false, 'mensagem' => 'A resenha deve ser um texto de até 500 caracteres.']);
    exit;
}
try {
    $atualizada = Avaliacao::AtualizarDoUsuario($codigo, $livro, $_SESSION['codigoUsuario'], (int) $nota, trim($resenha));
    if (!$atualizada) {
        http_response_code(404);
        echo json_encode(['status' => false, 'mensagem' => 'A resenha não existe ou não pertence a você.']);
        exit;
    }
    echo json_encode(['status' => true, 'resposta' => 'Avaliação atualizada com sucesso!']);
} catch (Throwable $erro) {
    http_response_code(500);
    echo json_encode(['status' => false, 'mensagem' => 'Não foi possível editar a resenha. Tente novamente.']);
}
