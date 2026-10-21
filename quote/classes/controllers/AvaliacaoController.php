<?php 
class AvaliacaoController {
    public static function avaliarLivro($codigoUsuario, $codigoLivro, $nota, $resenha) {
        Avaliacao::Avaliar($codigoUsuario, $codigoLivro, $nota, $resenha);
    }

    public static function buscarFeed($codigoUsuario) {
        return Avaliacao::BuscarFeed($codigoUsuario);
    }

    public static function buscarAvaliacaoLivro($codigoLivro) {
        return Avaliacao::BuscarAvaliacaoLivro($codigoLivro);
    }

    public static function buscarAvaliacaoUsuario($codigoUsuario) {
        return Avaliacao::BuscarAvaliacaoUsuario($codigoUsuario);
    }

    public static function atualizar($codigo, $nota, $txtResenha) {
        Avaliacao::Atualizar($codigo, $nota, $txtResenha);
    }
}
?>