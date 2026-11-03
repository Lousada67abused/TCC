<?php 
class Avaliacao extends Banco {
	public $Codigo;
	public $Nota;
	public $Data;
	public $CodigoLivro;
	public $Resenha;
	public $CodigoUsuario;

	
	public function __construct($codigo = null, $nota = null, $data = null, $codigoLivro = null, $resenha = null, $codigoUsuario = null) {
		$this->Codigo = $codigo;
		$this->Nota = $nota;
		$this->Data = $data;
		$this->CodigoLivro = $codigoLivro;
		$this->Resenha = $resenha;
		$this->CodigoUsuario = $codigoUsuario;
	}

	
	static public function Avaliar($codigoUsuario, $codigoLivro, $nota, $resenha) {
		$parametros = array(
			"codigoUsuario" => $codigoUsuario,
			"codigoLivro"   => $codigoLivro,
			"nota"          => $nota,
			"resenha"       => $resenha
		);
		self::Executar("cadastrarAvaliacao", $parametros);
	}

	public static function BuscarFeed($codigoUsuario) {
		return self::Transacao(function ($conexao) use ($codigoUsuario) {
			return self::ConsultarFeedPaginaInicial($conexao, $codigoUsuario);
		});
	}

    protected static function ConsultarFeedPaginaInicial($conexao, $codigoUsuario) {
        $consulta = $conexao->prepare('SELECT 1 FROM usuario WHERE id_usuario = ?');
        $consulta->execute([$codigoUsuario]);
        if (!$consulta->fetchColumn()) return null;

        // Um leitor seguido sem resenhas ainda pertence ao feed de amigos.
        $consulta = $conexao->prepare('SELECT 1 FROM seguidor WHERE id_seguidor = ? LIMIT 1');
        $consulta->execute([$codigoUsuario]);
        if ($consulta->fetchColumn()) {
            $consulta = $conexao->prepare('CALL buscarFeed(?)');
            $consulta->execute([$codigoUsuario]);
            $avaliacoes = $consulta->fetchAll(PDO::FETCH_ASSOC);
            $consulta->closeCursor();
            return ['modo' => 'amigos', 'avaliacoes' => $avaliacoes];
        }

        $consulta = $conexao->prepare("SELECT a.id_avaliacao, a.nota, a.dt_avaliacao, a.txt_resenha,
                a.id_usuario, u.nm_usuario, a.id_livro, l.titulo,
                COALESCE(c.quantidade_curtidas, 0) AS quantidade_curtidas,
                (SELECT GROUP_CONCAT(DISTINCT au.nm_autor ORDER BY au.nm_autor SEPARATOR ', ')
                    FROM autor_livro al INNER JOIN autor au ON au.id_autor = al.id_autor
                    WHERE al.id_livro = a.id_livro) AS nm_autor
            FROM avaliacao a
            INNER JOIN usuario u ON u.id_usuario = a.id_usuario
            INNER JOIN livro l ON l.id_livro = a.id_livro
            LEFT JOIN (
                SELECT id_avaliacao, id_livro, COUNT(*) AS quantidade_curtidas
                FROM curtida_avaliacao GROUP BY id_avaliacao, id_livro
            ) c ON c.id_avaliacao = a.id_avaliacao AND c.id_livro = a.id_livro
            WHERE a.id_usuario <> ? AND NULLIF(TRIM(a.txt_resenha), '') IS NOT NULL
            ORDER BY quantidade_curtidas DESC, a.dt_avaliacao DESC, a.id_avaliacao DESC
            LIMIT 40");
        $consulta->execute([$codigoUsuario]);
        return ['modo' => 'sugestoes', 'avaliacoes' => $consulta->fetchAll(PDO::FETCH_ASSOC)];
    }

	public static function BuscarAvaliacaoLivro($codigoLivro) {
		$codigoLivro = ['codigoLivro' => $codigoLivro];
		return self::Consultar("buscarAvaliacaoLivro", $codigoLivro);
	}

	public static function BuscarAvaliacaoUsuario($codigoUsuario) {
		$codigoUsuario = ['codigoUsuario' => $codigoUsuario];
		return self::Consultar("buscarAvaliacaoUsuario", $codigoUsuario);
	}

	public static function Atualizar($codigo, $nota, $txtResenha) {
		$parametros = [
			'pCodigo'=>$codigo,
			'pNota'=>$nota,
			'pResenha'=>$txtResenha
		];
		self::Executar("atualizarAvaliacao", $parametros);
	}
    public static function AtualizarDoUsuario($codigoAvaliacao, $codigoLivro, $codigoUsuario, $nota, $resenha) {
        return self::Transacao(function ($conexao) use ($codigoAvaliacao, $codigoLivro, $codigoUsuario, $nota, $resenha) {
            $consulta = $conexao->prepare("SELECT id_avaliacao FROM avaliacao WHERE id_avaliacao = ? AND id_livro = ? AND id_usuario = ? FOR UPDATE");
            $consulta->execute([$codigoAvaliacao, $codigoLivro, $codigoUsuario]);
            if (!$consulta->fetch()) return false;
            $atualizacao = $conexao->prepare("CALL atualizarAvaliacao(?, ?, ?)");
            $atualizacao->execute([$codigoAvaliacao, $nota, $resenha]);
            $atualizacao->closeCursor();
            return true;
        });
    }
    public static function ExcluirDoUsuario($codigoAvaliacao, $codigoLivro, $codigoUsuario) {
        return self::Transacao(function ($conexao) use ($codigoAvaliacao, $codigoLivro, $codigoUsuario) {
            $consulta = $conexao->prepare("SELECT id_avaliacao FROM avaliacao WHERE id_avaliacao = ? AND id_livro = ? AND id_usuario = ? FOR UPDATE");
            $consulta->execute([$codigoAvaliacao, $codigoLivro, $codigoUsuario]);
            if (!$consulta->fetch()) return false;
            $conexao->prepare("DELETE FROM comentario WHERE id_avaliacao = ?")->execute([$codigoAvaliacao]);
            $conexao->prepare("DELETE FROM curtida_avaliacao WHERE id_avaliacao = ?")->execute([$codigoAvaliacao]);
            $conexao->prepare("DELETE FROM avaliacao WHERE id_avaliacao = ? AND id_usuario = ?")->execute([$codigoAvaliacao, $codigoUsuario]);
            $conexao->prepare("UPDATE biblioteca SET status = NULL WHERE id_usuario = ? AND id_livro = ? AND status = 'lido'")
                ->execute([$codigoUsuario, $codigoLivro]);
            return true;
        });
    }

}
?>
