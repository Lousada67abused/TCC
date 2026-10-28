<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/../../quote/classes/base/Banco.php';
require_once __DIR__ . '/../classes/models/Comentario.php';

function comentariosResposta($codigo, $mensagem) {
    http_response_code($codigo);
    echo json_encode(['status' => false, 'mensagem' => $mensagem]);
    exit;
}

function comentariosCabecalhos($metodo) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: ' . $metodo . ', OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Content-Type: application/json; charset=utf-8');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
    if ($_SERVER['REQUEST_METHOD'] !== $metodo) {
        header('Allow: ' . $metodo . ', OPTIONS');
        comentariosResposta(405, 'Método inválido.');
    }
}

function comentariosCodigo($valor) {
    if ((!is_string($valor) && !is_int($valor)) || !preg_match('/^[1-9][0-9]{0,9}$/D', (string) $valor) || $valor > 2147483647) return false;
    return (int) $valor;
}

function comentariosLivro($valor) {
    if ((!is_string($valor) && !is_int($valor)) || !preg_match('/^[1-9][0-9]{0,18}$/D', (string) $valor)) return false;
    $texto = (string) $valor;
    if (strlen($texto) === 19 && strcmp($texto, '9223372036854775807') > 0) return false;
    return $texto;
}

function comentariosErro($erro) {
    if ($erro instanceof DomainException && in_array($erro->getCode(), [400, 401, 404, 409, 503], true)) {
        comentariosResposta($erro->getCode(), $erro->getMessage());
    }
    comentariosResposta(500, 'Não foi possível carregar ou enviar os comentários. Tente novamente.');
}
