<?php
require_once __DIR__ . '/../../Quote/api/config.php';
require_once __DIR__ . '/../classes/base/Banco.php';
require_once __DIR__ . '/../classes/models/PerfilPublico.php';
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => false, 'mensagem' => 'Método inválido.']);
    exit;
}
$codigo = filter_var($_GET['codigoUsuario'] ?? null, FILTER_VALIDATE_INT);
if (!$codigo || $codigo < 1 || $codigo > 2147483647) {
    http_response_code(400);
    echo json_encode(['status' => false, 'mensagem' => 'Selecione um leitor válido.']);
    exit;
}
try {
    $perfil = PerfilPublico::Buscar($codigo, $_SESSION['codigoUsuario'] ?? null);
    if (!$perfil) {
        http_response_code(404);
        echo json_encode(['status' => false, 'mensagem' => 'Leitor não encontrado.']);
        exit;
    }
    echo json_encode(['status' => true, 'resposta' => $perfil]);
} catch (Throwable $erro) {
    http_response_code(500);
    echo json_encode(['status' => false, 'mensagem' => 'Não foi possível carregar este perfil. Tente novamente.']);
}
