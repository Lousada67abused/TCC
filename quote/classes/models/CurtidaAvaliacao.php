<?php
class CurtidaAvaliacao extends Banco {
    public $CodigoUsuario;
    public $CodigoAvaliacao;
    public $CodigoLivro;

    public function __construct($codigoUsuario = null, $codigoAvaliacao = null, $codigoLivro = null) {
        $this->CodigoUsuario = $codigoUsuario;
        $this->CodigoAvaliacao = $codigoAvaliacao;
        $this->CodigoLivro = $codigoLivro;
    }

    public static function Curtir($codigoUsuario, $codigoAvaliacao, $codigoLivro) {
        return self::Definir($codigoUsuario, $codigoAvaliacao, $codigoLivro, true);
    }

    public static function DescurtirAvaliacao($codigoUsuario, $codigoAvaliacao) {
        return self::Definir($codigoUsuario, $codigoAvaliacao, null, false);
    }

    public static function ContarCurtidasAvaliacao($codigoAvaliacao) {
        return self::Consultar('contarCurtidasAvaliacao', ['codigoAvaliacao' => $codigoAvaliacao]);
    }

    private static function LerEstado($conexao, $codigoAvaliacao, $observador) {
        $consulta = $conexao->prepare('SELECT a.id_avaliacao, a.id_livro,
            (SELECT COUNT(*) FROM curtida_avaliacao c WHERE c.id_avaliacao = a.id_avaliacao) AS quantidade_curtidas,
            EXISTS(SELECT 1 FROM usuario u WHERE u.id_usuario = ?) AS autenticado,
            EXISTS(SELECT 1 FROM curtida_avaliacao c WHERE c.id_avaliacao = a.id_avaliacao AND c.id_usuario = ?) AS curtida
            FROM avaliacao a WHERE a.id_avaliacao = ?');
        $consulta->execute([$observador, $observador, $codigoAvaliacao]);
        $avaliacao = $consulta->fetch();
        $consulta->closeCursor();
        if (!$avaliacao) throw new DomainException('Avaliação não encontrada.', 404);
        $autenticado = (bool) $avaliacao['autenticado'];
        return [
            'codigoAvaliacao' => (int) $avaliacao['id_avaliacao'],
            'codigoLivro' => (string) $avaliacao['id_livro'],
            'quantidade_curtidas' => (int) $avaliacao['quantidade_curtidas'],
            'curtida' => $autenticado && (bool) $avaliacao['curtida'],
            'autenticado' => $autenticado,
            'codigoUsuarioLogado' => $autenticado ? (int) $observador : null
        ];
    }

    public static function Estado($codigoAvaliacao, $observador, $codigoLivro = null) {
        return self::Transacao(function ($conexao) use ($codigoAvaliacao, $observador, $codigoLivro) {
            $estado = self::LerEstado($conexao, $codigoAvaliacao, $observador);
            if ($codigoLivro !== null && (string) $codigoLivro !== $estado['codigoLivro']) {
                throw new DomainException('A avaliação não pertence a este livro.', 400);
            }
            return $estado;
        });
    }

    public static function Definir($codigoUsuario, $codigoAvaliacao, $codigoLivro, $curtir) {
        return self::Transacao(function ($conexao) use ($codigoUsuario, $codigoAvaliacao, $codigoLivro, $curtir) {
            // Serializa as mudanças da mesma avaliação para que repetições não dupliquem curtidas.
            $consulta = $conexao->prepare('SELECT id_livro FROM avaliacao WHERE id_avaliacao = ? FOR UPDATE');
            $consulta->execute([$codigoAvaliacao]);
            $avaliacao = $consulta->fetch();
            $consulta->closeCursor();
            if (!$avaliacao) throw new DomainException('Avaliação não encontrada.', 404);
            if ($codigoLivro !== null && (string) $codigoLivro !== (string) $avaliacao['id_livro']) {
                throw new DomainException('A avaliação não pertence a este livro.', 400);
            }
            $estado = self::LerEstado($conexao, $codigoAvaliacao, $codigoUsuario);
            if (!$estado['autenticado']) throw new DomainException('Entre novamente na sua conta para curtir avaliações.', 401);
            if ($estado['curtida'] !== $curtir) {
                // A procedure curtirAvaliacao recebe usuário e avaliação; ela obtém o livro no banco.
                $nome = $curtir ? 'curtirAvaliacao' : 'descurtirAvaliacao';
                $alteracao = $conexao->prepare('CALL ' . $nome . '(?, ?)');
                $alteracao->execute([$codigoUsuario, $codigoAvaliacao]);
                $alteracao->closeCursor();
            }
            return self::LerEstado($conexao, $codigoAvaliacao, $codigoUsuario);
        });
    }
}
