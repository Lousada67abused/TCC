<?php 
class Usuario extends Banco{
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

	static function buscarUsuarioPorEmail($email) {
		$parametros = array(
        "codigoUsuario" => $codigoUsuario,
        "codigoLivro"   => $codigoLivro,
        "nota"          => $nota,
        "resenha"       => $resenha
    );
    self::Executar("sp_inserir_avaliacao", $parametros);
	}
}
?>