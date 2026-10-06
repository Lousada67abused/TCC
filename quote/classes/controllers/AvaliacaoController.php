<?php 
class AvaliacaoController {
    public static function avaliarLivro($codigoUsuario, $codigoLivro, $nota, $resenha) {
        Avaliacao::avaliar($codigoUsuario, $codigoLivro, $nota, $resenha);
    }
}
?>