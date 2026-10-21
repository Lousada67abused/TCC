<?php
require_once('config.php');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo != 'GET') 
{ 
	http_response_code(400); 
	echo json_encode(['mensagem' => 'Método Inválido']); 
	return;
}

try {
	// Código da sua API

	if (!isset($_GET['avaliacao']) || $_GET['avaliacao'] == '') {
		http_response_code(400);
		echo json_encode(['mensagem' => 'Parâmetros obrigatórios insuficientes']);
		return;
	}
	$avaliacao = $_GET['avaliacao'];

	$resposta = ComentarioController::buscarComentarioAvaliacao($avaliacao);

	http_response_code(200);
	echo json_encode(['status' => 'true', 'resposta' => $resposta]);
} catch (Exception $erro) {
	http_response_code(500);
	echo json_encode(['status' => 'false', 'erro' => $erro->getMessage()]);
}