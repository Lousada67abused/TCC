<?php 
class UsuarioController{
    public static function acessar($email, $senha) {
        return Usuario::Acessar($email, $senha);
    }
}
?>