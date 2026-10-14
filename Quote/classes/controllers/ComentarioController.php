<?php 
class ComentarioController {

    public static function cadastrar($texto, $codigoUsuario, $codigoAvaliacao) {
        Comentario::Cadastrar($texto, $codigoUsuario, $codigoAvaliacao);
    }

    public static function atualizar($codigo, $codigoUsuario, $texto) {
        Comentario::Atualizar($codigo, $codigoUsuario, $texto);
    }

    public static function deletar($codigo, $codigoUsuario) {
        Comentario::Deletar($codigo, $codigoUsuario);
    }

    public static function buscarComentarioAvaliacao($avaliacao) {
        return Comentario::BuscarComentarioAvaliacao($avaliacao);
    }
}
?>