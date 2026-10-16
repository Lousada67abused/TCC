<?php 
class CurtidaAvaliacaoController {

    public static function curtir($codigoUsuario, $codigoAvaliacao, $codigoLivro) {
        CurtidaAvaliacao::Curtir($codigoUsuario, $codigoAvaliacao, $codigoLivro);
    }

    public static function descurtirAvaliacao($codigoUsuario, $codigoAvaliacao) {
        CurtidaAvaliacao::DescurtirAvaliacao($codigoUsuario, $codigoAvaliacao);
    }

    public static function contarCurtidasAvaliacao($codigoAvaliacao) {
        return CurtidaAvaliacao::ContarCurtidasAvaliacao($codigoAvaliacao);
    }

}
?>