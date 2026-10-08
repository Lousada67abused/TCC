<?php 
class LivroController {

    public static function filtroBuscar($filtro) {
        return Livro::FiltroBuscar($filtro);
    }
}
?>