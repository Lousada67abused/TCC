<?php
require_once __DIR__ . '/_avatarUsuario.php';
avatarCabecalhos('GET');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$codigo = AvatarUsuario::Codigo($_GET['codigoUsuario'] ?? null);
if (!$codigo) avatarRespostaErro(400, 'Selecione um usuário válido.');
$observador = AvatarUsuario::Codigo($_SESSION['codigoUsuario'] ?? null);
try {
    echo json_encode(['status' => true, 'resposta' => AvatarUsuario::Metadados($codigo, $observador ?: null)]);
} catch (Throwable $erro) { avatarErro($erro); }
