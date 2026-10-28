<?php
require_once __DIR__ . '/_comentariosAvaliacao.php';
comentariosCabecalhos('GET');
$avaliacao = comentariosCodigo($_GET['avaliacao'] ?? null);
if (!$avaliacao) comentariosResposta(400, 'Selecione uma avaliação válida.');
$livro = null;
if (array_key_exists('codigoLivro', $_GET)) {
    $livro = comentariosLivro($_GET['codigoLivro']);
    if ($livro === false) comentariosResposta(400, 'Selecione um livro válido.');
}
$resumo = $_GET['resumo'] ?? '0';
if (!is_string($resumo) || !in_array($resumo, ['0', '1'], true)) comentariosResposta(400, 'Resumo inválido.');
$observador = comentariosCodigo($_SESSION['codigoUsuario'] ?? null);
try {
    echo json_encode(['status' => true] + Comentario::Listar($avaliacao, $observador ?: null, $livro, $resumo === '1'));
} catch (Throwable $erro) {
    comentariosErro($erro);
}
