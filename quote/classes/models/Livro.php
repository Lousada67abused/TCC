<?php 
class Livro extends Banco {
	public $Codigo;
	public $Titulo;
	public $Sinopse;
	public $AnoPublicacao;
	public $Paginas;
	public $CodigoEditora;

	
	public function __construct($codigo = null, $titulo = null, $sinopse = null, $anoPublicacao = null, $paginas = null, $codigoEditora = null) {
		$this->Codigo = $codigo;
		$this->Titulo = $titulo;
		$this->Sinopse = $sinopse;
		$this->AnoPublicacao = $anoPublicacao;
		$this->Paginas = $paginas;
		$this->CodigoEditora = $codigoEditora;
	}

	public static function FiltroBuscar($filtro) {
		$filtro = ['filtro' => $filtro];
		return self::Consultar("filtroLivro", $filtro);
	}

	public static function CalcularNotaMedia($codigo) {
		$codigo = ['codigo' => $codigo];
		return self::Consultar("calcularNotaMediaLivro", $codigo);
	}
}
?>