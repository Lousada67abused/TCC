<?php
// Execute numa base de teste; todas as fixtures são revertidas por rollback.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
if ($argc !== 2 || !is_readable($argv[1])) {
    fwrite(STDERR, "Uso: php test_feed_sugestoes.php /caminho/cliente-teste.cnf\n");
    exit(1);
}
$config = parse_ini_file($argv[1], true)['client'] ?? [];
if (empty($config['socket']) || empty($config['user'])) {
    fwrite(STDERR, "Configure socket e user na seção [client] de uma base de teste.\n");
    exit(1);
}
require_once __DIR__ . '/../classes/base/Banco.php';
require_once __DIR__ . '/../classes/models/Avaliacao.php';
class AvaliacaoTesteFeed extends Avaliacao {
    public static function naConexao($db, $codigo) {
        return parent::ConsultarFeedPaginaInicial($db, $codigo);
    }
}
$db = new PDO('mysql:unix_socket=' . $config['socket'] . ';dbname=quote;charset=utf8mb4',
    $config['user'], $config['password'] ?? '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]);
$db->exec("SET SESSION sql_mode='STRICT_TRANS_TABLES,ONLY_FULL_GROUP_BY,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
function conferir($condicao, $mensagem) {
    if (!$condicao) throw new RuntimeException($mensagem);
}
function ids($feed) {
    return array_map('intval', array_column($feed['avaliacoes'], 'id_avaliacao'));
}
try {
    $db->beginTransaction();
    foreach (['usuario' => 'id_usuario', 'genero' => 'id_genero', 'autor' => 'id_autor',
        'avaliacao' => 'id_avaliacao'] as $tabela => $coluna) {
        conferir((int)$db->query("SELECT COUNT(*) FROM $tabela WHERE $coluna BETWEEN 960001 AND 960200")->fetchColumn() === 0,
            'Faixa de fixtures ocupada; use uma base isolada.');
    }
    conferir((int)$db->query('SELECT COUNT(*) FROM livro WHERE id_livro=9870000000001')->fetchColumn() === 0,
        'Livro de teste já existe.');
    $maior = (int)$db->query('SELECT COALESCE(MAX(total),0) FROM (SELECT COUNT(*) AS total FROM curtida_avaliacao GROUP BY id_avaliacao) c')->fetchColumn();
    conferir($maior < 40, 'Use uma base de teste com menos de 40 curtidas por avaliação.');
    $baseCurtidas = $maior + 1;
    $inserir = $db->prepare("INSERT INTO usuario (id_usuario,nm_usuario,email) VALUES (?, '__teste_feed__', ?)");
    foreach (range(960001, 960060) as $id) $inserir->execute([$id, 'feed-' . $id . '@example.invalid']);
    $db->exec("INSERT INTO genero VALUES (960001,'__teste_feed_1__'),(960002,'__teste_feed_2__')");
    $db->exec("INSERT INTO autor VALUES (960001,'Autor A'),(960002,'Autor B')");
    $db->exec("INSERT INTO livro (id_livro,titulo) VALUES (9870000000001,'__teste_feed__')");
    $db->exec('INSERT INTO autor_livro VALUES (960001,9870000000001),(960002,9870000000001)');
    $db->exec('INSERT INTO livro_genero VALUES (960001,9870000000001),(960002,9870000000001)');
    // A resenha com gosto em comum tem menos curtidas que a de gosto diferente.
    $db->exec('INSERT INTO preferencia_usuario VALUES (960001,960001),(960002,960002),(960003,960001)');
    $avaliacao = $db->prepare('INSERT INTO avaliacao (id_avaliacao,id_livro,id_usuario,nota,dt_avaliacao,txt_resenha) VALUES (?,9870000000001,?,4,?,?)');
    $curtida = $db->prepare('INSERT INTO curtida_avaliacao (id_usuario,id_avaliacao,id_livro) VALUES (?,?,9870000000001)');
    foreach ([[960001,960001,'2099-01-01','Própria',10],[960002,960002,'2020-01-01','Mais curtida',3],
        [960003,960003,'2030-01-01','Mais recente e gosto igual',2],[960004,960004,'2024-01-01','Empate por data',3],
        [960005,960004,'2024-01-01','Empate por código',3],[960006,960005,'2031-01-01','Sem curtidas',null],
        [960007,960002,'2099-01-01','   ',9],[960008,960002,'2099-01-01',null,9]] as [$id,$autor,$data,$texto,$extra]) {
        $avaliacao->execute([$id,$autor,$data,$texto]);
        for ($i=0; $extra !== null && $i < $baseCurtidas + $extra; $i++) $curtida->execute([960001+$i,$id]);
    }
    // Ter seguidores não significa seguir alguém.
    $db->exec('INSERT INTO seguidor VALUES (960003,960001)');
    $feed = AvaliacaoTesteFeed::naConexao($db, 960001);
    conferir($feed['modo'] === 'sugestoes', 'Sem seguidos deve receber sugestões');
    conferir(array_slice(ids($feed),0,4) === [960005,960004,960002,960003], 'Ordem por curtidas/data/código incorreta');
    conferir((int)$feed['avaliacoes'][0]['quantidade_curtidas'] === $baseCurtidas+3, 'Autores/gêneros multiplicaram curtidas');
    conferir($feed['avaliacoes'][0]['nm_autor'] === 'Autor A, Autor B', 'Autores omitidos ou resenha duplicada');
    conferir(!array_key_exists('email', $feed['avaliacoes'][0]), 'Feed expôs dados privados da conta');
    conferir(!in_array(960001,ids($feed),true) && !in_array(960007,ids($feed),true) && !in_array(960008,ids($feed),true),
        'Resenha própria/vazia não deve participar, mesmo com mais curtidas');
    $db->exec('DELETE FROM preferencia_usuario WHERE id_usuario=960001');
    conferir(array_slice(ids(AvaliacaoTesteFeed::naConexao($db,960001)),0,4) === [960005,960004,960002,960003],
        'Preferências ainda alteram a ordenação');

    $db->exec('INSERT INTO seguidor VALUES (960001,960006)');
    $feed = AvaliacaoTesteFeed::naConexao($db,960001);
    conferir($feed['modo'] === 'amigos' && ids($feed) === [], 'Seguido sem resenha não deve ativar sugestões');
    $db->exec('DELETE FROM seguidor WHERE id_seguidor=960001');
    $db->exec('INSERT INTO seguidor VALUES (960001,960004)');
    $feed = AvaliacaoTesteFeed::naConexao($db,960001);
    conferir($feed['modo'] === 'amigos' && ids($feed) === [960005,960004], 'Feed de amigos mudou ou misturou sugestões');
    $db->exec('DELETE FROM seguidor WHERE id_seguidor=960001');
    conferir(AvaliacaoTesteFeed::naConexao($db,960001)['modo'] === 'sugestoes', 'Deixar o último seguido não reativou sugestões');

    foreach (range(960100,960149) as $id) {
        $avaliacao->execute([$id,960002,'2099-12-31','Limite estável']);
        for ($i=0;$i<$baseCurtidas+4;$i++) $curtida->execute([960001+$i,$id]);
    }
    conferir(ids(AvaliacaoTesteFeed::naConexao($db,960001)) === range(960149,960110), 'Limite de 40 ou desempate instável');
    // A base isolada também exercita o caso em que ninguém recebeu curtidas.
    $db->exec('DELETE FROM curtida_avaliacao');
    $feed = AvaliacaoTesteFeed::naConexao($db,960001);
    conferir(ids($feed) === range(960149,960110), 'Sem curtidas, as sugestões devem usar as mais recentes');
    conferir(array_unique(array_map('intval',array_column($feed['avaliacoes'],'quantidade_curtidas'))) === [0], 'Contagem zero incorreta');
    conferir(AvaliacaoTesteFeed::naConexao($db,0) === null, 'Usuário inexistente não deve receber feed');
    $db->rollBack();
    echo "PASS: curtidas, preferências ignoradas, empates, autores/gêneros, amigos, limite, zero curtidas e rollback.\n";
} catch (Throwable $erro) {
    if ($db->inTransaction()) $db->rollBack();
    fwrite(STDERR, 'FAIL: ' . $erro->getMessage() . "\n");
    exit(1);
}
