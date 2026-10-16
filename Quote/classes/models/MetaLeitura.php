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

	public static function Cadastrar($qntLivro, $data, $codigoUsuario) {
		$parametros = [
			'pQntLivro'=>$qntLivro,
			'pData'=>$data,
			'pCodigoUsuario'=>$codigoUsuario
		];
		self::Executar("cadastrarMetaLeitura", $parametros);
	}

	public static function BuscarMetaUsuario($codigoUsuario) {
		$codigoUsuario = ['codigoUsuario' => $codigoUsuario];
		return self::Consultar("buscarMetaUsuario", $codigoUsuario);
	}

	public static function CalcularProgressoMeta($codigoMeta) {
		$codigoMeta = ['pCodigo'=>$codigoMeta];
		return self::Consultar("calcularProgressoMeta", $codigoMeta);
	}

	public static function Atualizar($codigoMeta, $qntLivro, $data) {
		$parametros = [
			'pCodigo'=>$codigoMeta,
			'pQntLivro'=>$qntLivro,
			'pData'=>$data
		];
		self::Executar("atualizarMetaLeitura", $parametros);
	}

	public static function Deletar($codigoMeta) {
		$codigoMeta = ['pCodigo'=>$codigoMeta];
		self::Executar("deletarMetaLeitura", $codigoMeta);
	}
}
?>