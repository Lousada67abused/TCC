<?php
// Este teste também roda com php -n, sem GD, Fileinfo ou banco.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../classes/base/Banco.php';
require_once __DIR__ . '/../classes/models/AvatarUsuario.php';
$arquivo = tempnam(sys_get_temp_dir(), 'quote-jpeg-');
$metodo = new ReflectionMethod(AvatarUsuario::class, 'JpegPreparado');
$metodo->setAccessible(true);
$falhou = false;
function conferir($condicao, $mensagem) {
    if (!$condicao) throw new RuntimeException($mensagem);
}
try {
    foreach (['avatar-baseline.jpg', 'avatar-progressivo.jpg'] as $nome) {
        $jpeg = file_get_contents(__DIR__ . '/fixtures/' . $nome);
        file_put_contents($arquivo, $jpeg);
        $limpo = $metodo->invoke(null, $arquivo);
        $dimensoes = getimagesizefromstring($limpo);
        conferir($dimensoes[0] === 512 && $dimensoes[1] === 512 && $dimensoes['mime'] === 'image/jpeg', 'Imagem válida foi alterada');
        if (function_exists('imagecreatefromstring')) {
            $imagem = imagecreatefromstring($limpo);
            conferir($imagem !== false && imagesx($imagem) === 512 && imagesy($imagem) === 512, 'JPEG deixou de ser decodificável');
            imagedestroy($imagem);
        }
        $exif = "Exif\0\0DADOS_PRIVADOS";
        $comentario = 'COMENTARIO_PRIVADO';
        $adicionais = "\xff\xe1" . pack('n', strlen($exif) + 2) . $exif .
            "\xff\xfe" . pack('n', strlen($comentario) + 2) . $comentario;
        file_put_contents($arquivo, "\xff\xd8" . $adicionais . substr($jpeg, 2) . '<?php conteudo_extra(); ?>');
        conferir($metodo->invoke(null, $arquivo) === $limpo, 'Metadados ou conteúdo após EOI foram preservados');
    }
    $jpeg = file_get_contents(__DIR__ . '/fixtures/avatar-baseline.jpg');
    $quadro = strpos($jpeg, "\xff\xc0");
    $scan = strpos($jpeg, "\xff\xda");
    $inicioPixels = $scan + 2 + unpack('n', substr($jpeg, $scan + 2, 2))[1];
    $invalidos = [
        '<?php nao_e_imagem(); ?>', "\xff\xd8\xff\xd9", substr($jpeg, 0, -2),
        "\xff\xd8\xff\xe1\x00\x01" . substr($jpeg, 2),
        substr_replace($jpeg, pack('n', 513), $quadro + 7, 2),
        substr_replace($jpeg, "\x04", $quadro + 9, 1),
        substr_replace($jpeg, "\x00", $scan + 4, 1),
        substr($jpeg, 0, $inicioPixels) . "\xff\xd9",
    ];
    foreach ($invalidos as $invalido) {
        file_put_contents($arquivo, $invalido);
        try {
            $metodo->invoke(null, $arquivo);
            throw new RuntimeException('JPEG inválido aceito');
        } catch (DomainException $erro) {
            conferir($erro->getCode() === 422, 'Erro incorreto para imagem inválida');
        }
    }
    echo "PASS: JPEG baseline/progressivo, 512px, remoção de metadados/cauda e rejeição de imagens malformadas.\n";
} catch (Throwable $erro) {
    fwrite(STDERR, 'FAIL: ' . $erro->getMessage() . "\n");
    $falhou = true;
} finally {
    if (is_file($arquivo)) unlink($arquivo);
}
if ($falhou) exit(1);
