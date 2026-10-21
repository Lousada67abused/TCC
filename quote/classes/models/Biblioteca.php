<?php 
class Biblioteca extends Banco {
	public $CodigoLivro;
	public $CodigoBiblioteca;
	public $Status;
	public $Visivel;
	public $CodigoUsuario;

	
	public function __construct($codigoLivro = null, $codigoBiblioteca = null, $status = null, $visivel = null, $codigoUsuario = null) {
		$this->CodigoLivro = $codigoLivro;
		$this->CodigoBiblioteca = $codigoBiblioteca;
		$this->Status = $status;
		$this->Visivel = $visivel;
		$this->CodigoUsuario = $codigoUsuario;
	}

	public static function Cadastrar($codigoLivro, $status, $visivel, $codigoUsuario) {
		$parametros = [
			'pCodigoLivro'=>$codigoLivro,
			'pStatus'=>$status,
			'pVisivel'=>$visivel,
			'pCodigoUsuario'=>$codigoUsuario
		];
		self::Executar("cadastrarBiblioteca", $parametros);
	}

	public static function BuscarBibliotecaUsuario($codigoUsuario) {
		$codigoUsuario = ['codigoUsuario' => $codigoUsuario];
		return self::Consultar("buscarBibliotecaUsuario", $codigoUsuario);
	}

	public static function AtualizarStatusBiblioteca($codigoUsuario, $codigoLivro, $status) {
		$parametros = [
			'pCodigoUsuario'=>$codigoUsuario,
			'pCodigoLivro'=>$codigoLivro,
			'pStatus'=>$status
		];
		self::Executar("atualizarStatusBiblioteca", $parametros);
	}

	public static function DeletarLivroBiblioteca($codigoUsuario, $codigoLivro) {
		$parametros = [
			'pCodigoUsuario'=>$codigoUsuario,
			'pCodigoLivro'=>$codigoLivro
		];
		self::Executar("deletarLivroBiblioteca", $parametros);
	}
}
?>