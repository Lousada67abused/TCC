<?php 
class AvaliacaoController {
    public static function avaliarLivro($codigoUsuario, $codigoLivro, $nota, $resenha) {
        $avaliacao = new Avaliacao();
        return $avaliacao->avaliar($codigoUsuario, $codigoLivro, $nota, $resenha);
    }
}
?>