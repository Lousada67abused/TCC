<?php 
class UsuarioController{
    public static function acessar($email, $senha) {
        return Usuario::Acessar($email, $senha);
    }

    public static function cadastrar($nome, $email, $senha, $biografia, $nascimento, $tipo) {
        Usuario::Cadastrar($nome, $email, $senha, $biografia, $nascimento, $tipo);
    }
    
}
?>