(() => {
    const formulario = document.querySelector('.paginaPesquisa .pesquisaMobile');
    const campo = document.getElementById('txtPesquisaBusca');
    const filtro = document.getElementById('filtroPesquisaInicial');
    if (!formulario || !campo || !filtro) return;
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

    const lista = document.getElementById('listaGeneros');
    const estado = document.getElementById('estadoGeneros');
    const tentar = document.getElementById('tentarGeneros');
    if (!lista || !estado || !tentar) return;
    // Este mapa escolhe a arte; a lista de gêneros vem exclusivamente da API.
    const imagens = {
        romance: 'generoRomance.png', suspense: 'generoSuspense.png', fantasia: 'generoFantasia.png',
        biografia: 'generoBiografia.png', ficcaohistorica: 'generoFiccaoHistorica.png',
        ficcaocientifica: 'generoFiccaoCientifica.png', poesia: 'generoPoesia.png', terror: 'generoTerror.png',
        aventura: 'generoAventura.png', autoajuda: 'generoAutoAjuda.png', filosofia: 'generoFilosofia.png', drama: 'generoDrama.png'
    };
    let carregando = false;
    function criarGenero(genero) {
        const nome = genero.nm_genero;
        const chave = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');
        const link = document.createElement('a');
        link.className = 'cardGenero';
        link.dataset.idGenero = String(genero.id_genero);
        link.href = 'busca.html?' + new URLSearchParams({ termo: nome, filtro: 'generos' });
        link.title = nome;
        const rotulo = document.createElement('span');
        rotulo.className = 'nomeGenero';
        rotulo.textContent = nome;
        if (imagens[chave]) {
            const imagem = document.createElement('img');
            imagem.alt = '';
            imagem.loading = 'lazy';
            imagem.width = 256;
            imagem.height = 69;
            imagem.addEventListener('error', () => {
                imagem.remove();
                rotulo.classList.remove('somenteLeitura');
            }, { once: true });
            imagem.src = '../img/' + imagens[chave];
            rotulo.classList.add('somenteLeitura');
            link.append(imagem);
        }
        link.append(rotulo);
        return link;
    }
    async function carregarGeneros() {
        if (carregando) return;
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
        } catch (_) {
            lista.replaceChildren();
            estado.textContent = 'Não foi possível carregar os gêneros. Tente novamente.';
            tentar.hidden = false;
        } finally {
            carregando = false;
            lista.setAttribute('aria-busy', 'false');
        }
    }
    tentar.addEventListener('click', carregarGeneros);
    carregarGeneros();
})();
