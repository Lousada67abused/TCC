<?php
class PerfilPublico extends Banco {
    public static function Buscar($codigo, $observador) {
        return self::Transacao(function ($conexao) use ($codigo, $observador) {
            $consulta = $conexao->prepare('SELECT u.id_usuario, u.nm_usuario, u.bio,
                (SELECT COUNT(*) FROM biblioteca b WHERE b.id_usuario = u.id_usuario AND b.status = \'lido\') AS qtd_lidos,
                (SELECT COUNT(*) FROM seguidor s WHERE s.id_seguido = u.id_usuario) AS qtd_seguidores,
                (SELECT COUNT(*) FROM seguidor s WHERE s.id_seguidor = u.id_usuario) AS qtd_seguindo
                FROM usuario u WHERE u.id_usuario = ?');
            $consulta->execute([$codigo]);
            $usuario = $consulta->fetch();
            if (!$usuario) return null;

            $autenticado = false;
            $seguindo = false;
            if ($observador) {
                $consulta = $conexao->prepare('SELECT id_usuario FROM usuario WHERE id_usuario = ?');
                $consulta->execute([$observador]);
                $autenticado = (bool) $consulta->fetch();
                $consulta = $conexao->prepare('SELECT 1 FROM seguidor WHERE id_seguidor = ? AND id_seguido = ?');
                $consulta->execute([$observador, $codigo]);
                $seguindo = (bool) $consulta->fetch();
            }
            $consulta = $conexao->prepare('CALL buscarBibliotecaUsuario(?)');
            $consulta->execute([$codigo]);
            $biblioteca = array_values(array_filter($consulta->fetchAll(), function ($livro) {
                return (int) $livro['visivel'] === 1;
            }));
            $consulta->closeCursor();
            $consulta = $conexao->prepare('CALL buscarAvaliacaoUsuario(?)');
            $consulta->execute([$codigo]);
            $avaliacoes = $consulta->fetchAll();
            $consulta->closeCursor();
            return ['usuario' => $usuario, 'biblioteca' => $biblioteca, 'avaliacoes' => $avaliacoes,
                'seguindo' => $seguindo, 'autenticado' => $autenticado,
                'codigoUsuarioLogado' => $autenticado ? (int) $observador : null,
                'proprioPerfil' => $autenticado && (string) $codigo === (string) $observador];
        });
    }
}
