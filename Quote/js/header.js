(() => {
    const filtros = new Set(['geral', 'livros', 'generos', 'autores', 'leitores']);
    const parametros = new URLSearchParams(location.search);
    const filtro = filtros.has(parametros.get('filtro')) ? parametros.get('filtro') : 'geral';
    const termo = (parametros.get('termo') || '').trim().slice(0, 100);
    document.querySelectorAll('form.barraPesquisa, form.pesquisaMobile').forEach(formulario => {
        const campo = formulario.querySelector('[name="termo"]');
        if (!campo) return;
        campo.value = termo;
        const campoFiltro = formulario.querySelector('[data-filtro-header]');
        if (campoFiltro) campoFiltro.value = filtro;
        formulario.addEventListener('submit', evento => {
            campo.value = campo.value.trim();
            if (!campo.value) {
                evento.preventDefault();
                campo.focus();
            }
        });
    });
    let codigo = null;
    let usuario = null;
    try {
        codigo = sessionStorage.getItem('codigo');
        usuario = JSON.parse(sessionStorage.getItem('usuario') || 'null');
    } catch (_) { /* Os links e a pesquisa funcionam também sem uma sessão. */ }
    document.querySelectorAll('.cabecalhoPrincipal .avatarHeader').forEach(imagem => {
        imagem.addEventListener('error', () => { imagem.src = '../img/avatar.jpg'; }, { once: true });
        imagem.src = /^[1-9]\d*$/.test(codigo || '') ? '../img/' + codigo + '.png' : '../img/avatar.jpg';
    });
    const nome = document.getElementById('nomeUsuarioHeader');
    const email = document.getElementById('emailUsuarioHeader');
    if (usuario && typeof usuario === 'object' && !Array.isArray(usuario)) {
        if (nome) nome.textContent = typeof usuario.nm_usuario === 'string' ? usuario.nm_usuario : 'Seu perfil';
        if (email) email.textContent = typeof usuario.email === 'string' ? usuario.email : '';
    }
})();
