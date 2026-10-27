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
		$codigoUsuario = ['codigoUsuario' => $codigoUsuario];
		return self::Consultar("buscarFeed", $codigoUsuario);
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
            return true;
        });
    }

}
?>
