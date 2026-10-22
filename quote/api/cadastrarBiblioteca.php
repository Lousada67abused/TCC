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
	$corpo = json_decode(file_get_contents("php://input"));
	if (!validaCorpoRequisicao($corpo)) {
		return;
	}
	$corpo = (array) $corpo;
	$chaves = ['codigoLivro','status','visivel','codigoUsuario'];
	if (!validaChaves($corpo, $chaves)) {
		return;
	}
	$codigoLivro = $corpo['codigoLivro'];
	$status = $corpo['status'];
	$visivel = $corpo['visivel'];
	$codigoUsuario = $corpo['codigoUsuario'];
	$favorito = array_key_exists('favorito', $corpo) ? $corpo['favorito'] : 0;

	if (!validaCodigo($codigoLivro, '9223372036854775807') || !validaCodigo($codigoUsuario, '2147483647')) {
		http_response_code(400);
		echo json_encode(['mensagem' => 'Os códigos do livro e do usuário devem ser inteiros positivos válidos.']);
		return;
	}
	if (!in_array($status, ['lido', 'lendo', 'quero ler', 'desisti'], true)) {
		http_response_code(400);
		echo json_encode(['mensagem' => 'Status inválido. Use lido, lendo, quero ler ou desisti.']);
		return;
	}
	if (!in_array($favorito, [0, 1, '0', '1'], true) || !in_array($visivel, [0, 1, '0', '1'], true)) {
		http_response_code(400);
		echo json_encode(['mensagem' => 'Favorito e visível devem ser 0 ou 1.']);
		return;
	}

	BibliotecaController::cadastrar((int) $codigoLivro, $status, (int) $visivel, (int) $codigoUsuario, (int) $favorito);
	
	http_response_code(200);
	echo json_encode(['status' => 'true', 'mensagem' => 'Biblioteca cadastrada com sucesso!']);
} catch (Exception $erro) {
	http_response_code(500);
	echo json_encode(['status' => 'false', 'erro' => $erro->getMessage()]);
}

function validaCorpoRequisicao($corpo) {
	if (!($corpo instanceof stdClass))
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
		if ($corpo[$campos[$i]] === '' || $corpo[$campos[$i]] === null){
			http_response_code(400);
			echo json_encode(['mensagem'=>'Dados incorretos. Verifique a documentação da API e tente novamente!']);
			return false;
		}
	}
	return true;
}

function validaCodigo($valor, $maximo) {
	if (!is_int($valor) && !is_string($valor)) return false;
	$codigo = (string) $valor;
	if (!preg_match('/^[1-9][0-9]*$/D', $codigo)) return false;
	return strlen($codigo) < strlen($maximo) ||
		(strlen($codigo) === strlen($maximo) && strcmp($codigo, $maximo) <= 0);
}
?>
