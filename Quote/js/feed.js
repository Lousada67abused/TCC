(() => {
    const secao = document.querySelector('.secaoAmigos');
    if (!secao) return;

    const lista = secao.querySelector('.listaResenhasAmigos');
    const estado = document.getElementById('statusFeed');
    const botaoMais = document.getElementById('verMaisFeed');
    if (!lista || !estado || !botaoMais || lista.dataset.feedInicializado === 'true') return;
    lista.dataset.feedInicializado = 'true';

    const tamanhoPagina = 4;
    let avaliacoes = [];
    let exibidas = 0;
    let codigoUsuario = null;

    try {
        codigoUsuario = sessionStorage.getItem('codigo');
    } catch (_) {
        // O estado de visitante também atende navegadores com storage indisponível.
    }

    function texto(valor, padrao = '') {
        return typeof valor === 'string' || typeof valor === 'number' ? String(valor) : padrao;
    }

    function elemento(tag, classe, conteudo) {
        const novo = document.createElement(tag);
        if (classe) novo.className = classe;
        if (conteudo !== undefined) novo.textContent = conteudo;
        return novo;
    }

    function linkLivro(codigoLivro, classe) {
        const link = elemento('a', classe);
        link.href = 'livro.html';
        const selecionar = () => {
            try {
                sessionStorage.setItem('codigoLivro', codigoLivro);
            } catch (_) {
                // A âncora continua sendo uma navegação normal se o storage falhar.
            }
        };
        link.addEventListener('click', selecionar);
        link.addEventListener('auxclick', selecionar);
        return link;
    }

    function linkPerfil(codigo, classe) {
        const valido = /^[1-9]\d{0,9}$/.test(String(codigo || '')) && Number(codigo) <= 2147483647;
        const link = elemento(valido ? 'a' : 'span', classe);
        if (valido) link.href = 'perfilPublico.html?codigoUsuario=' + encodeURIComponent(codigo);
        return link;
    }

    function criarData(valor) {
        const data = elemento('time', 'dataResenha');
        const iso = texto(valor).slice(0, 10);
        const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
        if (partes) {
            const ano = Number(partes[1]);
            const mes = Number(partes[2]);
            const dia = Number(partes[3]);
            const instante = new Date(Date.UTC(ano, mes - 1, dia));
            if (instante.getUTCFullYear() === ano && instante.getUTCMonth() === mes - 1 && instante.getUTCDate() === dia) {
                data.dateTime = iso;
                data.textContent = instante.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                return data;
            }
        }
        data.textContent = 'Data não informada';
        return data;
    }

    function criarEstrelas(valor) {
        const numero = Number(valor);
        const nota = Number.isFinite(numero) ? Math.round(Math.min(5, Math.max(0, numero))) : 0;
        const estrelas = elemento('div', 'areaEstrelas');
        estrelas.setAttribute('role', 'img');
        estrelas.setAttribute('aria-label', 'Avaliação: ' + nota + ' de 5 estrelas');
        for (let i = 1; i <= 5; i++) {
            const estrela = elemento('span', 'estrelaAvaliacao ' + (i <= nota ? 'estrelaCheia' : 'estrelaVazia'), '★');
            estrela.setAttribute('aria-hidden', 'true');
            estrelas.append(estrela);
        }
        return estrelas;
    }

    function criarCard(avaliacao) {
        const codigoLivro = String(avaliacao.id_livro);
        const titulo = texto(avaliacao.titulo, 'Livro');
        const nome = texto(avaliacao.nm_usuario, 'Leitor');
        const card = elemento('article', 'cardResenhaAmigo');
        card.dataset.idAvaliacao = String(avaliacao.id_avaliacao);

        const linkCapa = linkLivro(codigoLivro, 'linkCapaResenha');
        linkCapa.setAttribute('aria-label', 'Ver livro: ' + titulo);
        const capa = elemento('img', 'capaResenha');
        capa.alt = 'Capa de ' + titulo;
        capa.loading = 'lazy';
        capa.addEventListener('error', () => {
            capa.replaceWith(elemento('span', 'capaResenha capaResenhaIndisponivel', 'Capa indisponível'));
        }, { once: true });
        capa.src = 'https://covers.openlibrary.org/b/isbn/' + codigoLivro + '-L.jpg';
        linkCapa.append(capa);

        const conteudo = elemento('div', 'conteudoResenha');
        const cabecalho = elemento('div', 'cabecalhoResenha');
        const tituloLivro = elemento('h3', 'tituloLivroResenha');
        const linkTitulo = linkLivro(codigoLivro);
        linkTitulo.textContent = titulo;
        tituloLivro.append(linkTitulo);
        cabecalho.append(tituloLivro);

        const autores = texto(avaliacao.nm_autor || avaliacao.autores);
        if (autores) cabecalho.append(elemento('span', 'autorLivroResenha', autores));

        const usuario = elemento('div', 'usuarioAvaliacao');
        const avatar = elemento('img', 'avatarUsuarioResenha');
        avatar.alt = 'Foto de perfil de ' + nome;
        avatar.loading = 'lazy';
        avatar.addEventListener('error', () => { avatar.src = '../img/avatar.jpg'; }, { once: true });
        const codigoAutor = texto(avaliacao.id_usuario);
        avatar.src = /^[1-9]\d*$/.test(codigoAutor)
            ? '../img/' + encodeURIComponent(codigoAutor) + '.png'
            : '../img/avatar.jpg';
        const linkAvatar = linkPerfil(codigoAutor, 'linkPerfilAvatar');
        linkAvatar.setAttribute('aria-label', 'Ver perfil de ' + nome);
        linkAvatar.append(avatar);
        const linkNome = linkPerfil(codigoAutor, 'handleUsuario linkPerfilUsuario');
        linkNome.textContent = nome;
        usuario.append(linkAvatar, linkNome, criarEstrelas(avaliacao.nota));

        conteudo.append(cabecalho, usuario, criarData(avaliacao.dt_avaliacao),
            elemento('p', 'textoResenha', texto(avaliacao.txt_resenha)));
        card.append(linkCapa, conteudo);
        return card;
    }

    function mostrarMais() {
        const proximaPagina = avaliacoes.slice(exibidas, exibidas + tamanhoPagina);
        const fragmento = document.createDocumentFragment();
        proximaPagina.forEach(avaliacao => fragmento.append(criarCard(avaliacao)));
        lista.append(fragmento);
        exibidas += proximaPagina.length;
        botaoMais.hidden = exibidas >= avaliacoes.length;
        estado.textContent = exibidas + ' de ' + avaliacoes.length + ' resenhas exibidas.';
    }

    lista.replaceChildren();
    botaoMais.hidden = true;
    if (!codigoUsuario || !/^[1-9]\d*$/.test(codigoUsuario)) {
        estado.textContent = 'Entre na sua conta para ver as resenhas de quem você segue.';
        return;
    }

    estado.textContent = 'Carregando resenhas de amigos...';
    lista.setAttribute('aria-busy', 'true');
    botaoMais.addEventListener('click', mostrarMais);

    fetch('../api/buscarFeed.php?codigoUsuario=' + encodeURIComponent(codigoUsuario), {
        headers: { Accept: 'application/json' }
    })
        .then(async resposta => {
            const resultado = await resposta.json();
            if (!resposta.ok || !(resultado.status === true || resultado.status === 'true') || !Array.isArray(resultado.resposta)) {
                throw new Error('Feed indisponível');
            }
            const ids = new Set();
            avaliacoes = resultado.resposta.filter(avaliacao => {
                if (!avaliacao || typeof avaliacao !== 'object' || Array.isArray(avaliacao)) return false;
                const id = texto(avaliacao.id_avaliacao);
                if (!/^[1-9]\d*$/.test(id) || !/^\d+$/.test(texto(avaliacao.id_livro)) || ids.has(id)) return false;
                ids.add(id);
                return true;
            });
            if (!avaliacoes.length) {
                estado.textContent = 'Ainda não há resenhas de quem você segue. Siga leitores para acompanhar suas leituras.';
                return;
            }
            mostrarMais();
        })
        .catch(() => {
            estado.textContent = 'Não foi possível carregar as resenhas de amigos. Atualize a página para tentar novamente.';
            botaoMais.hidden = true;
        })
        .finally(() => { lista.setAttribute('aria-busy', 'false'); });
})();
