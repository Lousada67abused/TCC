<?php 
class Seguidor extends Banco {
	public $CodigoSeguidor;
	public $CodigoSeguido;

	
	public function __construct($codigoSeguidor = null, $codigoSeguido = null) {
		$this->CodigoSeguidor = $codigoSeguidor;
		$this->CodigoSeguido = $codigoSeguido;
	}

	public static function Seguir($codigoSeguidor, $codigoSeguido) {
		$parametros = [
			'pSeguidor' => $codigoSeguidor,
			'pSeguido' => $codigoSeguido
		];
		self::Executar("seguirUsuario", $parametros);
	}

	public static function DeixarDeSeguir($codigoSeguidor, $codigoSeguido) {
		$parametros = [
			'pSeguidor' => $codigoSeguidor,
			'pSeguido' => $codigoSeguido
		];
		self::Executar("deixarDeSeguir", $parametros);
	}

	public static function BuscarSeguidoresUsuario($codigoUsuario) {
		$codigoUsuario = ['pCodigoUsuario'=>$codigoUsuario];
		return self::Consultar("buscarSeguidoresUsuario", $codigoUsuario);
	}

	public static function buscarSeguidosUsuario($codigoUsuario) {
		$codigoUsuario = ['pCodigoUsuario'=>$codigoUsuario];
		return self::Consultar("sp_buscar_seguidos_por_usuario", $codigoUsuario);
	}
}
?>