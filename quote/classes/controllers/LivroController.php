<?php 
class LivroController {

    public static function filtroBuscar($filtro) {
        return Livro::FiltroBuscar($filtro);
    }

    public static function calcularNotaMedia($codigo) {
        return Livro::CalcularNotaMedia($codigo);
    }
}
?>