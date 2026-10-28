<?php 
class Comentario extends Banco {
	public $Codigo;
	public $Texto;
	public $Data;
	public $CodigoUsuario;
	public $CodigoAvaliacao;

	
	public function __construct($codigo = null, $texto = null, $data = null, $codigoUsuario = null, $codigoAvaliacao = null) {
		$this->Codigo = $codigo;
		$this->Texto = $texto;
		$this->Data = $data;
		$this->CodigoUsuario = $codigoUsuario;
		$this->CodigoAvaliacao = $codigoAvaliacao;
	}

	public static function Cadastrar($texto, $codigoUsuario, $codigoAvaliacao) {
        return self::CadastrarDoUsuario($texto, $codigoUsuario, $codigoAvaliacao);
    }

	public static function Atualizar($codigo, $codigoUsuario, $texto) {
		$parametros = [
			'pCodigo'=>$codigo,
			'pCodigoUsuario'=>$codigoUsuario,
			'pTexto'=>$texto
		];
		self::Executar("atualizarComentario", $parametros);
	}

	public static function Deletar($codigo, $codigoUsuario) {
		$parametros = [
			'pCodigo'=>$codigo,
			'pCodigoUsuario'=>$codigoUsuario
		];
		self::Executar("deletarComentario", $parametros);
	}

	public static function BuscarComentarioAvaliacao($avaliacao) {
		$avaliacao = ['avaliacao'=>$avaliacao];
		return self::Consultar("buscarComentarioAvaliacao", $avaliacao);
	}

    private static function LerEstado($conexao, $avaliacao, $observador, $livro = null) {
        $consulta = $conexao->prepare('SELECT a.id_avaliacao, a.id_livro,
            (SELECT COUNT(*) FROM comentario c WHERE c.id_avaliacao = a.id_avaliacao) AS quantidade_comentarios,
            EXISTS(SELECT 1 FROM usuario u WHERE u.id_usuario = ?) AS autenticado
            FROM avaliacao a WHERE a.id_avaliacao = ?');
        $consulta->execute([$observador, $avaliacao]);
        $dados = $consulta->fetch();
        $consulta->closeCursor();
        if (!$dados) throw new DomainException('Avaliação não encontrada.', 404);
        if ($livro !== null && (string) $livro !== (string) $dados['id_livro']) {
            throw new DomainException('A avaliação não pertence a este livro.', 400);
        }
        $autenticado = (bool) $dados['autenticado'];
        return ['codigoAvaliacao' => (int) $dados['id_avaliacao'], 'codigoLivro' => (string) $dados['id_livro'],
            'quantidade_comentarios' => (int) $dados['quantidade_comentarios'],
            'autenticado' => $autenticado, 'codigoUsuarioLogado' => $autenticado ? (int) $observador : null];
    }

    public static function Listar($avaliacao, $observador, $livro = null, $resumo = false) {
        return self::Transacao(function ($conexao) use ($avaliacao, $observador, $livro, $resumo) {
            $estado = self::LerEstado($conexao, $avaliacao, $observador, $livro);
            $comentarios = [];
            if (!$resumo) {
                $consulta = $conexao->prepare('CALL buscarComentarioAvaliacao(?)');
                $consulta->execute([$avaliacao]);
                $comentarios = $consulta->fetchAll(PDO::FETCH_ASSOC);
                $consulta->closeCursor();
                usort($comentarios, function ($a, $b) {
                    return strcmp((string) ($a['dt_comentario'] ?? ''), (string) ($b['dt_comentario'] ?? '')) ?:
                        ((int) $a['id_comentario'] <=> (int) $b['id_comentario']);
                });
            }
            return ['resposta' => $comentarios, 'estado' => $estado];
        });
    }

    private static function LerComentario($conexao, $codigo, $usuario, $avaliacao) {
        $consulta = $conexao->prepare('SELECT c.id_comentario, c.texto, c.dt_comentario, c.id_usuario,
            u.nm_usuario, c.id_avaliacao FROM comentario c JOIN usuario u ON u.id_usuario = c.id_usuario
            WHERE c.id_comentario = ? AND c.id_usuario = ? AND c.id_avaliacao = ?');
        $consulta->execute([$codigo, $usuario, $avaliacao]);
        $comentario = $consulta->fetch();
        $consulta->closeCursor();
        return $comentario;
    }

    public static function RepetirEnvio($codigo, $texto, $usuario, $avaliacao, $livro = null) {
        return self::Transacao(function ($conexao) use ($codigo, $texto, $usuario, $avaliacao, $livro) {
            $estado = self::LerEstado($conexao, $avaliacao, $usuario, $livro);
            if (!$estado['autenticado']) throw new DomainException('Entre novamente na sua conta para comentar.', 401);
            $comentario = self::LerComentario($conexao, $codigo, $usuario, $avaliacao);
            if (!$comentario || $comentario['texto'] !== $texto) {
                throw new DomainException('Este envio já foi processado e o comentário foi alterado ou removido. Atualize os comentários.', 409);
            }
            return ['comentario' => $comentario, 'estado' => $estado];
        });
    }

    public static function CadastrarDoUsuario($texto, $usuario, $avaliacao, $livro = null) {
        $conexaoBloqueada = null;
        try {
            return self::Transacao(function ($conexao) use ($texto, $usuario, $avaliacao, $livro, &$conexaoBloqueada) {
                // A procedure usa MAX(id)+1. A trava abrange todas as avaliações e permanece até o commit.
                $trava = $conexao->query("SELECT GET_LOCK('quote_cadastrar_comentario', 5)");
                $obtida = $trava->fetchColumn();
                $trava->closeCursor();
                if ((int) $obtida !== 1) throw new DomainException('Não foi possível enviar agora. Tente novamente.', 503);
                $conexaoBloqueada = $conexao;
                $consulta = $conexao->prepare('SELECT id_avaliacao FROM avaliacao WHERE id_avaliacao = ? FOR UPDATE');
                $consulta->execute([$avaliacao]);
                $existe = $consulta->fetchColumn();
                $consulta->closeCursor();
                if (!$existe) throw new DomainException('Avaliação não encontrada.', 404);
                $estado = self::LerEstado($conexao, $avaliacao, $usuario, $livro);
                if (!$estado['autenticado']) throw new DomainException('Entre novamente na sua conta para comentar.', 401);
                $cadastro = $conexao->prepare('CALL cadastrarComentario(?, ?, ?)');
                $cadastro->execute([$texto, $usuario, $avaliacao]);
                $cadastro->closeCursor();
                $codigo = $conexao->query('SELECT MAX(id_comentario) FROM comentario')->fetchColumn();
                $comentario = self::LerComentario($conexao, $codigo, $usuario, $avaliacao);
                if (!$comentario) throw new RuntimeException('Falha ao confirmar comentário.');
                return ['comentario' => $comentario, 'estado' => self::LerEstado($conexao, $avaliacao, $usuario, $livro)];
            });
        } finally {
            if ($conexaoBloqueada !== null) {
                try { $conexaoBloqueada->query("SELECT RELEASE_LOCK('quote_cadastrar_comentario')")->closeCursor(); }
                catch (Throwable $erro) { /* Uma conexão encerrada também libera a trava. */ }
            }
        }
    }

}
?>
