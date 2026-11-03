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
        'biblioteca' => 'id_biblioteca', 'avaliacao' => 'id_avaliacao'] as $tabela => $coluna) {
        conferir((int)$db->query("SELECT COUNT(*) FROM $tabela WHERE $coluna BETWEEN 960001 AND 960200")->fetchColumn() === 0,
            'Faixa de fixtures ocupada; use uma base isolada.');
    }
    conferir((int)$db->query('SELECT COUNT(*) FROM livro WHERE id_livro BETWEEN 9870000000001 AND 9870000000010')->fetchColumn() === 0,
        'Faixa de livros de teste ocupada.');
    $inserir = $db->prepare("INSERT INTO usuario (id_usuario,nm_usuario,email) VALUES (?, '__teste_feed__', ?)");
    foreach (range(960001, 960010) as $id) $inserir->execute([$id, 'feed-' . $id . '@example.invalid']);
    $db->exec("INSERT INTO genero VALUES (960001,'__teste_feed_1__'),(960002,'__teste_feed_2__'),(960003,'__teste_feed_3__')");
    $db->exec("INSERT INTO autor VALUES (960001,'Autor A'),(960002,'Autor B')");
    $db->exec("INSERT INTO livro (id_livro,titulo) VALUES (9870000000001,'__teste_feed_1__'),(9870000000002,'__teste_feed_2__')");
    $db->exec('INSERT INTO autor_livro VALUES (960001,9870000000001),(960002,9870000000001)');
    $db->exec('INSERT INTO livro_genero VALUES (960001,9870000000001),(960002,9870000000002)');
    $db->exec('INSERT INTO preferencia_usuario VALUES (960001,960001),(960001,960002),
        (960002,960001),(960002,960002),(960003,960001),(960004,960003),(960005,960001)');
    // Repetir um gênero na estante e nas preferências não pode aumentar a afinidade.
    $db->exec("INSERT INTO biblioteca (id_biblioteca,id_livro,status,favorito,visivel,id_usuario) VALUES
        (960001,9870000000001,'lido',1,0,960001),
        (960002,9870000000001,'lido',1,1,960003),
        (960003,9870000000001,'lido',0,0,960006),
        (960004,9870000000002,'lendo',0,1,960007),
        (960005,9870000000001,'desisti',0,1,960008),
        (960006,9870000000001,NULL,0,1,960009),
        (960007,9870000000001,NULL,1,1,960010)");
    $avaliacao = $db->prepare('INSERT INTO avaliacao (id_avaliacao,id_livro,id_usuario,nota,dt_avaliacao,txt_resenha) VALUES (?,9870000000001,?,4,?,?)');
    foreach ([[960001,960001,'2099-01-01','Própria'],[960002,960002,'2026-01-01','Duas afinidades'],
        [960003,960002,'2026-01-01','Desempate por código'],[960004,960003,'2026-12-20','Uma afinidade'],
        [960005,960004,'2027-01-01','Sem afinidade'],[960006,960006,'2028-01-01','Estante privada'],
        [960007,960007,'2026-12-21','Estante pública'],[960008,960008,'2029-01-01','Desistiu'],
        [960009,960009,'2030-01-01','Status cancelado'],[960010,960010,'2031-01-01','Favorito'],
        [960011,960002,'2098-01-01','   '],[960012,960002,'2098-01-01',null]] as $dados) {
        $avaliacao->execute($dados);
    }

    $feed = AvaliacaoTesteFeed::naConexao($db, 960001);
    conferir($feed['modo'] === 'sugestoes', 'Sem seguidos deve receber sugestões');
    conferir(ids($feed) === [960003,960002,960010,960007,960004],
        'Ordem por afinidade/data/código, deduplicação ou filtros incorretos');
    conferir($feed['avaliacoes'][0]['nm_autor'] === 'Autor A, Autor B', 'Autores omitidos ou avaliação duplicada');
    conferir(!array_key_exists('email', $feed['avaliacoes'][0]), 'Feed expôs dados privados da conta');

    // As leituras privadas do próprio usuário podem personalizar suas sugestões.
    $db->exec('DELETE FROM preferencia_usuario WHERE id_usuario=960001');
    conferir(ids(AvaliacaoTesteFeed::naConexao($db, 960001)) === [960010,960004,960003,960002],
        'Estante própria não personalizou sugestões sem preferências');
    $db->exec('INSERT INTO preferencia_usuario VALUES (960001,960001),(960001,960002)');

    $db->exec('INSERT INTO seguidor VALUES (960001,960005)');
    $feed = AvaliacaoTesteFeed::naConexao($db, 960001);
    conferir($feed['modo'] === 'amigos' && ids($feed) === [], 'Seguido sem resenha não deve ativar sugestões');
    $db->exec('DELETE FROM seguidor WHERE id_seguidor=960001');
    $db->exec('INSERT INTO seguidor VALUES (960001,960004)');
    $feed = AvaliacaoTesteFeed::naConexao($db, 960001);
    conferir($feed['modo'] === 'amigos' && ids($feed) === [960005], 'Feed de amigos mudou ou misturou sugestões');
    $db->exec('DELETE FROM seguidor WHERE id_seguidor=960001');
    conferir(AvaliacaoTesteFeed::naConexao($db, 960001)['modo'] === 'sugestoes', 'Deixar o último amigo não reativou sugestões');

    $db->exec('DELETE FROM preferencia_usuario WHERE id_usuario=960001');
    $db->exec('DELETE FROM biblioteca WHERE id_usuario=960001');
    $feed = AvaliacaoTesteFeed::naConexao($db, 960001);
    conferir($feed['modo'] === 'sugestoes' && count($feed['avaliacoes']) <= 40 && count($feed['avaliacoes']) > 0,
        'Conta sem histórico deve descobrir resenhas recentes');
    conferir(!in_array(960001, ids($feed), true) && !in_array(960011, ids($feed), true) && !in_array(960012, ids($feed), true),
        'Sugestões incluíram resenha própria ou vazia');

    // Uma afinidade com alguém sem resenhas não pode bloquear a descoberta.
    $db->exec('INSERT INTO preferencia_usuario VALUES (960001,960001)');
    $db->exec("UPDATE avaliacao SET txt_resenha='' WHERE id_usuario IN (960002,960003,960010) AND id_avaliacao BETWEEN 960001 AND 960200");
    conferir(in_array(960005, ids(AvaliacaoTesteFeed::naConexao($db, 960001)), true), 'Fallback sem resenhas compatíveis falhou');
    foreach (range(960100, 960149) as $id) $avaliacao->execute([$id,960002,'2099-12-31','Limite estável']);
    conferir(ids(AvaliacaoTesteFeed::naConexao($db, 960001)) === range(960149,960110), 'Limite de 40 ou desempate instável');
    conferir(AvaliacaoTesteFeed::naConexao($db, 0) === null, 'Usuário inexistente não deve receber feed');
    $db->rollBack();
    echo "PASS: afinidade, preferências/estantes, privacidade, amigos, descoberta, ordenação, limite e rollback.\n";
} catch (Throwable $erro) {
    if ($db->inTransaction()) $db->rollBack();
    fwrite(STDERR, 'FAIL: ' . $erro->getMessage() . "\n");
    exit(1);
}
