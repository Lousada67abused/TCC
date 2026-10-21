<?php 
class SeguidorController {
    public static function seguir($codigoSeguidor, $codigoSeguido) {
        Seguidor::Seguir($codigoSeguidor, $codigoSeguido);
    }

    public static function deixarDeSeguir($codigoSeguidor, $codigoSeguido) {
        Seguidor::DeixarDeSeguir($codigoSeguidor, $codigoSeguido);
    }

    
	public static function buscarSeguidoresUsuario($codigoUsuario) {
		return Seguidor::BuscarSeguidoresUsuario($codigoUsuario);
	}

	public static function buscarSeguidosUsuario($codigoUsuario) {
		return Seguidor::BuscarSeguidosUsuario($codigoUsuario);
	}
}
?>
