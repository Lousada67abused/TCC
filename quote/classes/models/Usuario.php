<?php 
Class Usuario extends Banco{
	public $Codigo;
	public $Nome;
	public $Email;
	public $Biografia;
	public $Nascimento;
	public $Tipo;

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
		return self::Consultar("loginUsuario", $parametros);
	}

	public static function Cadastrar($nome, $email, $senha, $biografia, $nascimento, $tipo) {
		$parametros = [
			'pNome'=>$nome,
			'pEmail'=>$email,
			'pSenha'=>$senha,
			'pBiografia'=>$biografia,
			'pNascimento'=>$nascimento,
			'pTipo'=>$tipo
		];
		self::Executar("cadastrarUsuario", $parametros);
	}
}
	
?>