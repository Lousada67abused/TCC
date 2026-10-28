<?php
require_once __DIR__ . '/../../Quote/api/config.php';
require_once __DIR__ . '/../classes/base/Banco.php';
require_once __DIR__ . '/../classes/models/Usuario.php';
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
    echo json_encode(['status' => false, 'mensagem' => 'Entre novamente na sua conta para editar o nome.']);
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
if ((!is_int($codigo) && !is_string($codigo)) ||
    !filter_var($codigo, FILTER_VALIDATE_INT) || $codigo < 1 || $codigo > 2147483647) {
    http_response_code(400);
    echo json_encode(['status' => false, 'mensagem' => 'Conta inválida.']);
    exit;
}
if ((string) $codigo !== (string) $_SESSION['codigoUsuario']) {
    http_response_code(403);
    echo json_encode(['status' => false, 'mensagem' => 'Você pode editar apenas o seu próprio nome.']);
    exit;
}
$nome = $corpo['nome'] ?? null;
if (is_string($nome)) $nome = preg_replace('/^[\s\p{Z}]+|[\s\p{Z}]+$/u', '', $nome);
if (!is_string($nome) || preg_match('/^[^\p{Cc}]{1,80}$/uD', $nome) !== 1) {
    http_response_code(400);
    echo json_encode(['status' => false, 'mensagem' => 'Digite um nome de usuário de 1 a 80 caracteres, em uma única linha.']);
    exit;
}
try {
    $usuario = Usuario::AtualizarNome($_SESSION['codigoUsuario'], $nome);
    if ($usuario === null) {
        http_response_code(404);
        echo json_encode(['status' => false, 'mensagem' => 'Usuário não encontrado.']);
        exit;
    }
    echo json_encode(['status' => true, 'resposta' => $usuario]);
} catch (Throwable $erro) {
    http_response_code(500);
    echo json_encode(['status' => false, 'mensagem' => 'Não foi possível salvar o nome. Tente novamente.']);
}
