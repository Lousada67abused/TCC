<?php 
class Biblioteca extends Banco {
	public $CodigoLivro;
	public $CodigoBiblioteca;
	public $Status;
	public $Favorito;
	public $Visivel;
	public $CodigoUsuario;

	
	public function __construct($codigoLivro = null, $codigoBiblioteca = null, $status = null, $visivel = null, $codigoUsuario = null, $favorito = 0) {
		$this->CodigoLivro = $codigoLivro;
		$this->CodigoBiblioteca = $codigoBiblioteca;
		$this->Status = $status;
		$this->Favorito = $favorito;
		$this->Visivel = $visivel;
		$this->CodigoUsuario = $codigoUsuario;
	}

	public static function Cadastrar($codigoLivro, $status, $visivel, $codigoUsuario, $favorito = 0) {
		$parametros = [
			'pCodigoLivro'=>$codigoLivro,
			'pStatus'=>$status,
			'pFavorito'=>$favorito,
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

	public static function AtualizarFavoritoBiblioteca($codigoUsuario, $codigoLivro, $favorito) {
		$parametros = [
			'pCodigoUsuario'=>$codigoUsuario,
			'pCodigoLivro'=>$codigoLivro,
			'pFavorito'=>$favorito
		];
		self::Executar("atualizarFavoritoBiblioteca", $parametros);
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
