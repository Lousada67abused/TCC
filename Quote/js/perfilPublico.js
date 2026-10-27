(() => {
    const main = document.querySelector('main');
    const estado = document.getElementById('estadoPerfilPublico');
    const repetir = document.getElementById('tentarPerfilPublico');
    const seguir = document.getElementById('seguirPerfil');
    const mensagemSeguir = document.getElementById('estadoSeguirPerfil');
    if (!main || !estado || !repetir || !seguir || !mensagemSeguir) return;
    const codigo = new URLSearchParams(location.search).get('codigoUsuario');
    let codigoSessao = null;
    try { codigoSessao = sessionStorage.getItem('codigo'); } catch (_) {}
    const numero = new Intl.NumberFormat('pt-BR');
    let dados = null;
    let pendente = false;
    let confirmado = false;
    let filtro = 'todos';
    let temporizador;
    const buscar = seletor => main.querySelector(seletor);
    const abas = [...main.querySelectorAll('[role="tab"]')];
    const paineis = [...main.querySelectorAll('[role="tabpanel"]')];

    function elemento(tag, classe, texto) {
        const no = document.createElement(tag);
        if (classe) no.className = classe;
        if (texto !== undefined) no.textContent = String(texto);
        return no;
    }
    function contagem(valor) { return numero.format(Math.max(0, Number(valor) || 0)); }
    function mensagem(texto, sucesso = false) {
        clearTimeout(temporizador);
        mensagemSeguir.textContent = texto;
        mensagemSeguir.hidden = !texto;
        mensagemSeguir.classList.toggle('sucesso', sucesso);
        mensagemSeguir.classList.toggle('erro', Boolean(texto) && !sucesso);
        if (sucesso) temporizador = setTimeout(() => mensagem(''), 2000);
    }
    function abrirAba(nome) {
        if (!paineis.some(painel => painel.id === nome)) nome = 'principal';
        abas.forEach(aba => {
            const ativa = aba.dataset.aba === nome;
            aba.classList.toggle('ativo', ativa);
            aba.setAttribute('aria-selected', String(ativa));
            aba.tabIndex = ativa ? 0 : -1;
        });
        paineis.forEach(painel => {
            painel.hidden = painel.id !== nome;
            painel.classList.toggle('escondido', painel.hidden);
        });
    }
    abas.forEach((aba, indice) => {
        aba.addEventListener('click', () => {
            history.pushState(null, '', '#' + aba.dataset.aba);
            abrirAba(aba.dataset.aba);
        });
        aba.addEventListener('keydown', evento => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(evento.key)) return;
            evento.preventDefault();
            const alvo = evento.key === 'Home' ? 0 : evento.key === 'End' ? abas.length - 1 :
                (indice + (evento.key === 'ArrowRight' ? 1 : -1) + abas.length) % abas.length;
            abas[alvo].focus();
            abas[alvo].click();
        });
    });
    window.addEventListener('hashchange', () => abrirAba(location.hash.slice(1)));
    window.addEventListener('popstate', () => abrirAba(location.hash.slice(1)));
    abrirAba(location.hash.slice(1));

    function livro(item) {
        const link = elemento('a', 'livro');
        link.href = 'livro.html?codigoLivro=' + encodeURIComponent(item.id_livro);
        const capa = elemento('img');
        capa.alt = 'Capa de ' + item.titulo;
        capa.loading = 'lazy';
        capa.addEventListener('error', () => capa.replaceWith(elemento('span', 'capaIndisponivel', 'Capa indisponível')), { once: true });
        capa.src = 'https://covers.openlibrary.org/b/isbn/' + encodeURIComponent(item.id_livro) + '-L.jpg';
        const texto = elemento('div', 'textoLivro');
        texto.append(elemento('h3', '', item.titulo), elemento('p', '', item.autores || 'Autor não informado'));
        link.append(capa, texto);
        return link;
    }
    function resenha(item) {
        const card = elemento('article', 'resenha');
        const conteudo = elemento('div', 'conteudoResenhaPublica');
        const estrelas = elemento('span', 'notaPublica');
        const nota = Math.min(5, Math.max(0, Number(item.nota) || 0));
        estrelas.setAttribute('role', 'img');
        estrelas.setAttribute('aria-label', 'Avaliação: ' + nota + ' de 5 estrelas');
        for (let i = 1; i <= 5; i++) {
            const estrela = elemento('span', i > nota ? 'vazia' : '', '★');
            estrela.setAttribute('aria-hidden', 'true');
            estrelas.append(estrela);
        }
        const data = elemento('time', 'dataResenhaPublica');
        const iso = String(item.dt_avaliacao || '').slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
            data.dateTime = iso;
            data.textContent = iso.split('-').reverse().join('/');
        }
        conteudo.append(estrelas, data, elemento('p', '', item.txt_resenha || 'Avaliação sem resenha.'));
        card.append(livro(item), conteudo);
        return card;
    }
    function lista(seletor, estadoSeletor, itens, criar, vazio) {
        buscar(seletor).replaceChildren(...itens.map(criar));
        buscar(estadoSeletor).textContent = itens.length ? '' : vazio;
    }
    function mostrarEstante() {
        if (!dados) return;
        const livros = dados.biblioteca.filter(item => filtro === 'todos' ||
            (filtro === 'favoritos' ? Number(item.favorito) === 1 : item.status === filtro));
        lista('#estantePublica', '#estadoEstantePublica', livros, livro, 'Nenhum livro público nesta categoria.');
    }
    main.querySelectorAll('[data-status]').forEach(botao => botao.addEventListener('click', () => {
        filtro = botao.dataset.status;
        main.querySelectorAll('[data-status]').forEach(outro => {
            outro.classList.toggle('ativo', outro === botao);
            outro.setAttribute('aria-pressed', String(outro === botao));
        });
        mostrarEstante();
    }));
    function mostrarSeguimento() {
        if (!dados) return;
        const seguindo = dados.seguindo === true;
        seguir.hidden = !dados.autenticado;
        buscar('#entrarParaSeguir').hidden = dados.autenticado;
        seguir.disabled = pendente || !confirmado;
        seguir.textContent = seguindo ? 'Deixar de seguir' : 'Seguir';
        seguir.classList.toggle('seguindo', seguindo);
        seguir.setAttribute('aria-pressed', String(seguindo));
        seguir.setAttribute('aria-label', (seguindo ? 'Deixar de seguir ' : 'Seguir ') + dados.usuario.nm_usuario);
        seguir.setAttribute('aria-busy', String(pendente));
        buscar('#seguidoresPerfilPublico').textContent = contagem(dados.usuario.qtd_seguidores);
    }
    function mostrar() {
        const usuario = dados.usuario;
        document.title = usuario.nm_usuario + ' - Quote';
        buscar('#nomePerfilPublico').textContent = usuario.nm_usuario;
        buscar('#bioPerfilPublico').textContent = usuario.bio || 'Este leitor ainda não tem uma biografia.';
        const foto = buscar('#fotoPerfilPublico');
        foto.alt = 'Foto de perfil de ' + usuario.nm_usuario;
        foto.onerror = () => { foto.onerror = null; foto.src = '../img/avatar.jpg'; };
        foto.src = '../img/' + encodeURIComponent(usuario.id_usuario) + '.png';
        buscar('#lidosPerfilPublico').textContent = contagem(usuario.qtd_lidos);
        buscar('#seguindoPerfilPublico').textContent = contagem(usuario.qtd_seguindo);
        dados.biblioteca = dados.biblioteca.filter(item => Number(item.visivel) === 1);
        lista('#favoritosPublicos', '#estadoFavoritosPublicos', dados.biblioteca.filter(item => Number(item.favorito) === 1).slice(0, 5), livro, 'Este leitor ainda não tem favoritos públicos.');
        lista('#resenhasRecentesPublicas', '#estadoResenhasRecentesPublicas', dados.avaliacoes.slice(0, 2), resenha, 'Este leitor ainda não publicou resenhas.');
        lista('#resenhasPublicas', '#estadoResenhasPublicas', dados.avaliacoes, resenha, 'Este leitor ainda não publicou resenhas.');
        mostrarEstante();
        mostrarSeguimento();
        buscar('#informacoesPerfilPublico').hidden = false;
        buscar('#secoesPerfilPublico').hidden = false;
    }
    async function obter() {
        let resposta, resultado;
        try {
            resposta = await fetch('../api/buscarPerfilPublico.php?codigoUsuario=' + encodeURIComponent(codigo), { headers: { Accept: 'application/json' } });
            resultado = await resposta.json();
        } catch (_) {
            throw new Error('Não foi possível carregar este perfil. Tente novamente.');
        }
        const perfil = resultado.resposta;
        if (!resposta.ok || resultado.status !== true || !perfil?.usuario ||
            String(perfil.usuario.id_usuario) !== codigo || !Array.isArray(perfil.biblioteca) || !Array.isArray(perfil.avaliacoes)) {
            const erro = new Error(resultado.mensagem || 'Não foi possível carregar este perfil.');
            erro.status = resposta.status;
            throw erro;
        }
        const autenticado = perfil.autenticado === true && String(perfil.codigoUsuarioLogado) === codigoSessao;
        return { ...perfil, autenticado, proprioPerfil: autenticado && perfil.proprioPerfil === true };
    }
    async function carregar() {
        if (pendente) return;
        pendente = true;
        confirmado = false;
        main.setAttribute('aria-busy', 'true');
        estado.textContent = 'Carregando perfil...';
        repetir.hidden = true;
        mostrarSeguimento();
        try {
            dados = await obter();
            confirmado = true;
            if (dados.proprioPerfil) {
                location.replace('perfil.html' + location.hash);
                return;
            }
            mostrar();
            estado.textContent = '';
        } catch (erro) {
            dados = null;
            buscar('#informacoesPerfilPublico').hidden = true;
            buscar('#secoesPerfilPublico').hidden = true;
            estado.textContent = erro.message;
            repetir.hidden = erro.status === 404;
        } finally {
            pendente = false;
            main.setAttribute('aria-busy', 'false');
            mostrarSeguimento();
        }
    }
    seguir.addEventListener('click', async () => {
        if (pendente || !confirmado || !dados?.autenticado || dados.proprioPerfil) return;
        const novoEstado = !dados.seguindo;
        pendente = true;
        mensagem('');
        mostrarSeguimento();
        try {
            const resposta = await fetch('../api/' + (novoEstado ? 'seguirUsuario.php' : 'deixarDeSeguir.php'), {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigoSeguidor: codigoSessao, codigoSeguido: codigo })
            });
            const resultado = await resposta.json();
            if (!resposta.ok || resultado.status !== true || typeof resultado.resposta?.seguindo !== 'boolean') {
                throw new Error(resultado.mensagem || 'Não foi possível atualizar o acompanhamento.');
            }
            dados.seguindo = resultado.resposta.seguindo;
            dados.usuario.qtd_seguidores = resultado.resposta.qtd_seguidores;
            mensagem(dados.seguindo ? 'Agora você segue este leitor.' : 'Você deixou de seguir este leitor.', true);
        } catch (erro) {
            // Uma resposta perdida pode ter confirmado a ação no servidor.
            try {
                dados = await obter();
                confirmado = true;
            } catch (_) {
                confirmado = false;
                repetir.hidden = false;
            }
            const texto = erro instanceof TypeError || erro instanceof SyntaxError ? 'Não foi possível atualizar o acompanhamento.' : erro.message;
            mensagem(texto + ' Confira o estado atual e tente novamente.');
        } finally {
            pendente = false;
            mostrarSeguimento();
        }
    });
    repetir.addEventListener('click', carregar);
    if (!/^[1-9]\d{0,9}$/.test(codigo || '') || Number(codigo) > 2147483647) {
        main.setAttribute('aria-busy', 'false');
        estado.textContent = 'Selecione um leitor válido para ver o perfil.';
        return;
    }
    carregar();
})();
