(() => {
    const area = document.querySelector('.secaoGridLivros .areaLivros');
    const estado = document.getElementById('statusLivros');
    const anterior = document.getElementById('livrosAnteriores');
    const proximo = document.getElementById('verMaisLivros');
    const paginacao = document.getElementById('paginacaoLivros');
    const intervalo = document.getElementById('intervaloLivros');
    if (!area || !estado || !anterior || !proximo || !paginacao || !intervalo) return;

    let codigoUsuario = null;
    let usuario = null;
    try {
        codigoUsuario = sessionStorage.getItem('codigo');
        usuario = JSON.parse(sessionStorage.getItem('usuario') || 'null');
    } catch (_) {
        // A página continua acessível mesmo sem dados de sessão válidos.
    }
    const codigoValido = /^[1-9]\d*$/.test(codigoUsuario || '');
    document.querySelectorAll('.avatarHeader').forEach(avatar => {
        avatar.addEventListener('error', () => { avatar.src = '../img/avatar.png'; }, { once: true });
        avatar.src = codigoValido ? '../img/' + codigoUsuario + '.png' : '../img/avatar.png';
    });
    if (usuario && typeof usuario === 'object') {
        document.getElementById('nomeUsuarioHeader').textContent = usuario.nm_usuario || 'Seu perfil';
        document.getElementById('emailUsuarioHeader').textContent = usuario.email || '';
    }

    let livros = [];
    let inicio = 0;
    let limite = 0;

    function capacidade() {
        // Os tamanhos das colunas vêm do CSS, inclusive ao redimensionar a janela.
        const colunas = getComputedStyle(area).gridTemplateColumns.match(/[\d.]+px/g);
        return Math.max(1, colunas ? colunas.length : 1) * 2;
    }

    function elemento(tag, classe, texto) {
        const novo = document.createElement(tag);
        novo.className = classe;
        if (texto !== undefined) novo.textContent = texto;
        return novo;
    }

    function criarLivro(livro) {
        const card = elemento('a', 'cardLivro');
        card.href = 'livro.html';
        card.dataset.idLivro = String(livro.id_livro);
        const selecionar = () => {
            try {
                sessionStorage.setItem('codigoLivro', String(livro.id_livro));
            } catch (_) { /* A navegação pela âncora permanece disponível. */ }
        };
        card.addEventListener('click', selecionar);
        card.addEventListener('auxclick', selecionar);

        const capa = elemento('img', 'capaLivro');
        capa.alt = 'Capa de ' + livro.titulo;
        capa.loading = 'lazy';
        capa.width = 200;
        capa.height = 300;
        capa.addEventListener('error', () => {
            capa.replaceWith(elemento('span', 'capaLivro capaLivroIndisponivel', 'Capa indisponível'));
        }, { once: true });
        capa.src = 'https://covers.openlibrary.org/b/isbn/' + livro.id_livro + '-L.jpg';

        const titulo = elemento('h3', 'tituloLivro', livro.titulo);
        titulo.title = livro.titulo;
        const autores = livro.autores || livro.nm_autor || '';
        const autor = elemento('p', 'autorLivro', autores);
        autor.title = autores;
        const numero = Number(String(livro.nota_media ?? 0).replace(',', '.'));
        const nota = Number.isFinite(numero) ? Math.min(5, Math.max(0, numero)) : 0;
        const estrelas = elemento('div', 'areaEstrelas');
        estrelas.setAttribute('role', 'img');
        estrelas.setAttribute('aria-label', 'Nota média: ' + nota.toFixed(1) + ' de 5');
        for (let i = 1; i <= 5; i++) {
            const estrela = elemento('span', 'estrelaAvaliacao ' +
                (i <= Math.round(nota) ? 'estrelaCheia' : 'estrelaVazia'), '★');
            estrela.setAttribute('aria-hidden', 'true');
            estrelas.append(estrela);
        }
        const numeroNota = elemento('span', 'notaLivro', nota.toFixed(1));
        numeroNota.setAttribute('aria-hidden', 'true');
        estrelas.append(numeroNota);
        card.append(capa, titulo, autor, estrelas);
        return card;
    }

    function mostrarPagina() {
        limite = capacidade();
        if (inicio >= livros.length) inicio = Math.max(0, Math.floor((livros.length - 1) / limite) * limite);
        const fim = Math.min(inicio + limite, livros.length);
        area.replaceChildren(...livros.slice(inicio, fim).map(criarLivro));
        paginacao.hidden = livros.length === 0;
        anterior.hidden = inicio === 0;
        proximo.hidden = fim >= livros.length;
        intervalo.textContent = livros.length ? (inicio + 1) + '–' + fim + ' de ' + livros.length : '';
    }

    anterior.addEventListener('click', () => {
        inicio = Math.max(0, inicio - capacidade());
        mostrarPagina();
    });
    proximo.addEventListener('click', () => {
        inicio += capacidade();
        mostrarPagina();
    });

    let frame = 0;
    function ajustarFileiras() {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
            if (livros.length && capacidade() !== limite) mostrarPagina();
        });
    }
    if ('ResizeObserver' in window) new ResizeObserver(ajustarFileiras).observe(area);
    window.addEventListener('resize', ajustarFileiras);

    if (!codigoValido) {
        estado.textContent = 'Entre na sua conta para receber recomendações de livros.';
        return;
    }
    estado.textContent = 'Carregando recomendações...';
    area.setAttribute('aria-busy', 'true');
    fetch('../api/recomendarLivroUsuario.php?codigoUsuario=' + encodeURIComponent(codigoUsuario), {
        headers: { Accept: 'application/json' }
    })
        .then(async resposta => {
            const resultado = await resposta.json();
            if (!resposta.ok || !(resultado.status === true || resultado.status === 'true') || !Array.isArray(resultado.resultado)) {
                throw new Error('Recomendações indisponíveis');
            }
            const unicos = new Map();
            resultado.resultado.forEach(livro => {
                if (!livro || !/^\d+$/.test(String(livro.id_livro))) return;
                const id = String(livro.id_livro);
                if (!unicos.has(id)) unicos.set(id, livro);
            });
            livros = [...unicos.values()];
            estado.textContent = livros.length ? '' : 'Ainda não há recomendações. Escolha seus gêneros favoritos ou adicione livros à sua biblioteca.';
            mostrarPagina();
        })
        .catch(() => {
            estado.textContent = 'Não foi possível carregar as recomendações. Atualize a página para tentar novamente.';
        })
        .finally(() => { area.setAttribute('aria-busy', 'false'); });
})();
