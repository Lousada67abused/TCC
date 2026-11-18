<?php
class AvatarUsuario extends Banco {
    const MAX_BYTES = 5242880;
    const MAX_PIXELS = 12582912;
    const MAX_DIMENSAO = 6000;

    public static function Codigo($valor) {
        if ((!is_int($valor) && !is_string($valor)) || !preg_match('/^[1-9][0-9]{0,9}$/D', (string) $valor) || $valor > 2147483647) return false;
        return (int) $valor;
    }

    private static function VerificarUsuarios($codigo, $observador = null) {
        return self::Transacao(function ($conexao) use ($codigo, $observador) {
            $consulta = $conexao->prepare('SELECT id_usuario FROM usuario WHERE id_usuario IN (?, ?)');
            $consulta->execute([$codigo, $observador]);
            $codigos = array_map('intval', $consulta->fetchAll(PDO::FETCH_COLUMN));
            $consulta->closeCursor();
            if (!in_array((int) $codigo, $codigos, true)) throw new DomainException('Usuário não encontrado.', 404);
            return $observador !== null && in_array((int) $observador, $codigos, true);
        });
    }

    private static function NormalizarPasta($caminho) {
        if (!is_string($caminho) || $caminho === '' || strpos($caminho, "\0") !== false) {
            throw new DomainException('O armazenamento das fotos não está disponível.', 503);
        }
        $windows = DIRECTORY_SEPARATOR === '\\';
        if ($windows) $caminho = str_replace('\\', '/', $caminho);
        $prefixo = '/';
        if ($windows && preg_match('/^[A-Za-z]:\//', $caminho)) {
            $prefixo = strtoupper(substr($caminho, 0, 2)) . '/';
            $caminho = substr($caminho, 3);
        } elseif ($windows && substr($caminho, 0, 2) === '//') {
            $unc = explode('/', substr($caminho, 2));
            if (count($unc) < 2 || in_array($unc[0], ['', '.', '..'], true) || in_array($unc[1], ['', '.', '..'], true)) {
                throw new DomainException('O armazenamento das fotos não está disponível.', 503);
            }
            $prefixo = '//' . array_shift($unc) . '/' . array_shift($unc) . '/';
            $caminho = implode('/', $unc);
        } elseif ($windows || $caminho[0] !== '/') {
            throw new DomainException('O armazenamento das fotos deve usar um caminho absoluto.', 503);
        }
        $partes = [];
        foreach (explode('/', $caminho) as $parte) {
            if ($parte === '' || $parte === '.') continue;
            if ($parte === '..') array_pop($partes);
            else $partes[] = $parte;
        }
        return $prefixo . implode('/', $partes);
    }

    private static function DentroRaiz($caminho, $raiz) {
        if (!$raiz) return false;
        $caminho = rtrim(self::NormalizarPasta($caminho), '/');
        $raiz = rtrim(self::NormalizarPasta($raiz), '/');
        if (DIRECTORY_SEPARATOR === '\\') {
            $caminho = strtolower($caminho);
            $raiz = strtolower($raiz);
        }
        return $caminho === $raiz || strpos($caminho, $raiz . '/') === 0;
    }

    private static function Diretorio($criar = false) {
        $configurado = getenv('QUOTE_AVATAR_DIR');
        $diretorio = self::NormalizarPasta($configurado !== false && $configurado !== '' ? $configurado : dirname(__DIR__, 4) . '/quote-private/avatars');
        $raizWeb = realpath($_SERVER['DOCUMENT_ROOT'] ?? '') ?: null;
        $real = realpath($diretorio) ?: $diretorio;
        if (self::DentroRaiz($real, $raizWeb)) {
            throw new DomainException('O armazenamento das fotos deve ficar fora da pasta pública.', 503);
        }
        if ($criar && !is_dir($diretorio) && !@mkdir($diretorio, 0750, true) && !is_dir($diretorio)) {
            throw new DomainException('Não foi possível preparar o armazenamento das fotos.', 503);
        }
        $real = realpath($diretorio) ?: $diretorio;
        if (self::DentroRaiz($real, $raizWeb)) {
            throw new DomainException('O armazenamento das fotos deve ficar fora da pasta pública.', 503);
        }
        return $real;
    }

    private static function ComTrava($codigo, $escrita, $operacao) {
        $diretorio = self::Diretorio($escrita);
        if (!$escrita && !is_dir($diretorio)) return $operacao($diretorio);
        $trava = @fopen($diretorio . '/' . $codigo . '.lock', 'c');
        if (!$trava) throw new DomainException('O armazenamento das fotos não está disponível.', 503);
        try {
            if (!flock($trava, $escrita ? LOCK_EX : LOCK_SH)) throw new RuntimeException('Falha ao bloquear avatar.');
            return $operacao($diretorio);
        } finally {
            flock($trava, LOCK_UN);
            fclose($trava);
        }
    }

