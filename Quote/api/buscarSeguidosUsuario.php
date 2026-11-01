<?php
require_once __DIR__ . '/config.php';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo != 'GET') 
{ 
	http_response_code(405);
	echo json_encode(['status' => 'false', 'mensagem' => 'Método inválido.']);
	return;
}

$valor = $_GET['codigoUsuario'] ?? null;
$codigoUsuario = is_string($valor) ? filter_var($valor, FILTER_VALIDATE_INT) : false;
if (!$codigoUsuario || $codigoUsuario < 1 || $codigoUsuario > 2147483647) {
	http_response_code(400);
	echo json_encode(['status' => 'false', 'mensagem' => 'Selecione um leitor válido.']);
	return;
}

try {
	$seguidos = SeguidorController::buscarSeguidosUsuario($codigoUsuario);
	if ($seguidos === null) {
		http_response_code(404);
		echo json_encode(['status' => 'false', 'mensagem' => 'Leitor não encontrado.']);
		return;
	}

	http_response_code(200);
	echo json_encode(['status' => 'true', 'resposta' => $seguidos]);
} catch (Throwable $erro) {
	http_response_code(500);
	echo json_encode(['status' => 'false', 'mensagem' => 'Não foi possível carregar os leitores seguidos. Tente novamente.']);
}
