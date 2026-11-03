<?php
// Execute somente numa base de teste. As fixtures são revertidas ao final.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
if ($argc !== 2 || !is_readable($argv[1])) {
    fwrite(STDERR, "Uso: php test_metas_por_ano.php /caminho/cliente-teste.cnf\n");
    exit(1);
}
$config = parse_ini_file($argv[1], true)['client'] ?? [];
if (empty($config['socket']) || empty($config['user'])) {
    fwrite(STDERR, "Configure socket e user na seção [client] da base de teste.\n");
    exit(1);
}
$db = new PDO('mysql:unix_socket=' . $config['socket'] . ';dbname=quote;charset=utf8mb4',
    $config['user'], $config['password'] ?? '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$db->exec("SET SESSION sql_mode='STRICT_TRANS_TABLES,ONLY_FULL_GROUP_BY,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
function conferir($condicao, $mensagem) {
    if (!$condicao) throw new RuntimeException($mensagem);
}
function consultar($db, $procedure, $parametros) {
    $st = $db->prepare('CALL ' . $procedure . '(' . implode(',', array_fill(0, count($parametros), '?')) . ')');
    $st->execute($parametros);
    $linhas = $st->fetchAll(PDO::FETCH_ASSOC);
    $st->closeCursor();
    return $linhas;
}
$base = 970001;
$livroBase = 9880000000000;
$casos = 0;
try {
    $db->beginTransaction();
    foreach (['usuario' => 'id_usuario', 'meta_leitura' => 'id_meta', 'avaliacao' => 'id_avaliacao'] as $tabela => $coluna) {
        conferir((int)$db->query("SELECT COUNT(*) FROM $tabela WHERE $coluna BETWEEN 970001 AND 970100")->fetchColumn() === 0,
            'Faixa de fixtures ocupada; use uma base isolada.');
    }
    conferir((int)$db->query('SELECT COUNT(*) FROM livro WHERE id_livro BETWEEN 9880000000000 AND 9880000000100')->fetchColumn() === 0,
        'Faixa de livros ocupada; use uma base isolada.');
    $usuario = $db->prepare("INSERT INTO usuario (id_usuario,nm_usuario,email,senha) VALUES (?, '__teste_metas__', ?, MD5('123'))");
    foreach ([$base, $base + 1, $base + 2] as $id) $usuario->execute([$id, 'meta-' . $id . '@example.invalid']);
    $livro = $db->prepare("INSERT INTO livro (id_livro,titulo) VALUES (?, '__teste_metas__')");
    $biblioteca = $db->prepare('INSERT INTO biblioteca (id_biblioteca,id_livro,status,favorito,visivel,id_usuario) VALUES (?, ?, ?, 0, 0, ?)');
    $avaliacao = $db->prepare("INSERT INTO avaliacao (id_avaliacao,id_livro,id_usuario,dt_avaliacao,nota,txt_resenha) VALUES (?, ?, ?, ?, 4, 'Teste')");
    $datas = ['2025-01-01', '2025-06-15', '2025-12-31', '2026-01-01', '2026-03-01', '2026-06-15', '2026-09-01', '2026-12-31',
        null, null, '2026-05-01', '2026-05-01', '2026-05-01', '2026-05-01', '2027-01-01'];
    foreach ($datas as $i => $data) {
        $id = $livroBase + $i;
        $livro->execute([$id]);
        $status = [10 => 'lendo', 11 => 'quero ler', 12 => 'desisti'][$i] ?? 'lido';
        $biblioteca->execute([$base + $i, $id, $status, $base]);
        // Índice 8 não tem avaliação; 9 tem data nula; 13 só avaliação de outra conta.
        if ($i !== 8) $avaliacao->execute([$base + $i, $id, $i === 13 ? $base + 1 : $base, $data]);
    }
    // Duplicação histórica de avaliação não pode duplicar o livro na meta.
    $avaliacao->execute([$base + 30, $livroBase + 3, $base, '2026-04-01']);
    $biblioteca->execute([$base + 31, $livroBase + 13, 'lido', $base + 1]);
    $meta = $db->prepare('INSERT INTO meta_leitura (id_meta,qnt_livros,data,id_usuario) VALUES (?, ?, ?, ?)');
    foreach ([[0, 10, '2025-12-31', $base], [1, 4, '2026-12-31', $base], [2, 10, '2024-12-31', $base],
        [3, 10, '2026-12-31', $base + 1], [4, 10, '2026-12-31', $base + 2], [5, 10, '2026-06-30', $base]] as [$i, $qtd, $data, $id]) {
        $meta->execute([$base + $i, $qtd, $data, $id]);
    }
    foreach ([[$base, [3, 5, 0, 5]], [$base + 1, [1]], [$base + 2, [0]]] as [$id, $esperadas]) {
        $metas = consultar($db, 'buscarMetaUsuario', [$id]);
        // A lista é ordenada pelo prazo, não pelo ID.
        usort($metas, fn($a, $b) => $a['id_meta'] <=> $b['id_meta']);
        conferir(array_map('intval', array_column($metas, 'livros_lidos')) === $esperadas, 'Contagem anual incorreta para usuário ' . $id);
        foreach ($metas as $m) {
            $individual = consultar($db, 'calcularProgressoMeta', [$m['id_meta']])[0];
            foreach (['livros_lidos', 'progresso', 'texto_progresso'] as $campo) {
                conferir((string)$individual[$campo] === (string)$m[$campo], 'APIs de progresso divergem: ' . $campo);
            }
            conferir((int)$m['progresso'] === min((int)$m['livros_lidos'], (int)$m['qnt_livros']), 'Progresso excedeu a meta');
            $casos++;
        }
    }
    consultar($db, 'atualizarAvaliacao', [$base, 5, 'Resenha editada']);
    conferir($db->query("SELECT dt_avaliacao FROM avaliacao WHERE id_avaliacao=$base")->fetchColumn() === '2025-01-01', 'Editar mudou o ano da leitura');
    $casos++;
    $db->exec("UPDATE biblioteca SET status='lendo' WHERE id_usuario=$base AND id_livro=" . ($livroBase + 4));
    conferir((int)consultar($db, 'calcularProgressoMeta', [$base + 1])[0]['livros_lidos'] === 4, 'Status não lido contou');
    $db->exec("UPDATE biblioteca SET status='lido' WHERE id_usuario=$base AND id_livro=" . ($livroBase + 4));
    $casos++;
    // O fluxo normal de avaliação grava a data no servidor, sem recebê-la do navegador.
    consultar($db, 'cadastrarAvaliacao', [$base, $livroBase + 8, 5, 'Nova avaliação']);
    $nova = $db->query("SELECT dt_avaliacao FROM avaliacao WHERE id_usuario=$base AND id_livro=" . ($livroBase + 8))->fetchColumn();
    conferir($nova === $db->query('SELECT CURDATE()')->fetchColumn(), 'Cadastro não salvou a data atual');
    $ano = (int)substr($nova, 0, 4);
    $meta->execute([$base + 50, 20, $ano . '-12-31', $base]);
    $antes = [2025 => 3, 2026 => 5, 2027 => 1][$ano] ?? 0;
    conferir((int)consultar($db, 'calcularProgressoMeta', [$base + 50])[0]['livros_lidos'] === $antes + 1, 'Nova avaliação não entrou no ano correto');
    $casos++;
    $db->exec("DELETE FROM avaliacao WHERE id_usuario=$base AND id_livro=" . ($livroBase + 8));
    conferir((int)consultar($db, 'calcularProgressoMeta', [$base + 50])[0]['livros_lidos'] === $antes, 'Avaliação excluída continuou contando');
    conferir(consultar($db, 'calcularProgressoMeta', [0]) === [], 'Meta inexistente deveria retornar vazio');
    $casos++;
    $db->rollBack();
    echo "PASS: $casos cenários de metas anuais, data de cadastro/edição e rollback.\n";
} catch (Throwable $erro) {
    if ($db->inTransaction()) $db->rollBack();
    fwrite(STDERR, 'FAIL: ' . $erro->getMessage() . "\n");
    exit(1);
}
