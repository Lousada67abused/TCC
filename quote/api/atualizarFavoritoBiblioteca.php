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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	http_response_code(400);
	echo json_encode(['mensagem' => 'Método Inválido']);
	return;
}

try {
	$corpo = json_decode(file_get_contents('php://input'));
	if (!validaCorpoRequisicao($corpo)) {
		return;
	}
	$corpo = (array) $corpo;
	if (!validaChaves($corpo, ['codigoUsuario', 'codigoLivro', 'favorito'])) {
		return;
	}
	$codigoUsuario = $corpo['codigoUsuario'];
	$codigoLivro = $corpo['codigoLivro'];
	$favorito = $corpo['favorito'];

	if (!validaCodigo($codigoLivro, '9223372036854775807') || !validaCodigo($codigoUsuario, '2147483647')) {
		http_response_code(400);
		echo json_encode(['mensagem' => 'Os códigos do livro e do usuário devem ser inteiros positivos válidos.']);
		return;
	}
	if (!in_array($favorito, [0, 1, '0', '1'], true)) {
		http_response_code(400);
		echo json_encode(['mensagem' => 'Favorito deve ser 0 ou 1.']);
		return;
	}

	BibliotecaController::atualizarFavoritoBiblioteca((int) $codigoUsuario, (int) $codigoLivro, (int) $favorito);

	http_response_code(200);
	echo json_encode(['status' => 'true', 'resposta' => 'Favorito atualizado com sucesso!']);
} catch (Exception $erro) {
	http_response_code(500);
	echo json_encode(['status' => 'false', 'erro' => $erro->getMessage()]);
}

function validaCorpoRequisicao($corpo) {
	if (!($corpo instanceof stdClass)) {
		http_response_code(400);
		echo json_encode(['mensagem' => 'Dados Inválidos!']);
		return false;
	}
	return true;
}

function validaChaves($corpo, $campos) {
	foreach ($campos as $campo) {
		if (!array_key_exists($campo, $corpo) || $corpo[$campo] === '' || $corpo[$campo] === null) {
			http_response_code(400);
			echo json_encode(['mensagem' => 'Dados incorretos. Verifique a documentação da API e tente novamente!']);
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
