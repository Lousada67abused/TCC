(() => {
    const principal = document.querySelector('.conteudoRanking');
    if (!principal) return;
    const buscar = seletor => principal.querySelector(seletor);
    const filtros = buscar('#filtrosGeneros');
    const seletor = buscar('#generoRanking');
    const estadoGeneros = buscar('#estadoGeneros');
    const repetirGeneros = buscar('#tentarGeneros');
    const titulo = buscar('#tituloRanking');
    const descricao = buscar('#descricaoRanking');
    const estado = buscar('#estadoRanking');
    const repetir = buscar('#tentarRanking');
    const podio = buscar('#podioRanking');
    const lista = buscar('#listaRanking');
    const formatoNota = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
    const formatoNumero = new Intl.NumberFormat('pt-BR');
    const generos = new Map([['0', 'Geral']]);
    let generoPedido = new URLSearchParams(location.search).get('genero') || '0';
    let generoAtual = null;
    let carregandoGeneros = false;
    let requisicao = null;
    let sequencia = 0;
    let falhaRanking = false;

    function elemento(tag, classe, texto) {
        const no = document.createElement(tag);
        if (classe) no.className = classe;
        if (texto !== undefined) no.textContent = String(texto);
        return no;
    }
    function naPaginaRanking() { return location.pathname.endsWith('/ranking.html'); }
    function enderecoGenero(codigo) {
        return 'ranking.html?' + new URLSearchParams({ genero: codigo });
    }
    function atualizarEndereco(codigo, adicionar) {
        // A resposta de uma API pode chegar enquanto o campo de busca está aberto.
        if (!naPaginaRanking()) return;
        const endereco = new URL(enderecoGenero(codigo), location.href);
        if (endereco.href === location.href) return;
        history[adicionar ? 'pushState' : 'replaceState'](null, '', endereco);
    }
    function notaValida(valor) {
        if (valor === null || valor === undefined || valor === '') return null;
        const nota = Number(valor);
        return Number.isFinite(nota) && nota >= 0 && nota <= 5 ? nota : null;
    }
    function linkLivro(livro, classe) {
        const link = elemento('a', classe);
        link.href = 'livro.html?' + new URLSearchParams({ codigoLivro: livro.id_livro });
        link.addEventListener('click', () => {
            try { sessionStorage.setItem('codigoLivro', String(livro.id_livro)); } catch (_) {}
        });
        return link;
    }
    function criarCapa(livro, classe, destaque = false) {
        const capa = elemento('img', classe);
        capa.src = 'https://covers.openlibrary.org/b/isbn/' + encodeURIComponent(livro.id_livro) + '-L.jpg';
        capa.alt = 'Capa de ' + livro.titulo;
        capa.loading = destaque ? 'eager' : 'lazy';
        capa.addEventListener('error', () => {
            const aviso = elemento('span', classe + ' capaRankingIndisponivel', 'Capa indisponível');
            aviso.setAttribute('role', 'img');
            aviso.setAttribute('aria-label', capa.alt);
            capa.replaceWith(aviso);
        }, { once: true });
        return capa;
    }
    function informacoesLivro(livro, classe) {
        const informacoes = elemento('div', classe);
        const nome = elemento('h2', 'tituloLivro', livro.titulo);
        nome.title = livro.titulo;
        const autor = elemento('p', 'autorLivro', livro.nm_autor || 'Autor não informado');
        autor.title = livro.nm_autor || '';
        informacoes.append(nome, autor);
        return informacoes;
    }
    function criarAvaliacao(livro, classe) {
        const avaliacao = elemento('div', classe);
        const linha = elemento('div', 'linhaNota');
        const estrela = elemento('span', 'estrelaRanking', '★');
        estrela.setAttribute('aria-hidden', 'true');
        const nota = notaValida(livro.nota_media);
        const valor = elemento('strong', 'notaMedia', nota === null ? 'Sem nota' : formatoNota.format(nota));
        valor.setAttribute('aria-label', nota === null ? 'Sem nota' : 'Nota média: ' + formatoNota.format(nota) + ' de 5');
        linha.append(estrela, valor);
        const quantidade = Math.max(0, Number(livro.quantidade_avaliacoes) || 0);
        avaliacao.append(linha, elemento('span', 'totalAvaliacoes', formatoNumero.format(quantidade) +
            (quantidade === 1 ? ' avaliação' : ' avaliações')));
        return avaliacao;
    }
    function criarDestaque(livro, indice) {
        const item = elemento('li', 'itemPodio posicao' + (indice + 1));
        item.dataset.idLivro = String(livro.id_livro);
        item.setAttribute('aria-label', (indice + 1) + 'º lugar');
        const link = linkLivro(livro, 'livroPodio');
        const informacoes = informacoesLivro(livro, 'detalhesPodio');
        informacoes.append(criarAvaliacao(livro, 'avaliacaoPodio'));
        link.append(criarCapa(livro, 'capaPodio', true), informacoes);
        item.append(link);
        return item;
    }
    function criarLivro(livro, indice) {
        const item = elemento('li', 'itemRanking');
        item.dataset.idLivro = String(livro.id_livro);
        const posicao = elemento('span', 'posicaoRanking', indice + 4);
        posicao.setAttribute('aria-label', 'Posição ' + (indice + 4));
        const link = linkLivro(livro, 'livroRanking');
        const informacoes = informacoesLivro(livro, 'informacoesLivro');
        informacoes.append(criarAvaliacao(livro, 'avaliacaoRanking'));
        const ano = String(livro.ano_publicacao || '').match(/^(\d{4})(?:-|$)/)?.[1];
        const metadados = [livro.nm_genero, ano].filter(valor => valor !== null && valor !== undefined && String(valor).trim());
        if (metadados.length) informacoes.append(elemento('p', 'generosLivro', metadados.join(' · ')));
        link.append(criarCapa(livro, 'capaRanking'), informacoes);
        item.append(posicao, link);
        return item;
    }
    async function carregarRanking() {
        if (!generoAtual) return;
        requisicao?.abort();
        requisicao = new AbortController();
        const atual = ++sequencia;
        const codigo = generoAtual;
        falhaRanking = false;
        repetir.hidden = true;
        estado.textContent = 'Carregando os livros mais bem avaliados...';
        podio.replaceChildren();
        lista.replaceChildren();
        podio.hidden = true;
        lista.hidden = true;
        podio.setAttribute('aria-busy', 'true');
        lista.setAttribute('aria-busy', 'true');
        try {
            const resposta = await fetch('../api/buscarRankingGenero.php?' + new URLSearchParams({ codigoGenero: codigo }), {
                headers: { Accept: 'application/json' }, signal: requisicao.signal
            });
            const resultado = await resposta.json();
            if (atual !== sequencia) return;
            if (!resposta.ok || !(resultado.status === true || resultado.status === 'true') || !Array.isArray(resultado.resposta)) {
                throw new Error('Ranking indisponível');
            }
            const unicos = new Map();
            resultado.resposta.forEach(livro => {
                if (livro && /^[1-9]\d*$/.test(String(livro.id_livro)) && typeof livro.titulo === 'string' && livro.titulo.trim()) {
                    if (!unicos.has(String(livro.id_livro))) unicos.set(String(livro.id_livro), livro);
                }
            });
            const livros = [...unicos.values()].slice(0, 10);
            podio.replaceChildren(...livros.slice(0, 3).map(criarDestaque));
            lista.replaceChildren(...livros.slice(3).map(criarLivro));
            podio.hidden = !livros.length;
            lista.hidden = livros.length <= 3;
            estado.textContent = livros.length ? '' : codigo === '0' ? 'Ainda não há livros avaliados para o ranking geral.' : 'Ainda não há livros avaliados neste gênero.';
        } catch (erro) {
            if (atual !== sequencia || erro.name === 'AbortError') return;
            falhaRanking = true;
            estado.textContent = 'Não foi possível carregar o ranking. Tente novamente.';
            repetir.hidden = false;
        } finally {
            if (atual === sequencia) {
                podio.setAttribute('aria-busy', 'false');
                lista.setAttribute('aria-busy', 'false');
            }
        }
    }
    function selecionarGenero(codigo, adicionar = false) {
        if (!generos.has(codigo)) codigo = '0';
        const mudou = codigo !== generoAtual;
        generoAtual = codigo;
        generoPedido = codigo;
        seletor.value = codigo;
        filtros.querySelectorAll('.filtroGenero').forEach(link => {
            const ativo = link.dataset.idGenero === codigo;
            link.classList.toggle('ativo', ativo);
            if (ativo) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });
        titulo.textContent = 'Ranking dos livros mais bem avaliados';
        descricao.textContent = 'Baseado nas avaliações da comunidade';
        podio.setAttribute('aria-label', 'Três primeiros colocados — ' + generos.get(codigo));
        lista.setAttribute('aria-label', 'A partir do quarto colocado — ' + generos.get(codigo));
        atualizarEndereco(codigo, adicionar);
        if (mudou || falhaRanking) carregarRanking();
    }
    function mostrarFiltros() {
        const focado = filtros.contains(document.activeElement) ? document.activeElement.dataset.idGenero : null;
        const links = [], opcoes = [];
        generos.forEach((nome, codigo) => {
            const link = elemento('a', 'filtroGenero', nome);
            link.href = enderecoGenero(codigo);
            link.dataset.idGenero = codigo;
            link.addEventListener('click', evento => {
                if (evento.button !== 0 || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
                evento.preventDefault();
                selecionarGenero(codigo, true);
            });
            links.push(link);
            const opcao = elemento('option', '', nome);
            opcao.value = codigo;
            opcoes.push(opcao);
        });
        filtros.replaceChildren(...links);
        seletor.replaceChildren(...opcoes);
        seletor.disabled = false;
        seletor.value = generoAtual || '0';
        links.forEach(link => {
            if (link.dataset.idGenero === generoAtual) {
                link.classList.add('ativo');
                link.setAttribute('aria-current', 'page');
            }
            if (link.dataset.idGenero === focado) link.focus({ preventScroll: true });
        });
    }
    async function carregarGeneros() {
        if (carregandoGeneros) return;
        carregandoGeneros = true;
        repetirGeneros.hidden = true;
        estadoGeneros.textContent = 'Carregando gêneros...';
        filtros.setAttribute('aria-busy', 'true');
        try {
            const resposta = await fetch('../api/buscarGenero.php', { headers: { Accept: 'application/json' } });
            const resultado = await resposta.json();
            if (!resposta.ok || !(resultado.status === true || resultado.status === 'true') || !Array.isArray(resultado.dados)) {
                throw new Error('Gêneros indisponíveis');
            }
            generos.clear();
            generos.set('0', 'Geral');
            resultado.dados.forEach(genero => {
                if (genero && /^[1-9]\d*$/.test(String(genero.id_genero)) && typeof genero.nm_genero === 'string' && genero.nm_genero.trim()) {
                    generos.set(String(genero.id_genero), genero.nm_genero);
                }
            });
            mostrarFiltros();
            estadoGeneros.textContent = generos.size > 1 ? '' : 'Nenhum gênero cadastrado no momento.';
            selecionarGenero(generoPedido);
        } catch (_) {
            estadoGeneros.textContent = 'Não foi possível carregar os gêneros.';
            if (!generoAtual) estado.textContent = 'Selecione Geral ou tente carregar os gêneros novamente.';
            repetirGeneros.hidden = false;
        } finally {
            carregandoGeneros = false;
            filtros.setAttribute('aria-busy', 'false');
        }
    }
    seletor.addEventListener('change', () => selecionarGenero(seletor.value, true));
    repetir.addEventListener('click', carregarRanking);
    repetirGeneros.addEventListener('click', carregarGeneros);
    window.addEventListener('popstate', () => {
        if (!naPaginaRanking()) return;
        generoPedido = new URLSearchParams(location.search).get('genero') || '0';
        if (carregandoGeneros && /^[1-9]\d*$/.test(generoPedido) && !generos.has(generoPedido)) return;
        selecionarGenero(generoPedido);
    });
    podio.hidden = true;
    lista.hidden = true;
    mostrarFiltros();
    if (generoPedido === '0' || !/^[1-9]\d*$/.test(generoPedido)) selecionarGenero('0');
    else estado.textContent = 'Carregando gêneros...';
    carregarGeneros();
})();
