(() => {
    const versoes = new Map();
    const imagens = new WeakSet();
    const padrao = '../img/avatar.jpg';
    function codigoValido(codigo) {
        const texto = String(codigo || '');
        return /^[1-9]\d{0,9}$/.test(texto) && Number(texto) <= 2147483647 ? texto : null;
    }
    function aplicar(imagem, codigo) {
        if (!imagem) return;
        if (!imagens.has(imagem)) {
            imagens.add(imagem);
            imagem.addEventListener('error', () => {
                if (imagem.getAttribute('src') !== padrao) imagem.src = padrao;
            });
        }
        const usuario = codigoValido(codigo);
        if (!usuario) {
            delete imagem.dataset.avatarUsuario;
            imagem.src = padrao;
            return;
        }
        imagem.dataset.avatarUsuario = usuario;
        const parametros = new URLSearchParams({ codigoUsuario: usuario });
        if (versoes.has(usuario)) parametros.set('v', versoes.get(usuario));
        imagem.src = '../api/avatarUsuario.php?' + parametros;
    }
    function atualizar(codigo, versao) {
        const usuario = codigoValido(codigo);
        if (!usuario) return;
        versoes.set(usuario, String(versao || Date.now()));
        document.querySelectorAll('img[data-avatar-usuario="' + usuario + '"]').forEach(imagem => aplicar(imagem, usuario));
        document.dispatchEvent(new CustomEvent('avatar:alterado', { detail: { codigoUsuario: usuario } }));
    }
    window.Avatares = Object.freeze({ aplicar, atualizar });
})();
