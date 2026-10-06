<?php 
class UsuarioController{
    public static function acessar($email, $senha) {
        Usuario::Acessar($email, $senha);
    }
}
?>