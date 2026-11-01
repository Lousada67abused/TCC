<?php 
class Seguidor extends Banco {
	public $CodigoSeguidor;
	public $CodigoSeguido;

	
	public function __construct($codigoSeguidor = null, $codigoSeguido = null) {
		$this->CodigoSeguidor = $codigoSeguidor;
		$this->CodigoSeguido = $codigoSeguido;
	}

	public static function Seguir($codigoSeguidor, $codigoSeguido) {
		$parametros = [
			'pSeguidor' => $codigoSeguidor,
			'pSeguido' => $codigoSeguido
		];
		self::Executar("seguirUsuario", $parametros);
	}

    public static function DefinirSeguimento($seguidor, $seguido, $seguir) {
        return self::Transacao(function ($conexao) use ($seguidor, $seguido, $seguir) {
            $usuarios = $conexao->prepare('SELECT id_usuario FROM usuario WHERE id_usuario IN (?, ?) ORDER BY id_usuario FOR UPDATE');
            $usuarios->execute([$seguidor, $seguido]);
            if (count($usuarios->fetchAll()) !== 2) return null;
            $consulta = $conexao->prepare('SELECT 1 FROM seguidor WHERE id_seguidor = ? AND id_seguido = ?');
            $consulta->execute([$seguidor, $seguido]);
            $atual = (bool) $consulta->fetch();
            if ($atual !== $seguir) {
                $alterar = $conexao->prepare($seguir ? 'CALL seguirUsuario(?, ?)' : 'CALL deixarDeSeguir(?, ?)');
                $alterar->execute([$seguidor, $seguido]);
                $alterar->closeCursor();
            }
            $consulta = $conexao->prepare('SELECT COUNT(*) FROM seguidor WHERE id_seguido = ?');
            $consulta->execute([$seguido]);
            return ['seguindo' => $seguir, 'qtd_seguidores' => (int) $consulta->fetchColumn()];
        });
    }

	public static function DeixarDeSeguir($codigoSeguidor, $codigoSeguido) {
		$parametros = [
			'pSeguidor' => $codigoSeguidor,
			'pSeguido' => $codigoSeguido
		];
		self::Executar("deixarDeSeguir", $parametros);
	}

	public static function BuscarSeguidoresUsuario($codigoUsuario) {
		return self::BuscarConexoesUsuario($codigoUsuario, true);
	}

	public static function buscarSeguidosUsuario($codigoUsuario) {
		return self::BuscarConexoesUsuario($codigoUsuario, false);
	}

    private static function BuscarConexoesUsuario($codigoUsuario, $seguidores) {
        return self::Transacao(function ($conexao) use ($codigoUsuario, $seguidores) {
            $usuario = $conexao->prepare('SELECT id_usuario FROM usuario WHERE id_usuario = ?');
            $usuario->execute([$codigoUsuario]);
            if (!$usuario->fetch()) return null;

            // As duas procedures expõem somente o código e o nome públicos do leitor.
            $procedure = $seguidores ? 'sp_buscar_seguidores_por_usuario' : 'sp_buscar_seguidos_por_usuario';
            $consulta = $conexao->prepare('CALL ' . $procedure . '(?)');
            $consulta->execute([$codigoUsuario]);
            $conexoes = $consulta->fetchAll(PDO::FETCH_ASSOC);
            $consulta->closeCursor();
            return $conexoes;
        });
    }
}
?>
