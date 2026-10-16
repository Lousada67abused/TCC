<?php 
class BibliotecaController {

    public static function cadastrar($codigoLivro, $status, $visivel, $codigoUsuario) {
        Biblioteca::Cadastrar($codigoLivro, $status, $visivel, $codigoUsuario);
    }

    public static function buscarBibliotecaUsuario($codigoUsuario) {
        return Biblioteca::BuscarBibliotecaUsuario($codigoUsuario);
    }

    public static function atualizarStatusBiblioteca($codigoUsuario, $codigoLivro, $status) {
        Biblioteca::AtualizarStatusBiblioteca($codigoUsuario, $codigoLivro, $status);
    }

    public static function deletarLivroBiblioteca($codigoUsuario, $codigoLivro) {
        Biblioteca::DeletarLivroBiblioteca($codigoUsuario, $codigoLivro);
    }
}
?>