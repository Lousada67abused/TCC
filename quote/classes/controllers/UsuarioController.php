<?php 
class UsuarioController{
    public static function acessar($email, $senha) {
        return Usuario::Acessar($email, $senha);
    }

    public static function cadastrar($nome, $email, $senha, $biografia, $nascimento, $tipo) {
        Usuario::Cadastrar($nome, $email, $senha, $biografia, $nascimento, $tipo);
    }

    public static function buscarUsuarioNome($nome) {
        return Usuario::BuscarUsuarioNome($nome);
    }

    public static function buscarUsuarioCodigo($codigo) {
        return Usuario::BuscarUsuarioCodigo($codigo);
    }

    public static function atualizar($codigo, $nome, $email, $biografia, $nascimento) {
        Usuario::Atualizar($codigo, $nome, $email, $biografia, $nascimento);
    }

    public static function atualizarSenha($codigo, $senhaAtual, $novaSenha) {
        Usuario::AtualizarSenha($codigo, $senhaAtual, $novaSenha);
    }

    public static function deletar($codigo) {
        Usuario::Deletar($codigo);
    }
}
?>