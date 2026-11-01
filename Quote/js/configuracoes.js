(() => {
    const controle = document.getElementById('modoNoturno');
    const estado = document.getElementById('estadoPreferenciaTema');
    const rotulo = document.getElementById('rotuloModoNoturno');
    if (!controle || !estado || !rotulo || !window.TemaQuote) return;

    function atualizar() {
        controle.checked = window.TemaQuote.obter() === 'escuro';
        rotulo.textContent = controle.checked ? 'Ativado' : 'Desativado';
    }
    atualizar();
    controle.disabled = false;
    controle.addEventListener('change', () => {
        window.TemaQuote.definir(controle.checked ? 'escuro' : 'claro');
    });
    window.addEventListener('tema:alterado', evento => {
        atualizar();
        const mensagem = controle.checked ? 'Modo noturno ativado.' : 'Modo noturno desativado.';
        estado.textContent = mensagem + (evento.detail.salvo ?
            (evento.detail.sincronizado ? ' Preferência atualizada em outra aba.' : ' Preferência salva neste navegador.') :
            ' A alteração vale nesta página; seu navegador não permitiu salvar a preferência.');
    });

    let codigo = null;
    let usuario = null;
    try {
        codigo = sessionStorage.getItem('codigo');
        usuario = JSON.parse(sessionStorage.getItem('usuario') || 'null');
    } catch (_) {}
    const conectado = /^[1-9]\d*$/.test(codigo || '');
    const linkPerfil = document.getElementById('acessarConta');
    if (!conectado) {
        linkPerfil.href = 'login.html';
        linkPerfil.querySelector('[data-rotulo-conta]').textContent = 'Entrar na conta';
        document.getElementById('nomeContaConfiguracoes').textContent = 'Seu espaço de leitura';
    } else if (usuario && typeof usuario === 'object' && !Array.isArray(usuario)) {
        document.getElementById('nomeContaConfiguracoes').textContent = usuario.nm_usuario || 'Seu perfil';
        document.getElementById('emailContaConfiguracoes').textContent = usuario.email || '';
    }
    document.querySelectorAll('.fotoContaConfiguracoes').forEach(foto => {
        foto.addEventListener('error', () => { foto.src = '../img/avatar.jpg'; }, { once: true });
        foto.src = conectado ? '../img/' + codigo + '.png' : '../img/avatar.jpg';
    });
})();
