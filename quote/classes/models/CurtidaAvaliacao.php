<?php 
class CurtidaAvaliacao extends Banco {
	public $CodigoUsuario;
	public $CodigoAvaliacao;
	public $CodigoLivro;

	
	public function __construct($codigoUsuario = null, $codigoAvaliacao = null, $codigoLivro = null) {
		$this->CodigoUsuario = $codigoUsuario;
		$this->CodigoAvaliacao = $codigoAvaliacao;
		$this->CodigoLivro = $codigoLivro;
	}

	public static function Curtir($codigoUsuario, $codigoAvaliacao, $codigoLivro) {
		$parametros = [
			'pCodigoUsuario' => $codigoUsuario,
			'pCodigoAvaliacao' => $codigoAvaliacao,
			'pCodigoLivro' => $codigoLivro
		];
		self::Executar("curtirAvaliacao", $parametros);
	}
	
	public static function DescurtirAvaliacao($codigoUsuario, $codigoAvaliacao) {
		$parametros = [
			'pCodigoUsuario' => $codigoUsuario,
			'pCodigoAvaliacao' => $codigoAvaliacao
		];
		self::Executar("descurtirAvaliacao", $parametros);
	}
	
	public static function ContarCurtidasAvaliacao($codigoAvaliacao) {
		$codigoAvaliacao = ['codigoAvaliacao' => $codigoAvaliacao];
		return self::Consultar("contarCurtidasAvaliacao", $codigoAvaliacao);
	}

}
?>