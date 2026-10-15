<?php 
class BibliotecaController {

    public static function cadastrar($codigoLivro, $status, $visivel, $codigoUsuario) {
        Biblioteca::Cadastrar($codigoLivro, $status, $visivel, $codigoUsuario);
    }
}
?>