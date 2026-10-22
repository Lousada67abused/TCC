<?php 
class BibliotecaController {

    public static function cadastrar($codigoLivro, $status, $visivel, $codigoUsuario, $favorito = 0) {
        Biblioteca::Cadastrar($codigoLivro, $status, $visivel, $codigoUsuario, $favorito);
    }

    public static function buscarBibliotecaUsuario($codigoUsuario) {
        return Biblioteca::BuscarBibliotecaUsuario($codigoUsuario);
    }

    public static function atualizarStatusBiblioteca($codigoUsuario, $codigoLivro, $status) {
        Biblioteca::AtualizarStatusBiblioteca($codigoUsuario, $codigoLivro, $status);
    }

    public static function atualizarFavoritoBiblioteca($codigoUsuario, $codigoLivro, $favorito) {
        Biblioteca::AtualizarFavoritoBiblioteca($codigoUsuario, $codigoLivro, $favorito);
    }

    public static function deletarLivroBiblioteca($codigoUsuario, $codigoLivro) {
        Biblioteca::DeletarLivroBiblioteca($codigoUsuario, $codigoLivro);
    }
}
?>
