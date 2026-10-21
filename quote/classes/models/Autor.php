<?php 
class Autor extends Banco {
	public $Codigo;
	public $Nome;

	
	public function __construct($codigo = null, $nome = null) {
		$this->Codigo = $codigo;
		$this->Nome = $nome;
	}
}
?>