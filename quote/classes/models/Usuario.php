<?php 

public function __construct($codigo = null, $nome = null, $email = null, $biografia = null, $nascimento = null, $tipo = null) {
		$this->Codigo = $codigo;
		$this->Nome = $nome;
		$this->Email = $email;
		$this->Biografia = $biografia;
		$this->Nascimento = $nascimento;
		$this->Tipo = $tipo;
	}
	
	public static function Acessar($email, $senha) {
		$parametros = [
			'pEmail'=>$email,
			'pSenha'=>$senha
		];
		return self::Consultar("acessar", $parametros);
	}

?>