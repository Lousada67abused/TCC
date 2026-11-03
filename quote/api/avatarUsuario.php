<?php
require_once __DIR__ . '/_avatarUsuario.php';
avatarCabecalhos('GET, HEAD', false);
$codigo = AvatarUsuario::Codigo($_GET['codigoUsuario'] ?? null);
if (!$codigo) avatarRespostaErro(400, 'Selecione um usuário válido.');
try {
    $imagem = AvatarUsuario::Abrir($codigo);
    try {
        $etag = '"' . $imagem['versao'] . '"';
        header('Content-Type: ' . $imagem['tipo']);
        header('Cache-Control: public, no-cache');
        header('ETag: ' . $etag);
        header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $imagem['modificado']) . ' GMT');
        $inalterado = false;
        if (isset($_SERVER['HTTP_IF_NONE_MATCH'])) {
            foreach (explode(',', $_SERVER['HTTP_IF_NONE_MATCH']) as $valor) {
                if (in_array(trim($valor), ['*', $etag, 'W/' . $etag], true)) $inalterado = true;
            }
        } elseif (isset($_SERVER['HTTP_IF_MODIFIED_SINCE'])) {
            $desde = strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']);
            $inalterado = $desde !== false && $imagem['modificado'] <= $desde;
        }
        if ($inalterado) { http_response_code(304); }
        else {
            header('Content-Length: ' . $imagem['tamanho']);
            if ($_SERVER['REQUEST_METHOD'] !== 'HEAD') fpassthru($imagem['arquivo']);
        }
    } finally { fclose($imagem['arquivo']); }
} catch (Throwable $erro) { avatarErro($erro); }
