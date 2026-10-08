<?php 
class PreferenciaUsuario extends Banco {
	public $CodigoUsuario;
	public $CodigoGenero;

	
	public function __construct($codigoUsuario = null, $codigoGenero = null) {
		$this->CodigoUsuario = $codigoUsuario;
		$this->CodigoGenero = $codigoGenero;
	}

	public static function CadastrarPreferencia($codigoUsuario, $codigoGenero) {
		$parametros = [
			'pCodigoUsuario'=>$codigoUsuario,
			'pCodigoGenero'=>$codigoGenero
		];
		self::Executar("cadastrarPreferenciaUsuario", $parametros);
	}

	public static function RecomendarLivroUsuario($codigoUsuario) {
		$codigoUsuario = ['pCodigoUsuario'=>$codigoUsuario];
		return self::Consultar("recomendarLivroUsuario", $codigoUsuario);
	}
}
?>