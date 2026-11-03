(() => {
    const titulo = document.querySelector('.tituloBusca');
    const botoes = [...document.querySelectorAll('.filtros [data-filtro]')];
    const secaoLivros = document.querySelector('.resultadoLivros');
    const secaoLeitores = document.querySelector('.resultadoLeitores');
    const areaLivros = document.querySelector('.resultadoLivros .areaLivros');
    const listaLeitores = document.querySelector('.resultadoLeitores .listaLeitores');
    const estado = document.getElementById('estadoBusca');
    const tentar = document.getElementById('tentarBusca');
    if (!titulo || !areaLivros || !listaLeitores || !estado || !tentar) return;
    const filtros = new Set(['geral', 'livros', 'generos', 'autores', 'leitores']);
    let termo = '', filtro = 'geral';
    let livros = [], leitores = [], erros = {};
    let carregando = false, consulta = 0;

    function texto(valor, padrao = '') {
        return typeof valor === 'string' || typeof valor === 'number' ? String(valor) : padrao;
    }
    function normalizar(valor) {
        return texto(valor).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }
    function contem(valor) { return normalizar(valor).includes(normalizar(termo)); }
    function elemento(tag, classe, conteudo) {
        const novo = document.createElement(tag);
        novo.className = classe;
        if (conteudo !== undefined) novo.textContent = conteudo;
        return novo;
    }
    function criarLivro(livro) {
        console.log(livro)
        const id = String(livro.id_livro);
        const nome = texto(livro.titulo, 'Livro sem título');
        const autores = texto(livro.autores || livro.nm_autor, 'Autor não informado');
        const card = elemento('a', 'cardLivro');
        card.href = 'livro.html';
        card.dataset.idLivro = id;
        const selecionar = () => {
            try { sessionStorage.setItem('codigoLivro', id); } catch (_) {}
        };
        card.addEventListener('click', selecionar);
        card.addEventListener('auxclick', selecionar);
        const capa = elemento('img', 'capaLivro');
        capa.alt = 'Capa de ' + nome;
        capa.loading = 'lazy';
        capa.width = 200;
        capa.height = 300;
        capa.addEventListener('error', () => {
            capa.replaceWith(elemento('span', 'capaLivro capaLivroIndisponivel', 'Capa indisponível'));
        }, { once: true });
        capa.src = 'https://covers.openlibrary.org/b/isbn/' + id + '-L.jpg';
        const tituloLivro = elemento('h3', 'tituloLivro', nome);
        tituloLivro.title = nome;
        const autor = elemento('p', 'autorLivro', autores);
        autor.title = autores;
        const numero = Number(texto(livro.nota_media, '0').replace(',', '.'));
        const nota = Number.isFinite(numero) ? Math.min(5, Math.max(0, numero)) : 0;
        const estrelas = elemento('div', 'areaEstrelas');
        estrelas.setAttribute('role', 'img');
        estrelas.setAttribute('aria-label', 'Nota média: ' + nota.toFixed(1) + ' de 5');
        for (let i = 1; i <= 5; i++) {
            const estrela = elemento('span', 'estrelaAvaliacao ' + (i <= Math.round(nota) ? 'estrelaCheia' : 'estrelaVazia'), '★');
            estrela.setAttribute('aria-hidden', 'true');
            estrelas.append(estrela);
        }
        card.append(capa, tituloLivro, autor, estrelas);
        return card;
    }
    function atualizarCampos() {
        const dicas = { geral: 'Busque por livros e leitores', livros: 'Busque por título ou ISBN',
            generos: 'Busque por gêneros', autores: 'Busque por autores', leitores: 'Busque por leitores' };
        document.querySelectorAll('form.barraPesquisa [name="termo"], form.pesquisaMobile [name="termo"]').forEach(campo => {
            campo.value = termo;
            if (campo.id === 'txtPesquisaBusca') {
                campo.placeholder = dicas[filtro];
                campo.setAttribute('aria-label', dicas[filtro]);
            }
        });
        document.querySelectorAll('form.barraPesquisa [name="filtro"], form.pesquisaMobile [name="filtro"]').forEach(campo => { campo.value = filtro; });
        botoes.forEach(botao => {
            const ativo = botao.dataset.filtro === filtro;
            botao.classList.toggle('ativo', ativo);
            botao.setAttribute('aria-pressed', String(ativo));
        });
        titulo.textContent = termo ? 'Exibindo resultados para “' + termo + '”' : 'Encontre sua próxima leitura';
    }
    function mostrarResultados() {
        atualizarCampos();
        let selecionados = livros;
        if (filtro === 'livros') selecionados = livros.filter(livro => contem(livro.titulo) || String(livro.id_livro) === termo);
        if (filtro === 'generos') selecionados = livros.filter(livro => contem(livro.generos || livro.nm_genero));
        if (filtro === 'autores') selecionados = livros.filter(livro => contem(livro.autores || livro.nm_autor));
        const mostrarLivros = filtro !== 'leitores';
        const mostrarLeitores = filtro === 'geral' || filtro === 'leitores';
        areaLivros.replaceChildren(...(mostrarLivros ? selecionados.map(criarLivro) : []));
        listaLeitores.replaceChildren(...(mostrarLeitores ? leitores.map(window.criarCardLeitor) : []));
        secaoLivros.hidden = !mostrarLivros || !selecionados.length;
        secaoLeitores.hidden = !mostrarLeitores || !leitores.length;
        document.querySelectorAll('.subtituloBusca').forEach(subtitulo => { subtitulo.hidden = filtro !== 'geral'; });
        tentar.hidden = true;
        if (!termo) estado.textContent = 'Digite um termo na busca ou explore os gêneros literários.';
        else if (carregando) estado.textContent = 'Buscando resultados...';
        else {
            const falhas = [];
            if (mostrarLivros && erros.livros) falhas.push('Não foi possível carregar os livros.');
            if (mostrarLeitores && erros.leitores) falhas.push('Não foi possível carregar os leitores.');
            if (falhas.length) {
                estado.textContent = falhas.join(' ') + ' Tente novamente.';
                tentar.hidden = false;
            } else estado.textContent = (mostrarLivros && selecionados.length) || (mostrarLeitores && leitores.length)
                ? '' : 'Nenhum resultado encontrado para “' + termo + '”.';
        }
        tentar.disabled = carregando;
        areaLivros.setAttribute('aria-busy', String(carregando));
        listaLeitores.setAttribute('aria-busy', String(carregando));
    }
    async function buscar(url) {
        const resposta = await fetch(url, { headers: { Accept: 'application/json' } });
        const resultado = await resposta.json();
        if (!resposta.ok || !(resultado.status === true || resultado.status === 'true') || !Array.isArray(resultado.resposta)) {
            throw new Error('Pesquisa indisponível');
        }
        return resultado.resposta;
    }
    function unicos(dados, chave) {
        const mapa = new Map();
        dados.forEach(item => {
            if (item && /^[1-9]\d*$/.test(String(item[chave])) && !mapa.has(String(item[chave]))) mapa.set(String(item[chave]), item);
        });
        return [...mapa.values()];
    }
    async function pesquisar() {
        const atual = ++consulta;
        livros = [];
        leitores = [];
        erros = {};
        carregando = Boolean(termo);
        mostrarResultados();
        if (!termo) return;
        const query = encodeURIComponent(termo);
        // A consulta de seguidos atualiza os botões sem atrasar os livros.
        window.Leitores.preparar();
        const resultados = await Promise.allSettled([
            buscar('../api/filtrarlivro.php?filtro=' + query),
            buscar('../api/buscarUsuarioNome.php?nome=' + query)
        ]);
        if (atual !== consulta) return;
        if (resultados[0].status === 'fulfilled') livros = unicos(resultados[0].value, 'id_livro');
        else erros.livros = true;
        if (resultados[1].status === 'fulfilled') leitores = unicos(resultados[1].value, 'id_usuario');
        else erros.leitores = true;
        carregando = false;
        mostrarResultados();
    }
    function lerEndereco() {
        const parametros = new URLSearchParams(location.search);
        termo = (parametros.get('termo') || '').trim().slice(0, 100);
        filtro = filtros.has(parametros.get('filtro')) ? parametros.get('filtro') : 'geral';
    }
    botoes.forEach(botao => botao.addEventListener('click', () => {
        const novoFiltro = botao.dataset.filtro;
        if (!filtros.has(novoFiltro) || filtro === novoFiltro) return;
        filtro = novoFiltro;
        const endereco = new URL(location.href);
        endereco.searchParams.set('termo', termo);
        endereco.searchParams.set('filtro', filtro);
        history.pushState(null, '', endereco);
        mostrarResultados();
    }));
    window.addEventListener('popstate', () => {
        const anterior = termo;
        lerEndereco();
        if (termo !== anterior) pesquisar();
        else mostrarResultados();
    });
    tentar.addEventListener('click', pesquisar);
    lerEndereco();
    pesquisar();
})();
