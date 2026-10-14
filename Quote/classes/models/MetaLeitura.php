<?php 
class MetaLeitura extends Banco {
	public $CodigoMeta;
	public $QntLivro;
	public $Data;
	public $CodigoUsuario;

	
	public function __construct($codigoMeta = null, $qntLivro = null, $data = null, $codigoUsuario = null) {
		$this->CodigoMeta = $codigoMeta;
		$this->QntLivro = $qntLivro;
		$this->Data = $data;
		$this->CodigoUsuario = $codigoUsuario;
	}
}
?>