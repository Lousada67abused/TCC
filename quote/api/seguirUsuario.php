<?php
require_once __DIR__ . '/../../Quote/api/config.php';
require_once __DIR__ . '/../classes/base/Banco.php';
require_once __DIR__ . '/../../Quote/classes/models/Seguidor.php';
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
    echo json_encode(['status' => false, 'mensagem' => 'Entre na sua conta para seguir leitores.']);
    exit;
}
if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) {
    http_response_code(415);
    echo json_encode(['status' => false, 'mensagem' => 'Envie os dados em JSON.']);
    exit;
}
$corpo = json_decode(file_get_contents('php://input'), true);
$alvo = is_array($corpo) ? ($corpo['codigoSeguido'] ?? null) : null;
$codigo = is_int($alvo) || is_string($alvo) ? filter_var($alvo, FILTER_VALIDATE_INT) : false;
if (!$codigo || $codigo < 1 || $codigo > 2147483647) {
    http_response_code(400);
    echo json_encode(['status' => false, 'mensagem' => 'Selecione um leitor válido.']);
    exit;
}
$seguidor = (int) $_SESSION['codigoUsuario'];
if (array_key_exists('codigoSeguidor', $corpo) &&
    ((!is_int($corpo['codigoSeguidor']) && !is_string($corpo['codigoSeguidor'])) ||
    (string) $corpo['codigoSeguidor'] !== (string) $seguidor)) {
    http_response_code(403);
    echo json_encode(['status' => false, 'mensagem' => 'Você pode alterar apenas seus próprios seguidos.']);
    exit;
}
if ($codigo === $seguidor) {
    http_response_code(400);
    echo json_encode(['status' => false, 'mensagem' => 'Você não pode seguir a si mesmo.']);
    exit;
}
try {
    $estado = Seguidor::DefinirSeguimento($seguidor, $codigo, true);
    if ($estado === null) {
        http_response_code(404);
        echo json_encode(['status' => false, 'mensagem' => 'Leitor não encontrado.']);
        exit;
    }
    echo json_encode(['status' => true, 'resposta' => $estado]);
} catch (Throwable $erro) {
    http_response_code(500);
    echo json_encode(['status' => false, 'mensagem' => 'Não foi possível atualizar o acompanhamento. Tente novamente.']);
}
