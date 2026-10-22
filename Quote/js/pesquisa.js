(() => {
    function criarGenero(genero) {
        const nome = genero.nm_genero;
        const link = document.createElement('a');
        link.className = 'cardGenero';
        link.dataset.idGenero = String(genero.id_genero);
        link.href = 'busca.html?' + new URLSearchParams({ termo: nome, filtro: 'generos' });
        link.title = nome;
        const rotulo = document.createElement('span');
        rotulo.className = 'nomeGenero';
        rotulo.textContent = nome;
        link.append(rotulo);
        return link;
    }

    async function iniciar(raiz = document) {
        const formulario = raiz.querySelector('.pesquisaMobile');
        const campo = formulario?.querySelector('[name="termo"]');
        const filtro = formulario?.querySelector('[name="filtro"]');
        if (formulario && campo && filtro && formulario.dataset.pesquisaInicializada !== 'true') {
            formulario.dataset.pesquisaInicializada = 'true';
            const categoria = new URLSearchParams(location.search).get('filtro');
            if ([...filtro.options].some(opcao => opcao.value === categoria)) filtro.value = categoria;
            const dicas = { livros: 'Busque por título ou ISBN', generos: 'Busque por gêneros',
                autores: 'Busque por autores', leitores: 'Busque por leitores' };
            function atualizarDica() {
                campo.placeholder = dicas[filtro.value] || dicas.livros;
                campo.setAttribute('aria-label', campo.placeholder);
            }
            filtro.addEventListener('change', atualizarDica);
            formulario.addEventListener('submit', evento => {
                campo.value = campo.value.trim();
                if (!campo.value) { evento.preventDefault(); campo.focus(); }
            });
            atualizarDica();
        }

        const lista = raiz.querySelector('#listaGeneros');
        const estado = raiz.querySelector('#estadoGeneros');
        const tentar = raiz.querySelector('#tentarGeneros');
        if (!lista || !estado || !tentar) return false;
        if (lista.dataset.pesquisaInicializada === 'true') return true;
        lista.dataset.pesquisaInicializada = 'true';
        let carregando = false;

        async function carregarGeneros() {
            if (carregando) return false;
            carregando = true;
            lista.setAttribute('aria-busy', 'true');
            tentar.hidden = true;
            estado.textContent = 'Carregando gêneros...';
            try {
                const resposta = await fetch('../api/buscarGenero.php', { headers: { Accept: 'application/json' } });
                const resultado = await resposta.json();
                if (!resposta.ok || !(resultado.status === true || resultado.status === 'true') || !Array.isArray(resultado.dados)) {
                    throw new Error('Gêneros indisponíveis');
                }
                const generos = new Map();
                resultado.dados.forEach(genero => {
                    if (genero && /^[1-9]\d*$/.test(String(genero.id_genero)) && typeof genero.nm_genero === 'string' && genero.nm_genero.trim()) {
                        generos.set(String(genero.id_genero), genero);
                    }
                });
                lista.replaceChildren(...[...generos.values()].map(criarGenero));
                estado.textContent = generos.size ? '' : 'Não há gêneros cadastrados no momento.';
                return true;
            } catch (_) {
                lista.replaceChildren();
                estado.textContent = 'Não foi possível carregar os gêneros. Tente novamente.';
                tentar.hidden = false;
                return false;
            } finally {
                carregando = false;
                lista.setAttribute('aria-busy', 'false');
            }
        }
        tentar.addEventListener('click', carregarGeneros);
        return carregarGeneros();
    }

    window.Pesquisa = Object.freeze({ iniciar });
    if (document.body.classList.contains('paginaPesquisa')) iniciar();
})();
