<?php
require_once('cors.php');
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
	$corpo = json_decode(file_get_contents("php://input"), true);
	if (!validaCorpoRequisicao($corpo)) {
		return;
	}

	$chaves = ['codigoUsuario', 'codigoLivro', 'nota', 'resenha'];
	if (!validaChaves($corpo, $chaves)) {
		return;
	}

	$codigoUsuario = $corpo['codigoUsuario'];
	$codigoLivro = $corpo['codigoLivro'];
	$nota = $corpo['nota'];
	if (!is_string($corpo['resenha']) || preg_match('/^.{0,500}$/usD', $corpo['resenha']) !== 1) {
		http_response_code(400);
		echo json_encode(['status' => false, 'mensagem' => 'A resenha deve ser um texto de até 500 caracteres.']);
		return;
	}
	$resenha = trim($corpo['resenha']);

	if (filter_var($nota, FILTER_VALIDATE_INT) === false || $nota < 1 || $nota > 5) {
		http_response_code(400);
		echo json_encode(['status' => false, 'mensagem' => 'Selecione uma nota de 1 a 5.']);
		return;
	}

	$avaliacoes = AvaliacaoController::buscarAvaliacaoLivro($codigoLivro);
	foreach ($avaliacoes as $avaliacao) {
		if ((string) $avaliacao['id_usuario'] === (string) $codigoUsuario) {
			http_response_code(409);
			echo json_encode(['status' => false, 'mensagem' => 'Você já publicou uma resenha deste livro.']);
			return;
		}
	}

	AvaliacaoController::avaliarLivro($codigoUsuario, $codigoLivro, $nota, $resenha);

	http_response_code(200);
	echo json_encode(['status' => true, 'resultado' => "Avaliação realizada com sucesso!"]);
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
		if ($campos[$i] !== 'resenha' && ($corpo[$campos[$i]] === '' || $corpo[$campos[$i]] === null)){
			http_response_code(400);
			echo json_encode(['mensagem'=>'Dados incorretos. Verifique a documentação da API e tente novamente!']);
			return false;
		}
	}
	return true;
}
?>
