<?php
require_once __DIR__ . '/../classes/base/Banco.php';
require_once __DIR__ . '/../classes/models/AvatarUsuario.php';

function avatarRespostaErro($codigo, $mensagem) {
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(['status' => false, 'mensagem' => $mensagem]);
    exit;
}

function avatarCabecalhos($metodo, $sessao = true) {
    if ($sessao) require_once __DIR__ . '/../../Quote/api/config.php';
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: ' . $metodo . ', OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('X-Content-Type-Options: nosniff');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
    $permitidos = explode(', ', $metodo);
    if (!in_array($_SERVER['REQUEST_METHOD'], $permitidos, true)) {
        header('Allow: ' . $metodo . ', OPTIONS');
        avatarRespostaErro(405, 'Método inválido.');
    }
}

function avatarErro($erro) {
    if ($erro instanceof DomainException && in_array($erro->getCode(), [400, 401, 403, 404, 413, 415, 422, 503], true)) {
        avatarRespostaErro($erro->getCode(), $erro->getMessage());
    }
    avatarRespostaErro(500, 'Não foi possível atualizar a foto de perfil. Tente novamente.');
}

function avatarNormalizarOrigem($valor, $somenteOrigem = false) {
    if (!is_string($valor)) return null;
    $valor = trim($valor);
    if ($valor === '' || preg_match('/[\x00-\x20\x7F]/', $valor)) return null;
    $url = parse_url($valor);
    if (!$url || !isset($url['scheme'], $url['host']) || isset($url['user']) || isset($url['pass'])) return null;
    $protocolo = strtolower($url['scheme']);
    if (!in_array($protocolo, ['http', 'https'], true)) return null;
    if ($somenteOrigem && ((!empty($url['path']) && $url['path'] !== '/') || isset($url['query']) || isset($url['fragment']))) return null;
    $host = strtolower($url['host']);
    if ($host !== '' && $host[0] === '[') {
        if (substr($host, -1) !== ']') return null;
        $endereco = substr($host, 1, -1);
        if (!filter_var($endereco, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) return null;
        $host = inet_ntop(inet_pton($endereco));
    } else {
        $host = rtrim($host, '.');
        if ($host === '' || strlen($host) > 253 || !preg_match('/^[a-z0-9._-]+$/D', $host)) return null;
    }
    $porta = $url['port'] ?? ($protocolo === 'https' ? 443 : 80);
    if (!is_int($porta) || $porta < 1 || $porta > 65535) return null;
    return ['host' => $host, 'porta' => $porta];
}

function avatarVerificarOrigem() {
    if (strtolower(trim($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '')) === 'cross-site') {
        avatarRespostaErro(403, 'Envie a foto pela página do próprio Quote.');
    }
    $origemPresente = array_key_exists('HTTP_ORIGIN', $_SERVER);
    $refererPresente = array_key_exists('HTTP_REFERER', $_SERVER);
    // Clientes de API sem os cabeçalhos do navegador continuam usando a sessão autenticada.
    if (!$origemPresente && !$refererPresente) return;
    $protocolo = !empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off' ? 'https' : 'http';
    $destino = avatarNormalizarOrigem($protocolo . '://' . ($_SERVER['HTTP_HOST'] ?? ''), true);
    $origem = avatarNormalizarOrigem($origemPresente ? $_SERVER['HTTP_ORIGIN'] : $_SERVER['HTTP_REFERER'], $origemPresente);
    if ($destino === null || $origem === null || $origem !== $destino) {
        avatarRespostaErro(403, 'Envie a foto pela página do próprio Quote.');
    }
}
