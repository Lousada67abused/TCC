<?php
require_once __DIR__ . '/_avatarUsuario.php';
avatarCabecalhos('POST');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$usuario = AvatarUsuario::Codigo($_SESSION['codigoUsuario'] ?? null);
if (!$usuario) avatarRespostaErro(401, 'Entre novamente na sua conta para editar a foto.');
avatarVerificarOrigem();
if (!preg_match('/^multipart\/form-data(?:\s*;|$)/i', $_SERVER['CONTENT_TYPE'] ?? '')) avatarRespostaErro(415, 'Envie a foto pelo formulário de upload.');
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 8388608) avatarRespostaErro(413, 'A foto deve ter no máximo 5 MB.');
$codigo = AvatarUsuario::Codigo($_POST['codigoUsuario'] ?? null);
if (!$codigo) avatarRespostaErro(400, 'Conta inválida.');
if ($codigo !== $usuario) avatarRespostaErro(403, 'Você pode editar apenas a sua própria foto.');
$acao = $_POST['acao'] ?? null;
if ($acao !== null && $acao !== 'remover') avatarRespostaErro(400, 'Ação inválida.');
try {
    if ($acao === 'remover') AvatarUsuario::Remover($codigo);
    else AvatarUsuario::Salvar($codigo, $_FILES['foto'] ?? null);
    echo json_encode(['status' => true, 'resposta' => AvatarUsuario::Metadados($codigo, $usuario)]);
} catch (Throwable $erro) { avatarErro($erro); }
