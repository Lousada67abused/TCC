<?php 
class Usuario {
	public $Codigo;
	public $Nome;
	public $Email;
	public $Senha;
	public $Biografia;
	public $Nascimento;
	public $Tipo;

	
	public function __construct($codigo = null, $nome = null, $email = null, $senha = null, $biografia = null, $nascimento = null, $tipo = null) {
		$this->Codigo = $codigo;
		$this->Nome = $nome;
		$this->Email = $email;
		$this->Senha = $senha;
		$this->Biografia = $biografia;
		$this->Nascimento = $nascimento;
		$this->Tipo = $tipo;
	}
}
?>