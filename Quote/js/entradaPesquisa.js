(() => {
    if (document.body.matches('.paginaPesquisa, .paginaBusca') || !window.Pesquisa) return;
    const cabecalho = document.querySelector('header');
    let formulario = cabecalho?.querySelector('.barraPesquisa');
    const campo = formulario?.querySelector('input');
    if (!campo || !document.querySelector('main')) return;

    // As barras antigas também passam a enviar a pesquisa por Enter ou lupa.
    if (formulario.tagName !== 'FORM') {
        const novo = document.createElement('form');
        novo.className = formulario.className;
        novo.append(...formulario.childNodes);
        formulario.replaceWith(novo);
        formulario = novo;
    }
    formulario.action = 'busca.html';
    formulario.method = 'get';
    formulario.setAttribute('role', 'search');
    campo.name = 'termo';
    campo.type = 'search';
    campo.maxLength = 100;
    campo.required = true;
    if (!campo.hasAttribute('aria-label')) campo.setAttribute('aria-label', 'Pesquisar livros e leitores');
    let botao = formulario.querySelector('button[type="submit"]');
    if (!botao) {
        botao = document.createElement('button');
        botao.type = 'submit';
        botao.setAttribute('aria-label', 'Pesquisar');
        const icone = formulario.querySelector('.material-symbols-outlined');
        if (icone) botao.append(icone);
        else botao.textContent = 'Pesquisar';
        formulario.append(botao);
    }
    let filtro = formulario.querySelector('input[name="filtro"]');
    if (!filtro) {
        filtro = document.createElement('input');
        filtro.type = 'hidden';
        filtro.name = 'filtro';
        filtro.value = 'geral';
        formulario.append(filtro);
    }

    const desktop = window.matchMedia('(min-width: 768px)');
    const placeholder = campo.placeholder;
    const filtroDesabilitado = filtro.disabled;
    let modelo = null, estilo = null, preparandoEstilo = null;
    let original = null, tela = null, navegacao = null, seletor = null;
    let aberta = false, carregando = false;
    let categoriaMobile = 'livros';

    async function carregarModelo() {
        if (modelo) return modelo;
        const resposta = await fetch('pesquisa.html', { headers: { Accept: 'text/html' } });
        if (!resposta.ok) throw new Error('Pesquisa indisponível');
        const documento = new DOMParser().parseFromString(await resposta.text(), 'text/html');
        const principal = documento.querySelector('main.conteudoPesquisa');
        if (!principal || !principal.querySelector('#listaGeneros')) throw new Error('Página de pesquisa inválida');
        principal.querySelector('.pesquisaMobile')?.remove();
        modelo = { principal, navegacao: documento.querySelector('.navegacaoMobile'), titulo: documento.title };
        return modelo;
    }
    function carregarEstilo() {
        if (preparandoEstilo) return preparandoEstilo;
        preparandoEstilo = new Promise((resolve, reject) => {
            estilo = document.createElement('link');
            estilo.rel = 'stylesheet';
            estilo.href = '../css/pesquisa.css';
            estilo.media = 'not all';
            estilo.addEventListener('load', resolve, { once: true });
            estilo.addEventListener('error', () => {
                estilo.remove();
                estilo = null;
                preparandoEstilo = null;
                reject(new Error('Estilo da pesquisa indisponível'));
            }, { once: true });
            document.head.append(estilo);
        });
        return preparandoEstilo;
    }
    function atualizarEndereco() {
        if (!aberta) return;
        const endereco = new URL('pesquisa.html', location.href);
        if (campo.value) endereco.searchParams.set('termo', campo.value.slice(0, 100));
        endereco.searchParams.set('filtro', desktop.matches ? filtro.value : seletor.value);
        history.replaceState({ pesquisaEmEdicao: true }, '', endereco);
    }
    function atualizarSeletor() {
        if (!aberta) return;
        seletor.disabled = desktop.matches;
        filtro.disabled = !desktop.matches;
        const dicas = { livros: 'Busque por título ou ISBN', generos: 'Busque por gêneros',
            autores: 'Busque por autores', leitores: 'Busque por leitores' };
        campo.placeholder = desktop.matches ? placeholder : dicas[seletor.value];
        atualizarEndereco();
    }
    function mostrarPesquisa() {
        if (aberta || !modelo || !estilo) return;
        original = {
            principal: document.querySelector('main'),
            navegacao: document.querySelector('body > nav'),
            classe: document.body.className,
            classeCabecalho: cabecalho.className,
            titulo: document.title
        };
        tela = modelo.principal.cloneNode(true);
        navegacao = modelo.navegacao?.cloneNode(true) || null;
        original.principal.replaceWith(tela);
        if (navegacao) {
            if (original.navegacao) original.navegacao.replaceWith(navegacao);
            else document.body.append(navegacao);
        }
        document.body.classList.add('paginaPesquisa', 'pesquisaEmEdicao');
        cabecalho.classList.add('cabecalhoPrincipal');
        document.title = modelo.titulo;
        estilo.media = 'all';
        seletor = document.createElement('select');
        seletor.name = 'filtro';
        seletor.className = 'filtroPesquisaAtiva';
        seletor.setAttribute('aria-label', 'Pesquisar por');
        [['livros', 'livros'], ['generos', 'gêneros'], ['autores', 'autores'], ['leitores', 'leitores']].forEach(([valor, nome]) => {
            const opcao = document.createElement('option');
            opcao.value = valor;
            opcao.textContent = nome;
            seletor.append(opcao);
        });
        const categoriaEndereco = new URLSearchParams(location.search).get('filtro');
        if ([...seletor.options].some(opcao => opcao.value === categoriaEndereco)) categoriaMobile = categoriaEndereco;
        seletor.value = categoriaMobile;
        seletor.addEventListener('change', () => {
            categoriaMobile = seletor.value;
            atualizarSeletor();
        });
        formulario.append(seletor);
        aberta = true;
        atualizarSeletor();
        window.Pesquisa.iniciar(tela);
    }
    function fecharPesquisa() {
        if (!aberta) return;
        aberta = false;
        tela.replaceWith(original.principal);
        if (original.navegacao && navegacao) navegacao.replaceWith(original.navegacao);
        else navegacao?.remove();
        document.body.className = original.classe;
        cabecalho.className = original.classeCabecalho;
        document.title = original.titulo;
        estilo.media = 'not all';
        seletor.remove();
        seletor = null;
        filtro.disabled = filtroDesabilitado;
        campo.placeholder = placeholder;
    }
    async function abrirPesquisa() {
        if (aberta || carregando) return;
        carregando = true;
        document.querySelector('.estadoEntradaPesquisa')?.remove();
        const enderecoInicial = location.href;
        try {
            await Promise.all([carregarModelo(), carregarEstilo()]);
            // A digitação e a composição continuam no mesmo elemento durante a carga.
            if (document.activeElement !== campo || location.href !== enderecoInicial) return;
            const endereco = new URL('pesquisa.html', location.href);
            history.pushState({ pesquisaEmEdicao: true }, '', endereco);
            mostrarPesquisa();
        } catch (_) {
            const mensagem = document.createElement('p');
            mensagem.className = 'estadoEntradaPesquisa';
            mensagem.setAttribute('role', 'status');
            mensagem.textContent = 'Não foi possível abrir os gêneros. Clique na busca para tentar novamente ou pressione Enter para pesquisar.';
            document.querySelector('main').prepend(mensagem);
        } finally {
            carregando = false;
        }
    }
    formulario.addEventListener('submit', evento => {
        campo.value = campo.value.trim();
        if (!campo.value) { evento.preventDefault(); campo.focus(); }
    });
    campo.addEventListener('focus', abrirPesquisa);
    campo.addEventListener('click', abrirPesquisa);
    formulario.addEventListener('click', evento => {
        if (evento.target === formulario) { campo.focus(); abrirPesquisa(); }
    });
    campo.addEventListener('input', atualizarEndereco);
    desktop.addEventListener('change', atualizarSeletor);
    window.addEventListener('popstate', evento => {
        if (evento.state?.pesquisaEmEdicao) mostrarPesquisa();
        else fecharPesquisa();
    });
})();
