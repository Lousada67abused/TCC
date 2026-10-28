<?php
require_once __DIR__ . '/_curtidasAvaliacao.php';
curtidasCabecalhos('GET');
$avaliacao = curtidasCodigo($_GET['codigoAvaliacao'] ?? null);
if (!$avaliacao) curtidasResposta(400, 'Selecione uma avaliação válida.');
$livro = null;
if (array_key_exists('codigoLivro', $_GET)) {
    $livro = curtidasLivro($_GET['codigoLivro']);
    if ($livro === false) curtidasResposta(400, 'Selecione um livro válido.');
}
$observador = curtidasCodigo($_SESSION['codigoUsuario'] ?? null);
try {
    $estado = CurtidaAvaliacao::Estado($avaliacao, $observador ?: null, $livro);
    echo json_encode(['status' => true,
        'resposta' => [['quantidade_curtidas' => $estado['quantidade_curtidas']]],
        'estado' => $estado]);
} catch (Throwable $erro) {
    curtidasErro($erro);
}
