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

        $consulta = $conexao->prepare("WITH meus_generos AS (
                SELECT id_genero FROM preferencia_usuario WHERE id_usuario = ?
                UNION
                SELECT lg.id_genero FROM biblioteca b
                INNER JOIN livro_genero lg ON lg.id_livro = b.id_livro
                WHERE b.id_usuario = ?
                    AND (b.favorito = 1 OR b.status IN ('lido', 'lendo', 'quero ler'))
            ), gostos_leitores AS (
                SELECT id_usuario, id_genero FROM preferencia_usuario
                UNION
                SELECT b.id_usuario, lg.id_genero FROM biblioteca b
                INNER JOIN livro_genero lg ON lg.id_livro = b.id_livro
                WHERE b.visivel = 1
                    AND (b.favorito = 1 OR b.status IN ('lido', 'lendo', 'quero ler'))
            ), afinidades AS (
                SELECT g.id_usuario, COUNT(*) AS generos_em_comum
                FROM gostos_leitores g
                INNER JOIN meus_generos m ON m.id_genero = g.id_genero
                GROUP BY g.id_usuario
            ), resenhas AS (
                SELECT a.id_avaliacao, a.nota, a.dt_avaliacao, a.txt_resenha,
                    a.id_usuario, u.nm_usuario, a.id_livro, l.titulo,
                    COALESCE(af.generos_em_comum, 0) AS afinidade
                FROM avaliacao a
                INNER JOIN usuario u ON u.id_usuario = a.id_usuario
                INNER JOIN livro l ON l.id_livro = a.id_livro
                LEFT JOIN afinidades af ON af.id_usuario = a.id_usuario
                WHERE a.id_usuario <> ? AND NULLIF(TRIM(a.txt_resenha), '') IS NOT NULL
            )
            SELECT r.id_avaliacao, r.nota, r.dt_avaliacao, r.txt_resenha,
                r.id_usuario, r.nm_usuario, r.id_livro, r.titulo,
                (SELECT GROUP_CONCAT(DISTINCT au.nm_autor ORDER BY au.nm_autor SEPARATOR ', ')
                    FROM autor_livro al INNER JOIN autor au ON au.id_autor = al.id_autor
                    WHERE al.id_livro = r.id_livro) AS nm_autor
            FROM resenhas r
            WHERE r.afinidade > 0 OR NOT EXISTS (SELECT 1 FROM resenhas WHERE afinidade > 0)
            ORDER BY r.afinidade DESC, r.dt_avaliacao DESC, r.id_avaliacao DESC
            LIMIT 40");
        $consulta->execute([$codigoUsuario, $codigoUsuario, $codigoUsuario]);
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
