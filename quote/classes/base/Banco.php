<?php
class Banco
{
	private static $conexao = null;

	private static function Conectar()
	{
		if (self::$conexao !== null) {
			return;
		}

		try {
			self::$conexao = new PDO(
				'mysql:host=localhost;dbname=quote;charset=utf8mb4', 'root', 'root',
				[
					PDO::ATTR_ERRMODE			=> PDO::ERRMODE_EXCEPTION,
					PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
					PDO::ATTR_EMULATE_PREPARES   => false,
					PDO::ATTR_PERSISTENT		 => true
				]
			);
		} catch (PDOException $Erro) {
			throw new Exception('Erro ao conectar ao Servidor.');
		}
	}

	protected static function Consultar($nomeProcedure, $parametros = [])
	{
		self::Conectar();

		$placeholders = [];
		foreach ($parametros as $chave => $valor) {
			$placeholders[] = ':' . $chave;
		}

		$sql = 'CALL ' . $nomeProcedure;
		if ($placeholders) {
			$sql .= '(' . implode(', ', $placeholders) . ')';
		}

		$cSQL = self::$conexao->prepare($sql);

		foreach ($parametros as $chave => $valor) {
			$cSQL->bindValue(':' . $chave, $valor);
		}

		$cSQL->execute();
		$dados = $cSQL->fetchAll(PDO::FETCH_ASSOC);

		$cSQL->closeCursor();

		return $dados;
	}

	protected static function Executar($nomeProcedure, $parametros = [])
	{
		self::Conectar();

		$placeholders = [];
		foreach ($parametros as $chave => $valor) {
			$placeholders[] = ':' . $chave;
		}

		$sql = 'CALL ' . $nomeProcedure;
		if ($placeholders) {
			$sql .= '(' . implode(', ', $placeholders) . ')';
		}

		$cSQL = self::$conexao->prepare($sql);

		foreach ($parametros as $chave => $valor) {
			$cSQL->bindValue(':' . $chave, $valor);
		}

		$cSQL->execute();

		$cSQL->closeCursor();
	}
}
?>