<?php 
class ComentarioController {

    public static function cadastrar($texto, $codigoUsuario, $codigoAvaliacao) {
        Comentario::Cadastrar($texto, $codigoUsuario, $codigoAvaliacao);
    }
}
?>