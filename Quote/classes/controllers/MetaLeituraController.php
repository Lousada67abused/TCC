<?php 
class MetaLeituraController {

    public static function cadastrar($qntLivro, $data, $codigoUsuario) {
        MetaLeitura::Cadastrar(
            self::inteiroPositivo($qntLivro, 'Quantidade de livros inválida. Informe um inteiro maior que zero.'),
            self::dataValida($data),
            self::inteiroPositivo($codigoUsuario, 'Código do usuário inválido.')
        );
    }

    public static function atualizar($codigoMeta, $qntLivro, $data) {
        MetaLeitura::Atualizar(
            self::inteiroPositivo($codigoMeta, 'Código da meta inválido.'),
            self::inteiroPositivo($qntLivro, 'Quantidade de livros inválida. Informe um inteiro maior que zero.'),
            self::dataValida($data)
        );
    }
    
    public static function deletar($codigoMeta) {
        MetaLeitura::Deletar(self::inteiroPositivo($codigoMeta, 'Código da meta inválido.'));
    }
    
    public static function buscarMetaUsuario($codigoUsuario) {
        return MetaLeitura::BuscarMetaUsuario(self::inteiroPositivo($codigoUsuario, 'Código do usuário inválido.'));
    }

    public static function calcularProgressoMeta($codigoMeta) {
        return MetaLeitura::CalcularProgressoMeta(self::inteiroPositivo($codigoMeta, 'Código da meta inválido.'));
    }

    private static function inteiroPositivo($valor, $mensagem) {
        if ((!is_int($valor) && !is_string($valor)) ||
            !preg_match('/^[1-9][0-9]*$/', (string) $valor) ||
            filter_var($valor, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 2147483647]]) === false) {
            throw new InvalidArgumentException($mensagem);
        }
        return (int) $valor;
    }

    private static function dataValida($valor) {
        if (!is_string($valor) || !preg_match('/^[1-9][0-9]{3}-[0-9]{2}-[0-9]{2}$/', $valor)) {
            throw new InvalidArgumentException('Informe uma data válida no formato AAAA-MM-DD.');
        }
        $data = DateTimeImmutable::createFromFormat('!Y-m-d', $valor);
        if (!$data || $data->format('Y-m-d') !== $valor) {
            throw new InvalidArgumentException('Informe uma data válida no formato AAAA-MM-DD.');
        }
        return $valor;
    }

}
?>
