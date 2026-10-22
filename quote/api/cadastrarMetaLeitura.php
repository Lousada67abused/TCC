<?php
require_once('config.php');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
	http_response_code(200);
	exit();
}

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo != 'POST') 
{ 
	http_response_code(400); 
	echo json_encode(['mensagem' => 'Método Inválido']); 
	return;
}

try {
	// Código da sua API

	$corpo = json_decode(file_get_contents("php://input"), true);
	if (!validaCorpoRequisicao($corpo)) {
		return;
	}
	$chaves = ['qntLivros','data','codigoUsuario'];
	if (!validaChaves($corpo, $chaves)) {
		return;
	}
	$qntLivros = $corpo['qntLivros'];
	$data = $corpo['data'];
	$codigoUsuario = $corpo['codigoUsuario'];

	MetaLeituraController::cadastrar($qntLivros, $data, $codigoUsuario);

	http_response_code(200);
	echo json_encode(['status' => 'true', 'resposta' => 'Meta de leitura cadastrada com sucesso!']);
} catch (InvalidArgumentException $erro) {
	http_response_code(400);
	echo json_encode(['status' => 'false', 'erro' => $erro->getMessage()]);
} catch (Exception $erro) {
	http_response_code(500);
	echo json_encode(['status' => 'false', 'erro' => $erro->getMessage()]);
}

function validaCorpoRequisicao($corpo) {
	if (!is_array($corpo))
	{
		http_response_code(400);
		echo json_encode(['mensagem'=>'Dados Inválidos!']);
		return false;
	}
	return true;
}

function validaChaves($corpo, $campos) {
	for ($i=0; $i < count($campos); $i++) { 
		if (!array_key_exists($campos[$i], $corpo))
		{
			http_response_code(400);
			echo json_encode(['mensagem'=>'Dados incorretos. Verifique a documentação da API e tente novamente!']);
			return false;
		}
		if ($corpo[$campos[$i]] == ''){
			http_response_code(400);
			echo json_encode(['mensagem'=>'Dados incorretos. Verifique a documentação da API e tente novamente!']);
			return false;
		}
	}
	return true;
}
?>