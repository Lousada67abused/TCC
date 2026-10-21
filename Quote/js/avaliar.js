(() => {
    const card = document.querySelector('.cardNovaResenha');
    const form = document.querySelector('.formularioAvaliacao');
    const text = document.getElementById('txtResenha');
    const button = document.querySelector('.btnPublicar');
    const stars = document.querySelectorAll('.avaliadorEstrelasInput span');
    const list = document.querySelector('.listaResenhasComunidade');
    if (!card || !form || !text || !button || !list) return;

    const codigoUsuario = sessionStorage.getItem('codigo');
    const codigoLivro = sessionStorage.getItem('codigoLivro');
    let nota = 0;
    let carregado = false;
    let enviando = false;
    let minhaResenha = null;
    let usuario = {};
    try { usuario = JSON.parse(sessionStorage.getItem('usuario')) || {}; } catch (_) {}

    const message = document.createElement('p');
    message.className = 'mensagemErro';
    message.setAttribute('role', 'status');
    card.before(message);
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Tentar novamente';
    retry.hidden = true;
    message.after(retry);
    const style = document.createElement('style');
    style.textContent = '.cardNovaResenha[hidden]{display:none!important}.containerDetalhesLivro.resenhaPublicada .cardResenhaUsuario{border:1px solid #bdd7ff;box-shadow:none}.avaliadorEstrelasInput span{cursor:pointer}.avaliadorEstrelasInput .estrelaCheia,.listaResenhasComunidade .estrelaCheia{color:#ffc107;font-variation-settings:"FILL" 1}.avaliadorEstrelasInput .estrelaVazia,.listaResenhasComunidade .estrelaVazia{color:#b3afaf;font-variation-settings:"FILL" 1}.textoResenhaUsuario{white-space:pre-wrap}';
    document.head.appendChild(style);

    function foto(img, codigo) {
        img.onerror = function () { this.onerror = null; this.src = '../img/avatar.png'; };
        img.src = '../img/' + encodeURIComponent(codigo) + '.png';
    }
    const avatar = card.querySelector('img');
    if (avatar && codigoUsuario) foto(avatar, codigoUsuario);

    function atualizarTela() {
        card.hidden = !carregado || Boolean(minhaResenha) || !codigoUsuario;
        button.disabled = !carregado || enviando || Boolean(minhaResenha);
        document.querySelector('.containerDetalhesLivro')?.classList.toggle('resenhaPublicada', Boolean(minhaResenha));
    }
    function elemento(tag, classe, conteudo) {
        const el = document.createElement(tag);
        el.className = classe;
        if (conteudo !== undefined) el.textContent = conteudo;
        return el;
    }
    function criarResenha(avaliacao) {
        const item = elemento('li', 'cardResenhaUsuario');
        item.dataset.idAvaliacao = avaliacao.id_avaliacao || '';
        const article = document.createElement('article');
        const top = elemento('div', 'topoCardResenha');
        const img = elemento('img', 'fotoUsuarioCard');
        img.alt = 'Foto de perfil de ' + (avaliacao.nm_usuario || 'Leitor');
        foto(img, avaliacao.id_usuario);
        const details = elemento('div', 'detalhesAutorCard');
        details.append(elemento('span', 'nomeUsuarioResenha', avaliacao.nm_usuario || 'Leitor'));
        const rating = elemento('div', 'estrelasExibicao');
        rating.setAttribute('aria-label', 'Avaliação: ' + avaliacao.nota + ' de 5');
        for (let i = 1; i <= 5; i++) {
            rating.append(elemento('span', 'material-symbols-outlined ' + (i <= Number(avaliacao.nota) ? 'estrelaCheia' : 'estrelaVazia'), 'star'));
        }
        details.append(rating);
        const date = elemento('time', 'dataResenha');
        if (avaliacao.dt_avaliacao) {
            const raw = String(avaliacao.dt_avaliacao).slice(0, 10);
            date.dateTime = raw;
            date.textContent = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw.split('-').reverse().join('/') : raw;
        }
        details.append(date);
        top.append(img, details);
        article.append(top, elemento('p', 'textoResenhaUsuario', avaliacao.txt_resenha || ''));
        item.append(article);
        return item;
    }
    function mostrarResenhas(avaliacoes) {
        minhaResenha = avaliacoes.find(a => String(a.id_usuario) === String(codigoUsuario)) || null;
        const ordenadas = minhaResenha ? [minhaResenha, ...avaliacoes.filter(a => String(a.id_usuario) !== String(codigoUsuario))] : avaliacoes;
        list.replaceChildren(...ordenadas.map(criarResenha));
        atualizarTela();
    }
    async function consultar() {
        const response = await fetch('../api/buscarAvaliacaoLivro.php?codigoLivro=' + encodeURIComponent(codigoLivro));
        const resultado = await response.json();
        if (!response.ok || !(resultado.status === true || resultado.status === 'true') || !Array.isArray(resultado.resposta)) {
            throw new Error('Não foi possível verificar as resenhas. Tente novamente.');
        }
        return resultado.resposta;
    }
    async function iniciar() {
        retry.hidden = true;
        message.textContent = 'Verificando as resenhas do livro...';
        try {
            if (!codigoLivro) throw new Error('Selecione um livro antes de avaliar.');
            const avaliacoes = await consultar();
            carregado = true;
            mostrarResenhas(avaliacoes);
            message.textContent = codigoUsuario ? '' : 'Entre na sua conta para publicar uma resenha.';
        } catch (erro) {
            message.textContent = erro.message;
            retry.hidden = false;
        }
        atualizarTela();
    }
    retry.addEventListener('click', iniciar);

    stars.forEach((star, index) => {
        star.tabIndex = 0;
        star.setAttribute('role', 'button');
        star.setAttribute('aria-label', 'Dar nota ' + (index + 1));
        function selecionar() {
            nota = index + 1;
            stars.forEach((el, j) => {
                el.classList.toggle('estrelaCheia', j < nota);
                el.classList.toggle('estrelaVazia', j >= nota);
                el.setAttribute('aria-pressed', String(j < nota));
            });
        }
        star.addEventListener('click', selecionar);
        star.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selecionar(); }
        });
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (!carregado || enviando || minhaResenha) return;
        if (!codigoUsuario) { message.textContent = 'Entre na sua conta para avaliar.'; return; }
        if (nota < 1 || nota > 5) { message.textContent = 'Selecione uma nota de 1 a 5.'; return; }
        const resenha = text.value.trim();
        if (!resenha) { message.textContent = 'Escreva sua resenha antes de publicar.'; text.focus(); return; }
        if (resenha.length > 500) { message.textContent = 'A resenha deve ter no máximo 500 caracteres.'; return; }
        enviando = true;
        atualizarTela();
        message.textContent = 'Publicando...';
        try {
            // Check again to detect reviews saved in another tab before sending.
            const avaliacoes = await consultar();
            if (avaliacoes.some(a => String(a.id_usuario) === String(codigoUsuario))) {
                mostrarResenhas(avaliacoes);
                message.textContent = 'Você já publicou uma resenha deste livro.';
                return;
            }
            const response = await fetch('../api/avaliarLivro.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigoUsuario, codigoLivro, nota, resenha })
            });
            const resultado = await response.json();
            if (!response.ok || !(resultado.status === true || resultado.status === 'true')) {
                throw new Error(resultado.mensagem || resultado.erro || 'Não foi possível publicar a resenha.');
            }
            // Only hide the form after the server confirms the save.
            const local = { id_usuario: codigoUsuario, nm_usuario: usuario.nm_usuario || 'Você', nota, txt_resenha: resenha, dt_avaliacao: new Date().toLocaleDateString('sv-SE') };
            mostrarResenhas([local, ...avaliacoes]);
            message.textContent = 'Resenha publicada com sucesso!';
            try {
                const atualizadas = await consultar();
                if (atualizadas.some(a => String(a.id_usuario) === String(codigoUsuario))) mostrarResenhas(atualizadas);
            } catch (_) { /* Keep the confirmed review visible if refresh fails. */ }
        } catch (erro) {
            message.textContent = erro.message || 'Não foi possível publicar. Tente novamente.';
        } finally {
            enviando = false;
            atualizarTela();
        }
    });
    atualizarTela();
    iniciar();
})();
