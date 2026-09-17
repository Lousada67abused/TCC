<?php 
class Livro {
	public $Codigo;
	public $Titulo;
	public $Sinopse;
	public $Paginas;
	public $CodigoEditora;

	
	public function __construct($codigo = null, $titulo = null, $sinopse = null, $paginas = null, $codigoEditora = null) {
		$this->Codigo = $codigo;
		$this->Titulo = $titulo;
		$this->Sinopse = $sinopse;
		$this->Paginas = $paginas;
		$this->CodigoEditora = $codigoEditora;
	}
}
?>