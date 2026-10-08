<?php 
class PreferenciaUsuarioController {
    
    public static function cadastrarPreferencia($codigoUsuario, $codigoGenero) {
        PreferenciaUsuario::CadastrarPreferencia($codigoUsuario, $codigoGenero);
    }

    public static function recomendarLivroUsuario($codigoUsuario) {
        return PreferenciaUsuario::RecomendarLivroUsuario($codigoUsuario);
    }
}
?>