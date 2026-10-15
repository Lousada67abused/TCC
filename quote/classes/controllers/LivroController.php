<?php 
class LivroController {

    public static function filtroBuscar($filtro) {
        return Livro::FiltroBuscar($filtro);
    }

    public static function calcularNotaMedia($codigo) {
        return Livro::CalcularNotaMedia($codigo);
    }

    public static function buscarLivroCodigo($codigo) {
        return Livro::BuscarLivroCodigo($codigo);
    }

    public static function buscarLivroTitulo($titulo) {
        return Livro::BuscarLivroTitulo($titulo);
    }

    public static function buscarRankingGenero($genero) {
        return Livro::BuscarRankingGenero($genero);
    }
}
?>