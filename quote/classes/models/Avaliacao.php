<?php 
class Avaliacao extends Banco {
	public $Codigo;
	public $Nota;
	public $Data;
	public $CodigoLivro;
	public $Resenha;
	public $CodigoUsuario;

	
	public function __construct($codigo = null, $nota = null, $data = null, $codigoLivro = null, $resenha = null, $codigoUsuario = null) {
		$this->Codigo = $codigo;
		$this->Nota = $nota;
		$this->Data = $data;
		$this->CodigoLivro = $codigoLivro;
		$this->Resenha = $resenha;
		$this->CodigoUsuario = $codigoUsuario;
	}

	
	static public function avaliar($codigoUsuario, $codigoLivro, $nota, $resenha) {
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