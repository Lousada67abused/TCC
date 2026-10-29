<?php
require_once __DIR__ . '/_comentariosAvaliacao.php';
comentariosCabecalhos('POST');
$usuario = comentariosCodigo($_SESSION['codigoUsuario'] ?? null);
if (!$usuario) comentariosResposta(401, 'Entre novamente na sua conta para comentar.');
if (!preg_match('/^application\/json(?:\s*;|$)/i', $_SERVER['CONTENT_TYPE'] ?? '')) comentariosResposta(415, 'Envie os dados em JSON.');
$corpo = json_decode(file_get_contents('php://input'), true);
if (!is_array($corpo)) comentariosResposta(400, 'Dados inválidos.');
$avaliacao = comentariosCodigo($corpo['codigoAvaliacao'] ?? null);
if (!$avaliacao) comentariosResposta(400, 'Selecione uma avaliação válida.');
if (array_key_exists('codigoUsuario', $corpo) && comentariosCodigo($corpo['codigoUsuario']) !== $usuario) {
    comentariosResposta(403, 'Você pode enviar comentários apenas pela sua própria conta.');
}
$livro = null;
if (array_key_exists('codigoLivro', $corpo)) {
    $livro = comentariosLivro($corpo['codigoLivro']);
    if ($livro === false) comentariosResposta(400, 'Selecione um livro válido.');
}
$texto = $corpo['texto'] ?? ($corpo['codigo'] ?? null);
if (is_string($texto)) $texto = preg_replace('/^[\s\p{Z}]+|[\s\p{Z}]+$/u', '', $texto);
if (!is_string($texto) || preg_match('/^.{1,500}$/usD', $texto) !== 1 || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', $texto)) {
    comentariosResposta(400, 'Digite um comentário de 1 a 500 caracteres.');
}
$token = $corpo['requisicaoId'] ?? ($corpo['chaveEnvio'] ?? null);
if ((array_key_exists('requisicaoId', $corpo) || array_key_exists('chaveEnvio', $corpo)) &&
    (!is_string($token) || preg_match('/^[A-Za-z0-9_-]{16,100}$/D', $token) !== 1 ||
    (isset($corpo['requisicaoId'], $corpo['chaveEnvio']) && $corpo['requisicaoId'] !== $corpo['chaveEnvio']))) {
    comentariosResposta(400, 'Identificador de envio inválido.');
}
$envios = $_SESSION['enviosComentarios'] ?? [];
if (!is_array($envios)) $envios = [];
$agora = time();
foreach ($envios as $chave => $envio) if (!is_array($envio) || ($envio['data'] ?? 0) < $agora - 86400) unset($envios[$chave]);
$hash = hash('sha256', json_encode([$usuario, $avaliacao, $texto], JSON_UNESCAPED_UNICODE));
$chaveToken = $token !== null ? 'envio:' . $token : null;
try {
    if ($chaveToken !== null && isset($envios[$chaveToken])) {
        $envio = $envios[$chaveToken];
        if (($envio['hash'] ?? '') !== $hash) comentariosResposta(409, 'Este identificador de envio já foi usado para outro comentário.');
        $resultado = Comentario::RepetirEnvio($envio['codigo'], $texto, $usuario, $avaliacao, $livro);
    } else {
        $resultado = Comentario::CadastrarDoUsuario($texto, $usuario, $avaliacao, $livro);
        if ($chaveToken !== null) {
            $envios[$chaveToken] = ['hash' => $hash, 'codigo' => (int) $resultado['comentario']['id_comentario'], 'data' => $agora];
            while (count($envios) > 200) array_shift($envios);
            $_SESSION['enviosComentarios'] = $envios;
        }
    }
    echo json_encode(['status' => true, 'resposta' => 'Comentário enviado com sucesso!'] + $resultado);
} catch (Throwable $erro) {
    comentariosErro($erro);
}
