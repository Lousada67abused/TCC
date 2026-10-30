<?php
// Integração em uma base de teste: fixtures revertidas ao final, inclusive em falhas.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
if ($argc !== 2 || !is_readable($argv[1])) {
    fwrite(STDERR, "Uso: php test_notas_livros.php /caminho/cliente-teste.cnf\n");
    exit(1);
}
$config = parse_ini_file($argv[1], true)['client'] ?? [];
if (empty($config['socket']) || empty($config['user'])) {
    fwrite(STDERR, "Configure socket e user na seção [client] de uma base de teste.\n");
    exit(1);
}
$db = new PDO('mysql:unix_socket=' . $config['socket'] . ';dbname=quote;charset=utf8mb4',
    $config['user'], $config['password'] ?? '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$db->exec("SET SESSION sql_mode='STRICT_TRANS_TABLES,ONLY_FULL_GROUP_BY,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
function conferir($condicao, $mensagem) {
    if (!$condicao) throw new RuntimeException($mensagem);
}
function consulta($db, $procedure, $parametros = []) {
    $sql = 'CALL ' . $procedure . '(' . implode(',', array_fill(0, count($parametros), '?')) . ')';
    $st = $db->prepare($sql);
    $st->execute($parametros);
    $linhas = $st->fetchAll(PDO::FETCH_ASSOC);
    $st->closeCursor();
    return $linhas;
}
$primeiroLivro = 9890000000001;
$notas = [[5], [5, 5, 4], [5, 5, 5, 5, 4, 4], [], array_merge([5], array_fill(0, 300, 4)), array_merge([5], array_fill(0, 249, 4))];
$esperadas = [5, 4.7, 4.7, 0, 4, 4];
$casos = 0;
try {
    $db->beginTransaction();
    conferir((int)$db->query('SELECT COUNT(*) FROM usuario WHERE id_usuario BETWEEN 980001 AND 980400')->fetchColumn() === 0,
        'Faixa de usuários de teste ocupada; use uma base isolada.');
    $usuario = $db->prepare("INSERT INTO usuario (id_usuario,nm_usuario,email,senha) VALUES (?, ?, ?, MD5('123'))");
    foreach (array_merge([980001, 980002], range(980100, 980400)) as $id) {
        $usuario->execute([$id, '__teste_notas__ ' . $id, 'notas-' . $id . '@example.invalid']);
    }
    $db->exec("INSERT INTO editora VALUES (980001, '__teste_notas__ Editora')");
    $db->exec("INSERT INTO autor VALUES (980001, '__teste_notas__ Autor 1'), (980002, '__teste_notas__ Autor 2')");
    $db->exec("INSERT INTO genero VALUES (980001, '__teste_notas__ Genero 1'), (980002, '__teste_notas__ Genero 2')");
    $livro = $db->prepare("INSERT INTO livro (id_livro,titulo,cd_editora) VALUES (?, ?, 980001)");
    $avaliacao = $db->prepare("INSERT INTO avaliacao (id_avaliacao,nota,id_livro,id_usuario) VALUES (?, ?, ?, ?)");
    $avaliacaoId = 980001;
    foreach ($notas as $i => $valores) {
        $id = $primeiroLivro + $i;
        $livro->execute([$id, '__teste_notas__ Livro ' . ($i + 1)]);
        $db->exec("INSERT INTO autor_livro VALUES (980001, $id)");
        $db->exec("INSERT INTO livro_genero VALUES (980001, $id)");
        foreach ($valores as $j => $nota) $avaliacao->execute([$avaliacaoId++, $nota, $id, 980100 + $j]);
    }
    // Um livro com vários autores e gêneros não pode duplicar suas avaliações.
    $multiplo = $primeiroLivro + 2;
    $semNota = $primeiroLivro + 3;
    $db->exec("INSERT INTO autor_livro VALUES (980002, $multiplo)");
    $db->exec("INSERT INTO livro_genero VALUES (980002, $multiplo)");
    $db->exec("INSERT INTO biblioteca (id_biblioteca,id_livro,status,favorito,visivel,id_usuario)
        VALUES (980001,$multiplo,'lido',1,1,980001), (980002,$semNota,'lido',1,1,980001)");
    $db->exec('INSERT INTO preferencia_usuario (id_usuario,id_genero) VALUES (980002,980001)');
    $consultas = [
        ['sp_buscar_livros', [], 6], ['filtroLivro', ['__teste_notas__'], 6],
        ['buscarLivroTitulo', ['__teste_notas__'], 6], ['buscarLivroAutor', ['__teste_notas__'], 6],
        ['buscarLivroGenero', ['__teste_notas__'], 6], ['sp_buscar_livros_por_editora', [980001], 6],
        ['sp_buscar_livros_por_autor', [980001], 6], ['sp_buscar_livros_por_genero', [980001], 6],
        ['recomendarLivroUsuario', [980002], 6], ['buscarBibliotecaUsuario', [980001], 2],
        ['filtrarBibliotecaStatus', [980001, 'lido'], 2], ['filtrarBibliotecaFavoritos', [980001], 2],
        ['buscarLivroCodigo', [$multiplo], 1], ['buscarLivroCodigo', [$semNota], 1],
    ];
    foreach ($consultas as [$nome, $parametros, $quantidade]) {
        $encontrados = [];
        foreach (consulta($db, $nome, $parametros) as $linha) {
            $i = (int)$linha['id_livro'] - $primeiroLivro;
            if ($i < 0 || $i >= count($esperadas)) continue;
            conferir(array_key_exists('nota_media', $linha), $nome . ': falta nota_media');
            conferir(preg_match('/^\d+\.\d$/', (string)$linha['nota_media']) === 1, $nome . ': média deve ter uma casa decimal');
            conferir(abs((float)$linha['nota_media'] - $esperadas[$i]) < 0.00001, $nome . ': média incorreta');
            $encontrados[$i] = true;
        }
        conferir(count($encontrados) === $quantidade, $nome . ': livros ausentes ou filtro alterado');
        $casos++;
    }
    foreach ([$multiplo => 4.7, $semNota => 0] as $id => $media) {
        $linhas = consulta($db, 'calcularNotaMediaLivro', [$id]);
        conferir(abs((float)$linhas[0]['nota_media'] - $media) < 0.00001, 'Cálculo individual divergente');
        $casos++;
    }
    $ranking = consulta($db, 'rankingLivroGenero', [980001]);
    $ordem = array_map('strval', [$primeiroLivro, $multiplo, $primeiroLivro + 1, $primeiroLivro + 5, $primeiroLivro + 4]);
    conferir(array_column($ranking, 'id_livro') == $ordem, 'Ranking: ordem ou livros sem nota incorretos');
    conferir(array_map('intval', array_column($ranking, 'quantidade_avaliacoes')) === [1, 6, 3, 250, 301],
        'Contagem multiplicada por vínculos ou desempate incorreto');
    conferir(count(explode(', ', $ranking[1]['nm_autor'])) === 2 && count(explode(', ', $ranking[1]['nm_genero'])) === 2,
        'Autores ou gêneros omitidos no ranking');
    // As últimas duas médias arredondam a 4,0; a maior média real tem menos avaliações.
    conferir((float)$ranking[3]['nota_media'] === 4.0 && (float)$ranking[4]['nota_media'] === 4.0, 'Fixture de arredondamento inválida');
    $geral = consulta($db, 'rankingLivroGenero', [0]);
    conferir(count($geral) >= 5 && count($geral) <= 10, 'Ranking geral/LIMIT incorreto');
    $casos += 2;
    $db->rollBack();
    echo "PASS: $casos cenários, modo estrito, médias/empates/vínculos e rollback.\n";
} catch (Throwable $erro) {
    if ($db->inTransaction()) $db->rollBack();
    fwrite(STDERR, 'FAIL: ' . $erro->getMessage() . "\n");
    exit(1);
}
