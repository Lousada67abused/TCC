(() => {
    const list = document.querySelector('.listaResenhasComunidade');
    if (!list) return;
    const container = list.closest('.containerDetalhesLivro');
    const codigoLivro = sessionStorage.getItem('codigoLivro');
    const codigoUsuario = sessionStorage.getItem('codigo');
    let avaliacoesAtuais = [];
    let criarAcoesAtuais = null;
    function foto(img, codigo) {
        img.onerror = function () { this.onerror = null; this.src = '../img/avatar.jpg'; };
        img.src = '../img/' + encodeURIComponent(codigo) + '.png';
    }
    function elemento(tag, classe, conteudo) {
        const el = document.createElement(tag);
        el.className = classe;
        if (conteudo !== undefined) el.textContent = conteudo;
        return el;
    }
    function linkPerfil(codigo, classe) {
        const valido = /^[1-9]\d{0,9}$/.test(String(codigo || '')) && Number(codigo) <= 2147483647;
        const link = elemento(valido ? 'a' : 'span', classe);
        if (valido) link.href = 'perfilPublico.html?codigoUsuario=' + encodeURIComponent(codigo);
        return link;
    }
    function criarResenha(avaliacao, criarAcoes) {
        const item = elemento('li', 'cardResenhaUsuario');
        item.dataset.idAvaliacao = avaliacao.id_avaliacao || '';
        const article = document.createElement('article');
        const top = elemento('div', 'topoCardResenha');
        const img = elemento('img', 'fotoUsuarioCard');
        img.alt = 'Foto de perfil de ' + (avaliacao.nm_usuario || 'Leitor');
        foto(img, avaliacao.id_usuario);
        const linkAvatar = linkPerfil(avaliacao.id_usuario, 'linkPerfilAvatar');
        linkAvatar.setAttribute('aria-label', 'Ver perfil de ' + (avaliacao.nm_usuario || 'Leitor'));
        linkAvatar.append(img);
        const details = elemento('div', 'detalhesAutorCard');
        const linkNome = linkPerfil(avaliacao.id_usuario, 'nomeUsuarioResenha linkPerfilUsuario');
        linkNome.textContent = avaliacao.nm_usuario || 'Leitor';
        details.append(linkNome);
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
        top.append(linkAvatar, details);
        article.append(top, elemento('p', 'textoResenhaUsuario', avaliacao.txt_resenha || ''));
        if (criarAcoes) criarAcoes(avaliacao, item, article);
        item.append(article);
        return item;
    }

    function atualizarQuantidade() {
        container.querySelectorAll('.contadorTotal').forEach(el => {
            el.textContent = '(' + avaliacoesAtuais.length + ')';
        });
    }
    function mostrar(avaliacoes, criarAcoes = criarAcoesAtuais) {
        criarAcoesAtuais = criarAcoes;
        avaliacoesAtuais = [...avaliacoes];
        const minhas = avaliacoesAtuais.filter(a => String(a.id_usuario) === String(codigoUsuario));
        const outras = avaliacoesAtuais.filter(a => String(a.id_usuario) !== String(codigoUsuario));
        list.replaceChildren(...[...minhas, ...outras].map(a => criarResenha(a, criarAcoes)));
        atualizarQuantidade();
        const mais = container.querySelector('.containerBtnVerMais');
        if (mais) mais.hidden = true;
        let vazio = container.querySelector('.avisoSemResenhas');
        if (!vazio) {
            vazio = elemento('p', 'avisoSemResenhas', 'Este livro ainda não tem resenhas.');
            list.after(vazio);
        }
        vazio.hidden = avaliacoesAtuais.length !== 0;
    }
    async function consultar() {
        if (!codigoLivro) throw new Error('Selecione um livro para ver as resenhas.');
        const response = await fetch('../api/buscarAvaliacaoLivro.php?codigoLivro=' + encodeURIComponent(codigoLivro));
        const resultado = await response.json();
        if (!response.ok || !(resultado.status === true || resultado.status === 'true') || !Array.isArray(resultado.resposta)) {
            throw new Error('Não foi possível carregar as resenhas. Tente novamente.');
        }
        return resultado.resposta;
    }
    function remover(codigoAvaliacao) {
        mostrar(avaliacoesAtuais.filter(a => String(a.id_avaliacao) !== String(codigoAvaliacao)));
    }
    function atualizar(avaliacao) {
        mostrar(avaliacoesAtuais.map(a => String(a.id_avaliacao) === String(avaliacao.id_avaliacao) ? { ...a, ...avaliacao } : a));
    }
    window.ResenhasLivro = { consultar, mostrar, remover, atualizar };
    // avaliar.js coordinates the initial query when the review form is present.
    if (!container.querySelector('.formularioAvaliacao')) {
        const status = elemento('p', 'statusResenhas', 'Carregando resenhas...');
        status.setAttribute('role', 'status');
        list.before(status);
        list.replaceChildren();
        container.querySelectorAll('.secaoResenhasComunidade .contadorTotal').forEach(el => el.textContent = '(...)');
        consultar().then(avaliacoes => { mostrar(avaliacoes); status.textContent = ''; })
            .catch(() => { status.textContent = 'Não foi possível carregar as resenhas. Atualize a página para tentar novamente.'; });
    }
})();