    private static function PastaImagens() {
        $pasta = dirname(__DIR__, 2) . '/img';
        if (!is_dir($pasta)) $pasta = dirname(__DIR__, 3) . '/Quote/img';
        return $pasta;
    }

    public static function Abrir($codigo, $verificarUsuario = true) {
        if ($verificarUsuario) self::VerificarUsuarios($codigo);
        return self::ComTrava($codigo, false, function ($diretorio) use ($codigo) {
            $removido = $diretorio . '/' . $codigo . '.removido';
            $enviado = $diretorio . '/' . $codigo . '.jpg';
            $legado = self::PastaImagens() . '/' . $codigo . '.png';
            $padrao = self::PastaImagens() . '/avatar.jpg';
            $personalizado = !is_file($removido) && (is_file($enviado) || is_file($legado));
            $caminho = $personalizado ? (is_file($enviado) ? $enviado : $legado) : $padrao;
            $dados = @getimagesize($caminho);
            if (!$dados || !in_array($dados['mime'] ?? '', ['image/jpeg', 'image/png', 'image/webp'], true)) {
                throw new DomainException('A foto de perfil não está disponível.', 503);
            }
            $arquivo = @fopen($caminho, 'rb');
            if (!$arquivo) throw new DomainException('A foto de perfil não está disponível.', 503);
            try {
                $atributos = fstat($arquivo);
                $hash = hash_init('sha256');
                if (hash_update_stream($hash, $arquivo) === false || !rewind($arquivo)) throw new RuntimeException('Falha ao ler avatar.');
                $modificado = (int) $atributos['mtime'];
                if (is_file($removido)) $modificado = max($modificado, (int) filemtime($removido));
                return ['arquivo' => $arquivo, 'tipo' => $dados['mime'], 'tamanho' => (int) $atributos['size'],
                    'modificado' => $modificado, 'versao' => hash_final($hash), 'personalizado' => $personalizado];
            } catch (Throwable $erro) {
                fclose($arquivo);
                throw $erro;
            }
        });
    }

    public static function Metadados($codigo, $observador = null) {
        $autenticado = self::VerificarUsuarios($codigo, $observador);
        $imagem = self::Abrir($codigo, false);
        fclose($imagem['arquivo']);
        return ['codigoUsuario' => (int) $codigo,
            'url' => '../api/avatarUsuario.php?codigoUsuario=' . (int) $codigo . '&v=' . $imagem['versao'],
            'personalizado' => $imagem['personalizado'], 'autenticado' => $autenticado,
            'codigoUsuarioLogado' => $autenticado ? (int) $observador : null, 'versao' => $imagem['versao']];
    }

    private static function LimiteMemoria() {
        $valor = trim(ini_get('memory_limit'));
        if ($valor === '-1') return null;
        if (!preg_match('/^([0-9]+)\s*([KMG]?)$/iD', $valor, $partes)) return 134217728;
        $fator = ['' => 1, 'K' => 1024, 'M' => 1048576, 'G' => 1073741824];
        return (int) $partes[1] * $fator[strtoupper($partes[2])];
    }

    private static function Orientar($imagem, $arquivo, $tipo) {
        if ($tipo !== 'image/jpeg' || !function_exists('exif_read_data')) return $imagem;
        $exif = @exif_read_data($arquivo, 'IFD0', true, false);
        $orientacao = (int) ($exif['IFD0']['Orientation'] ?? 1);
        if (in_array($orientacao, [2, 5, 7], true)) imageflip($imagem, IMG_FLIP_HORIZONTAL);
        if ($orientacao === 4) imageflip($imagem, IMG_FLIP_VERTICAL);
        $angulos = [3 => 180, 5 => 90, 6 => -90, 7 => -90, 8 => 90];
        if (isset($angulos[$orientacao])) {
            $girada = imagerotate($imagem, $angulos[$orientacao], 0xffffff);
            if (!$girada) throw new RuntimeException('Falha ao orientar avatar.');
            imagedestroy($imagem);
            return $girada;
        }
        return $imagem;
    }

