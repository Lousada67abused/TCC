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
}
?>