<?php 
class Comentario extends Banco {
	public $Codigo;
	public $Texto;
	public $Data;
	public $CodigoUsuario;
	public $CodigoAvaliacao;

	
	public function __construct($codigo = null, $texto = null, $data = null, $codigoUsuario = null, $codigoAvaliacao = null) {
		$this->Codigo = $codigo;
		$this->Texto = $texto;
		$this->Data = $data;
		$this->CodigoUsuario = $codigoUsuario;
		$this->CodigoAvaliacao = $codigoAvaliacao;
	}

	public static function Cadastrar($texto, $codigoUsuario, $codigoAvaliacao) {
		$parametros = [
			'pTexto'=>$texto,
			'pCodigoUsuario'=>$codigoUsuario,
			'pCodigoAvaliacao'=>$codigoAvaliacao
		];
		self::Executar("cadastrarComentario", $parametros);
	}

	public static function Atualizar($codigo, $codigoUsuario, $texto) {
		$parametros = [
			'pCodigo'=>$codigo,
			'pCodigoUsuario'=>$codigoUsuario,
			'pTexto'=>$texto
		];
		self::Executar("atualizarComentario", $parametros);
	}

	public static function Deletar($codigo, $codigoUsuario) {
		$parametros = [
			'pCodigo'=>$codigo,
			'pCodigoUsuario'=>$codigoUsuario
		];
		self::Executar("deletarComentario", $parametros);
	}

	public static function BuscarComentarioAvaliacao($avaliacao) {
		$avaliacao = ['avaliacao'=>$avaliacao];
		return self::Consultar("buscarComentarioAvaliacao", $avaliacao);
	}

}
?>