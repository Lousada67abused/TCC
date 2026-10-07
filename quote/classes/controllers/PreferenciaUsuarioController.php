<?php 
class PreferenciaUsuarioController {
    
    public static function cadastrarPreferencia($codigoUsuario, $codigoGenero) {
        PreferenciaUsuario::CadastrarPreferencia($codigoUsuario, $codigoGenero);
    }
}
?>