    public static function Salvar($codigo, $foto) {
        self::VerificarUsuarios($codigo);
        if (!extension_loaded('gd') || !extension_loaded('fileinfo') || !function_exists('imagejpeg')) {
            throw new DomainException('O envio de fotos não está disponível no servidor. Tente novamente mais tarde.', 503);
        }
        if (!is_array($foto) || !isset($foto['error']) || !is_int($foto['error'])) throw new DomainException('Selecione uma foto.', 400);
        if (in_array($foto['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) throw new DomainException('A foto deve ter no máximo 5 MB.', 413);
        if ($foto['error'] === UPLOAD_ERR_NO_FILE) throw new DomainException('Selecione uma foto.', 400);
        if ($foto['error'] !== UPLOAD_ERR_OK) throw new DomainException('Não foi possível receber a foto. Tente novamente.', 400);
        $temporario = $foto['tmp_name'] ?? null;
        if (!is_string($temporario) || !is_uploaded_file($temporario)) throw new DomainException('Arquivo de foto inválido.', 400);
        $bytes = filesize($temporario);
        if (!$bytes || $bytes > self::MAX_BYTES) throw new DomainException('A foto deve ter de 1 byte a 5 MB.', 413);
        $tipo = (new finfo(FILEINFO_MIME_TYPE))->file($temporario);
        $formatos = ['image/jpeg' => IMAGETYPE_JPEG, 'image/png' => IMAGETYPE_PNG, 'image/webp' => IMAGETYPE_WEBP];
        $dados = @getimagesize($temporario);
        if (!isset($formatos[$tipo]) || !$dados || ($dados[2] ?? null) !== $formatos[$tipo]) {
            throw new DomainException('Escolha uma foto JPG, PNG ou WebP válida.', 415);
        }
        $largura = (int) $dados[0];
        $altura = (int) $dados[1];
        $pixels = $largura * $altura;
        if ($largura < 1 || $altura < 1 || max($largura, $altura) > self::MAX_DIMENSAO || $pixels > self::MAX_PIXELS) {
            throw new DomainException('A foto deve ter até 12 megapixels e 6000 pixels em cada lado.', 400);
        }
        $memoria = self::LimiteMemoria();
        $necessario = $pixels * 8 + $bytes * 2 + 18874368;
        if ($memoria !== null && memory_get_usage(true) + $necessario > $memoria - 4194304) {
            throw new DomainException('Esta foto é grande demais para processar. Escolha uma imagem menor.', 400);
        }
        $origem = null;
        $destino = null;
        $salvo = null;
        try {
            $decodificadores = ['image/jpeg' => 'imagecreatefromjpeg', 'image/png' => 'imagecreatefrompng', 'image/webp' => 'imagecreatefromwebp'];
            $decodificar = $decodificadores[$tipo];
            if (!function_exists($decodificar)) throw new DomainException('Este formato de foto não está disponível no servidor.', 503);
            $origem = @$decodificar($temporario);
            if (!$origem) throw new DomainException('Não foi possível ler a foto. Escolha outro arquivo.', 422);
            $destino = imagecreatetruecolor(512, 512);
            if (!$destino) throw new RuntimeException('Falha ao preparar avatar.');
            imagefill($destino, 0, 0, imagecolorallocate($destino, 255, 255, 255));
            $lado = min(imagesx($origem), imagesy($origem));
            if (!imagecopyresampled($destino, $origem, 0, 0, (int) floor((imagesx($origem) - $lado) / 2),
                (int) floor((imagesy($origem) - $lado) / 2), 512, 512, $lado, $lado)) throw new RuntimeException('Falha ao preparar avatar.');
            // Recorte central quadrado e rotação/reflexão EXIF são equivalentes nesta imagem menor.
            $destino = self::Orientar($destino, $temporario, $tipo);
            $diretorio = self::Diretorio(true);
            $salvo = tempnam($diretorio, '.avatar-');
            if (!$salvo || !imagejpeg($destino, $salvo, 90)) throw new RuntimeException('Falha ao salvar avatar.');
            @chmod($salvo, 0640);
            self::ComTrava($codigo, true, function ($pasta) use ($codigo, $salvo) {
                if (!@rename($salvo, $pasta . '/' . $codigo . '.jpg')) throw new RuntimeException('Falha ao confirmar avatar.');
                $marcador = $pasta . '/' . $codigo . '.removido';
                if (is_file($marcador) && !@unlink($marcador)) throw new RuntimeException('Falha ao confirmar avatar.');
            });
        } finally {
            if ($origem instanceof GdImage) imagedestroy($origem);
            if ($destino instanceof GdImage) imagedestroy($destino);
            if ($salvo !== null && is_file($salvo)) @unlink($salvo);
        }
    }

    public static function Remover($codigo) {
        self::VerificarUsuarios($codigo);
        self::ComTrava($codigo, true, function ($pasta) use ($codigo) {
            $temporario = tempnam($pasta, '.removido-');
            if (!$temporario) throw new RuntimeException('Falha ao remover avatar.');
            try {
                if (file_put_contents($temporario, "removido\n") === false) throw new RuntimeException('Falha ao remover avatar.');
                @chmod($temporario, 0640);
                if (!@rename($temporario, $pasta . '/' . $codigo . '.removido')) throw new RuntimeException('Falha ao remover avatar.');
                $imagem = $pasta . '/' . $codigo . '.jpg';
                if (is_file($imagem) && !@unlink($imagem)) throw new RuntimeException('Falha ao remover avatar.');
            } finally {
                if (is_file($temporario)) @unlink($temporario);
            }
        });
    }
}
