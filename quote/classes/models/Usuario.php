<?php 
Class Usuario extends Banco{
	public $Codigo;
	public $Nome;
	public $Email;
	public $Biografia;
	public $Nascimento;
	public $Tipo;

	public function __construct($codigo = null, $nome = null, $email = null, $biografia = null, $nascimento = null, $tipo = null) {
		$this->Codigo = $codigo;
		$this->Nome = $nome;
		$this->Email = $email;
		$this->Biografia = $biografia;
		$this->Nascimento = $nascimento;
		$this->Tipo = $tipo;
	}
	
	public static function Acessar($email, $senha) {
		$parametros = [
			'pEmail'=>$email,
			'pSenha'=>$senha
		];
		return self::Consultar("loginUsuario", $parametros);
	}

	public static function Cadastrar($nome, $email, $senha, $biografia, $nascimento, $tipo) {
		$parametros = [
			'pNome'=>$nome,
			'pEmail'=>$email,
			'pSenha'=>$senha,
			'pBiografia'=>$biografia,
			'pNascimento'=>$nascimento,
			'pTipo'=>$tipo
		];
		self::Executar("cadastrarUsuario", $parametros);
	}

	public static function BuscarUsuarioNome($nome) {
		$nome = ['pNome'=>$nome];
		return self::Consultar("buscarUsuarioNome", $nome);
	}

	public static function BuscarUsuarioCodigo($codigo) {
		$codigo = ['pCodigo'=>$codigo];
		return self::Consultar("buscarUsuarioCodigo", $codigo);
	}

	public static function Atualizar($codigo, $nome, $email, $biografia, $nascimento) {
		$parametros = [
			'pCodigo'=>$codigo,
			'pNome'=>$nome,
			'pEmail'=>$email,
			'pBiografia'=>$biografia,
			'pNascimento'=>$nascimento
		];
		self::Executar("atualizarUsuario", $parametros);
	}

	public static function AtualizarSenha($codigo, $senhaAtual, $novaSenha) {
		$parametros = [
			'pCodigo'=>$codigo,
			'pSenhaAtual'=>$senhaAtual,
			'pNovaSenha'=>$novaSenha
		];
		self::Executar("atualizarSenhaUsuario", $parametros);
	}

    public static function AtualizarNome($codigo, $nome) {
        return self::Transacao(function ($conexao) use ($codigo, $nome) {
            $consulta = $conexao->prepare('SELECT id_usuario FROM usuario WHERE id_usuario = ? FOR UPDATE');
            $consulta->execute([$codigo]);
            if (!$consulta->fetch()) return null;

            $atualizar = $conexao->prepare('UPDATE usuario SET nm_usuario = ? WHERE id_usuario = ?');
            $atualizar->execute([$nome, $codigo]);
            return ['id_usuario' => (int) $codigo, 'nm_usuario' => $nome];
        });
    }

	public static function Deletar($codigo) {
		$parametros = ['pCodigo'=>$codigo];
		self::Executar("deletarUsuario", $parametros);
	}

}
?>
