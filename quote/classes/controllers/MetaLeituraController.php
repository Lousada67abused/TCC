<?php 
class MetaLeituraController {

    public static function cadastrar($qntLivro, $data, $codigoUsuario) {
        MetaLeitura::Cadastrar($qntLivro, $data, $codigoUsuario);
    }

    public static function atualizar($codigoMeta, $qntLivro, $data) {
        MetaLeitura::Atualizar($codigoMeta, $qntLivro, $data);
    }
    
    public static function deletar($codigoMeta) {
        MetaLeitura::Deletar($codigoMeta);
    }
    
    public static function buscarMetaUsuario($codigoUsuario) {
        return MetaLeitura::BuscarMetaUsuario($codigoUsuario);
    }

    public static function calcularProgressoMeta($codigoMeta) {
        return MetaLeitura::CalcularProgressoMeta($codigoMeta);
    }

}
?>