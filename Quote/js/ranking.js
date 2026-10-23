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
    const lista = buscar('#listaRanking');
    const formatoNota = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formatoNumero = new Intl.NumberFormat('pt-BR');
    const generos = new Map();
    let generoPedido = new URLSearchParams(location.search).get('genero');
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
    function criarLivro(livro, indice) {
        const item = elemento('li', 'itemRanking');
        item.dataset.idLivro = String(livro.id_livro);
        const posicao = elemento('span', 'posicaoRanking', indice + 1);
        posicao.setAttribute('aria-label', 'Posição ' + (indice + 1));
        const link = elemento('a', 'livroRanking');
        link.href = 'livro.html?' + new URLSearchParams({ codigoLivro: livro.id_livro });
        link.addEventListener('click', () => {
            try { sessionStorage.setItem('codigoLivro', String(livro.id_livro)); } catch (_) {}
        });
        const capa = elemento('img', 'capaRanking');
        capa.src = 'https://covers.openlibrary.org/b/isbn/' + encodeURIComponent(livro.id_livro) + '-L.jpg';
        capa.alt = 'Capa de ' + livro.titulo;
        capa.loading = 'lazy';
        capa.addEventListener('error', () => {
            const aviso = elemento('span', 'capaRanking capaRankingIndisponivel', 'Capa indisponível');
            aviso.setAttribute('role', 'img');
            aviso.setAttribute('aria-label', capa.alt);
            capa.replaceWith(aviso);
        }, { once: true });
        const informacoes = elemento('div', 'informacoesLivro');
        const nome = elemento('h2', 'tituloLivro', livro.titulo);
        nome.title = livro.titulo;
        const autor = elemento('p', 'autorLivro', livro.nm_autor || 'Autor não informado');
        autor.title = livro.nm_autor || '';
        informacoes.append(nome, autor);
        if (livro.nm_genero) informacoes.append(elemento('p', 'generosLivro', livro.nm_genero));
        link.append(capa, informacoes);
        const avaliacao = elemento('div', 'avaliacaoRanking');
        const linha = elemento('div', 'linhaNota');
        const estrela = elemento('span', 'estrelaRanking', '★');
        estrela.setAttribute('aria-hidden', 'true');
        const nota = notaValida(livro.nota_media);
        linha.append(estrela, elemento('strong', 'notaMedia', nota === null ? 'Sem nota' : formatoNota.format(nota) + ' / 5'));
        const quantidade = Math.max(0, Number(livro.quantidade_avaliacoes) || 0);
        avaliacao.append(linha, elemento('span', 'totalAvaliacoes', formatoNumero.format(quantidade) +
            (quantidade === 1 ? ' avaliação' : ' avaliações')));
        item.append(posicao, link, avaliacao);
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
        lista.replaceChildren();
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
            lista.replaceChildren(...livros.map(criarLivro));
            estado.textContent = livros.length ? '' : 'Ainda não há livros avaliados neste gênero.';
            descricao.textContent = livros.length ? (livros.length === 1 ? '1 livro avaliado' : livros.length + ' livros avaliados') +
                ' · Ordenados por nota média e quantidade de avaliações.' : 'Os livros aparecerão aqui quando receberem avaliações.';
        } catch (erro) {
            if (atual !== sequencia || erro.name === 'AbortError') return;
            falhaRanking = true;
            estado.textContent = 'Não foi possível carregar o ranking. Tente novamente.';
            repetir.hidden = false;
        } finally {
            if (atual === sequencia) lista.setAttribute('aria-busy', 'false');
        }
    }
    function selecionarGenero(codigo, adicionar = false) {
        if (!generos.has(codigo)) codigo = generos.keys().next().value;
        if (!codigo) return;
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
        titulo.textContent = 'Mais bem avaliados em ' + generos.get(codigo);
        atualizarEndereco(codigo, adicionar);
        if (mudou) descricao.textContent = 'Até 10 livros por gênero, com avaliações da comunidade.';
        if (mudou || falhaRanking) carregarRanking();
    }
    async function carregarGeneros() {
        if (carregandoGeneros) return;
        carregandoGeneros = true;
        seletor.disabled = true;
        repetirGeneros.hidden = true;
        estadoGeneros.textContent = 'Carregando gêneros...';
        estado.textContent = 'Aguarde a lista de gêneros.';
        filtros.setAttribute('aria-busy', 'true');
        try {
            const resposta = await fetch('../api/buscarGenero.php', { headers: { Accept: 'application/json' } });
            const resultado = await resposta.json();
            if (!resposta.ok || !(resultado.status === true || resultado.status === 'true') || !Array.isArray(resultado.dados)) {
                throw new Error('Gêneros indisponíveis');
            }
            generos.clear();
            resultado.dados.forEach(genero => {
                if (genero && /^[1-9]\d*$/.test(String(genero.id_genero)) && typeof genero.nm_genero === 'string' && genero.nm_genero.trim()) {
                    generos.set(String(genero.id_genero), genero.nm_genero);
                }
            });
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
            estadoGeneros.textContent = generos.size ? '' : 'Nenhum gênero cadastrado no momento.';
            if (generos.size) {
                seletor.disabled = false;
                selecionarGenero(generoPedido);
            } else {
                estado.textContent = 'Não há gêneros disponíveis para exibir o ranking.';
                descricao.textContent = '';
            }
        } catch (_) {
            estadoGeneros.textContent = 'Não foi possível carregar os gêneros.';
            estado.textContent = 'Tente carregar os gêneros novamente para ver os livros.';
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
        generoPedido = new URLSearchParams(location.search).get('genero');
        if (generos.size) selecionarGenero(generoPedido);
    });
    carregarGeneros();
})();
