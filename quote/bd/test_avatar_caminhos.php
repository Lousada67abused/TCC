<?php
// Regressão dos caminhos de avatar, sem banco e sem alterar fotos de usuários.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$projeto = dirname(__DIR__, 2);
$temporario = str_replace('\\', '/', sys_get_temp_dir()) . '/quote-avatar-' . bin2hex(random_bytes(8));
$pastaModelo = $temporario . '/public/projeto/quote/classes/models';
$configuracaoAnterior = getenv('QUOTE_AVATAR_DIR');
$falhou = false;
function conferir($condicao, $mensagem) {
    if (!$condicao) throw new RuntimeException($mensagem);
}
function lerFoto($codigo) {
    $foto = AvatarUsuario::Abrir($codigo, false);
    try { $foto['conteudo'] = stream_get_contents($foto['arquivo']); }
    finally { fclose($foto['arquivo']); }
    unset($foto['arquivo']);
    return $foto;
}
try {
    mkdir($pastaModelo, 0750, true);
    mkdir($temporario . '/public/projeto/quote/img', 0750, true);
    mkdir($temporario . '/public/projeto/Quote/img', 0750, true);
    copy($projeto . '/quote/classes/models/AvatarUsuario.php', $pastaModelo . '/AvatarUsuario.php');
    copy($projeto . '/Quote/img/avatar.jpg', $temporario . '/public/projeto/Quote/img/avatar.jpg');
    copy($projeto . '/Quote/img/1.png', $temporario . '/public/projeto/Quote/img/1.png');
    copy($projeto . '/quote/img/9.png', $temporario . '/public/projeto/quote/img/9.png');
    require_once $projeto . '/quote/classes/base/Banco.php';
    require_once $pastaModelo . '/AvatarUsuario.php';
    $diretorio = new ReflectionMethod(AvatarUsuario::class, 'Diretorio');
    $diretorio->setAccessible(true);
    putenv('QUOTE_AVATAR_DIR');

    // Há uma pasta quote/img, mas o padrão e a foto 1 estão em Quote/img.
    $_SERVER['DOCUMENT_ROOT'] = $temporario . '/public/projeto';
    $foto = lerFoto(100);
    conferir(!$foto['personalizado'] && $foto['tipo'] === 'image/jpeg', 'Avatar padrão não carregou com as duas pastas');
    conferir(hash('sha256', $foto['conteudo']) === hash_file('sha256', $projeto . '/Quote/img/avatar.jpg'), 'Arquivo padrão incorreto');
    foreach ([1, 9] as $codigo) {
        $foto = lerFoto($codigo);
        conferir($foto['personalizado'] && $foto['tipo'] === 'image/png', 'Foto legada não carregou: ' . $codigo);
    }
    $antigo = $temporario . '/public/quote-private/avatars';
    conferir($diretorio->invoke(null, false) === $antigo, 'Caminho anterior seguro deve ser preservado');
    mkdir($antigo, 0750, true);
    copy($projeto . '/Quote/img/avatar.jpg', $antigo . '/100.jpg');
    conferir(lerFoto(100)['personalizado'], 'Foto já salva no caminho anterior deixou de aparecer');

    // Simula a raiz htdocs/www, com o projeto instalado numa subpasta.
    $_SERVER['DOCUMENT_ROOT'] = $temporario . '/public';
    $externo = $temporario . '/quote-private/avatars';
    conferir($diretorio->invoke(null, false) === $externo, 'Caminho padrão ficou dentro da raiz pública');
    conferir(!lerFoto(100)['personalizado'], 'Leitura não deve procurar uploads dentro da pasta pública');
    conferir($diretorio->invoke(null, true) === $externo && is_dir($externo), 'Pasta externa não foi preparada');
    copy($projeto . '/Quote/img/avatar.jpg', $externo . '/100.jpg');
    conferir(lerFoto(100)['personalizado'], 'Foto enviada para a pasta externa não foi encontrada');

    $personalizado = $temporario . '/armazenamento-personalizado';
    putenv('QUOTE_AVATAR_DIR=' . $personalizado);
    conferir($diretorio->invoke(null, true) === $personalizado, 'Configuração explícita fora da raiz foi ignorada');
    foreach ([$temporario . '/public/avatares', 'pasta-relativa'] as $invalido) {
        putenv('QUOTE_AVATAR_DIR=' . $invalido);
        try {
            $diretorio->invoke(null, false);
            throw new RuntimeException('Caminho inseguro ou relativo foi aceito');
        } catch (DomainException $erro) {
            conferir($erro->getCode() === 503, 'Erro de configuração incorreto');
        }
    }
    echo "PASS: pastas Quote/quote, padrão/legado, instalação dentro da raiz pública, armazenamento anterior e pasta configurada.\n";
} catch (Throwable $erro) {
    fwrite(STDERR, 'FAIL: ' . $erro->getMessage() . "\n");
    $falhou = true;
} finally {
    putenv($configuracaoAnterior === false ? 'QUOTE_AVATAR_DIR' : 'QUOTE_AVATAR_DIR=' . $configuracaoAnterior);
    if (is_dir($temporario)) {
        $itens = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($temporario, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST);
        foreach ($itens as $item) {
            if ($item->isDir() && !$item->isLink()) rmdir($item->getPathname());
            else unlink($item->getPathname());
        }
        rmdir($temporario);
    }
}
if ($falhou) exit(1);
