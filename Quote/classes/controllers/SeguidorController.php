<?php 
class SeguidorController {
    public static function seguir($codigoSeguidor, $codigoSeguido) {
        Seguidor::Seguir($codigoSeguidor, $codigoSeguido);
    }

    public static function deixarDeSeguir($codigoSeguidor, $codigoSeguido) {
        Seguidor::DeixarDeSeguir($codigoSeguidor, $codigoSeguido);
    }
}
?>
