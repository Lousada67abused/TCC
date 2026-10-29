<?php
require_once __DIR__ . '/../../Quote/api/config.php';
require_once __DIR__ . '/../classes/base/Banco.php';
require_once __DIR__ . '/../classes/models/CurtidaAvaliacao.php';

function curtidasResposta($status, $mensagem) {
    http_response_code($status);
    echo json_encode(['status' => false, 'mensagem' => $mensagem]);
    exit;
}

function curtidasCabecalhos($metodo) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: ' . $metodo . ', OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Content-Type: application/json; charset=utf-8');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
    if ($_SERVER['REQUEST_METHOD'] !== $metodo) {
        header('Allow: ' . $metodo . ', OPTIONS');
        curtidasResposta(405, 'Método inválido.');
    }
}

function curtidasCodigo($valor) {
    if ((!is_int($valor) && !is_string($valor)) || !preg_match('/^[1-9][0-9]{0,9}$/D', (string) $valor) || $valor > 2147483647) return false;
    return (int) $valor;
}

function curtidasLivro($valor) {
    if ((!is_int($valor) && !is_string($valor)) || !preg_match('/^[1-9][0-9]{0,18}$/D', (string) $valor)) return false;
    $texto = (string) $valor;
    if (strlen($texto) === 19 && strcmp($texto, '9223372036854775807') > 0) return false;
    return $texto;
}

function curtidasErro($erro) {
    if ($erro instanceof DomainException && in_array($erro->getCode(), [400, 401, 404], true)) {
        curtidasResposta($erro->getCode(), $erro->getMessage());
    }
    curtidasResposta(500, 'Não foi possível atualizar as curtidas. Tente novamente.');
}

function curtidasAlterar($curtir) {
    curtidasCabecalhos('POST');
    $usuario = curtidasCodigo($_SESSION['codigoUsuario'] ?? null);
    if (!$usuario) curtidasResposta(401, 'Entre novamente na sua conta para curtir avaliações.');
    if (!preg_match('/^application\/json(?:\s*;|$)/i', $_SERVER['CONTENT_TYPE'] ?? '')) {
        curtidasResposta(415, 'Envie os dados em JSON.');
    }
    $corpo = json_decode(file_get_contents('php://input'), true);
    if (!is_array($corpo)) curtidasResposta(400, 'Dados inválidos.');
    $avaliacao = curtidasCodigo($corpo['codigoAvaliacao'] ?? null);
    if (!$avaliacao) curtidasResposta(400, 'Selecione uma avaliação válida.');
    if (array_key_exists('codigoUsuario', $corpo) && curtidasCodigo($corpo['codigoUsuario']) !== $usuario) {
        curtidasResposta(403, 'Você pode alterar apenas suas próprias curtidas.');
    }
    $livro = null;
    if ($curtir || array_key_exists('codigoLivro', $corpo)) {
        $livro = curtidasLivro($corpo['codigoLivro'] ?? null);
        if ($livro === false) curtidasResposta(400, 'Selecione um livro válido.');
    }
    try {
        $estado = CurtidaAvaliacao::Definir($usuario, $avaliacao, $livro, $curtir);
        echo json_encode(['status' => true,
            'resposta' => $curtir ? 'Avaliação curtida com sucesso!' : 'Avaliação descurtida com sucesso!',
            'estado' => $estado]);
    } catch (Throwable $erro) {
        curtidasErro($erro);
    }
}
