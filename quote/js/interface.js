// Shared navigation for the supplied layouts. All URLs resolve from this script.
(() => {
    const root = new URL('../', document.currentScript.src);
    const page = location.pathname.split('/').pop();
    const url = path => new URL(path, root).href;
    let user = null;
    try { user = JSON.parse(sessionStorage.getItem('usuario')); } catch (_) {}
    const error = message => {
        const el = document.querySelector('.mensagemErro');
        if (el) { el.textContent = message; el.classList.remove('escondido'); }
    };
    const request = async path => {
        const response = await fetch(url('api/' + path));
        const data = await response.json();
        if (!response.ok || !(data.status === true || data.status === 'true')) throw new Error('Não foi possível carregar os dados.');
        return data.resposta || data.resultado || [];
    };
    if (user) {
        document.querySelectorAll('.secaoUsuario .nomeUsuario, .cabecalhoDropdown strong').forEach(el => el.textContent = user.nm_usuario || '');
        document.querySelectorAll('.cabecalhoDropdown small').forEach(el => el.textContent = user.nm_usuario || '');
        document.querySelectorAll('.biografiaUsuario').forEach(el => el.textContent = user.bio || '');
        document.querySelectorAll('header img:not(figure img), .avatarHeader, .avatarPerfil img, .secaoUsuario > img, .cabecalhoDropdown > img').forEach(img => {
            img.onerror = () => { img.onerror = null; img.src = url('img/usuario.jpg'); };
            img.src = url('img/' + encodeURIComponent(user.id_usuario || sessionStorage.getItem('codigo')) + '.png');
        });
    }
    document.querySelectorAll('.itemSair').forEach(el => el.addEventListener('click', event => {
        event.preventDefault(); sessionStorage.removeItem('usuario'); sessionStorage.removeItem('codigo'); location.href = url('html/login.html');
    }));
    const menu = document.querySelector('.perfilMenuContainer');
    if (menu) {
        const avatar = menu.querySelector('.avatarHeader');
        avatar.tabIndex = 0; avatar.setAttribute('role', 'button'); avatar.setAttribute('aria-expanded', 'false');
        const toggle = () => { const open = menu.classList.toggle('aberto'); avatar.setAttribute('aria-expanded', String(open)); };
        avatar.addEventListener('click', toggle);
        avatar.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    }
    const search = input => {
        if (input.value.trim()) location.href = url(page === 'seguirAmigos.html' ? 'html/seguirAmigos.html' : 'html/buscas/buscasGeral.html') + '?termo=' + encodeURIComponent(input.value.trim());
    };
    document.querySelectorAll('.barraPesquisa input, .barraPesquisaMobile input, .barraPesquisaInterna input, .barraPesquisaDesktop input').forEach(input => {
        input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); search(input); } });
        const button = input.parentElement.querySelector('span');
        if (button) button.addEventListener('click', () => search(input));
    });
    const tabs = { principal: 'perfil.html', estante: 'perfil/estante.html', resenhas: 'perfil/resenha.html', atividade: 'perfil/atividades.html', metas: 'perfil/metas.html' };
    document.querySelectorAll('.abaItem, .menuOpcoesMobile a').forEach(el => {
        const dest = tabs[el.textContent.trim().toLowerCase()];
        if (dest) el.addEventListener('click', e => { e.preventDefault(); location.href = url('html/' + dest); });
    });
    document.querySelectorAll('.botaoGenero').forEach(button => button.addEventListener('click', () => {
        const img = button.querySelector('img');
        if (img) location.href = url('html/buscas/buscasGeral.html') + '?termo=' + encodeURIComponent(img.alt.replace('Selecionar livros com gênero de ', ''));
    }));
    if (page === 'buscasGeral.html' || page === 'buscasUsuario.html' || page === 'seguirAmigos.html') {
        const params = new URLSearchParams(location.search);
        const term = params.get('termo') || '';
        const filter = params.get('filtro') || 'geral';
        const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const title = document.querySelector('.tituloResultado, .tituloResultadoBusca');
        if (title) title.textContent = term ? 'Exibindo resultados para “' + term + '”' : 'Digite um termo para pesquisar';
        const books = document.querySelector('.areaLivros');
        const readers = document.querySelector('.listaUsuarios, .listaLeitores');
        if (books) books.replaceChildren();
        if (readers) readers.replaceChildren();
        const renderReader = person => {
            const card = document.createElement('article'); card.className = 'cardUsuario';
            const name = document.createElement('h3'); name.className = 'nomeUsuario'; name.textContent = person.nm_usuario;
            const follow = document.createElement('button'); follow.className = 'botaoSeguir'; follow.textContent = 'Seguir';
            let following = false;
            follow.addEventListener('click', async () => {
                const codigoUsuario = sessionStorage.getItem('codigo');
                if (!codigoUsuario) { location.href = url('html/login.html'); return; }
                follow.disabled = true;
                try {
                    const response = await fetch(url('api/' + (following ? 'deixarDeSeguir.php' : 'seguirUsuario.php')), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ codigoSeguidor: codigoUsuario, codigoSeguido: person.id_usuario }) });
                    const data = await response.json();
                    if (!response.ok || !(data.status === true || data.status === 'true')) throw new Error();
                    following = !following; follow.textContent = following ? 'Seguindo' : 'Seguir';
                } catch (_) { error('Não foi possível atualizar. Tente novamente.'); }
                finally { follow.disabled = false; }
            });
            card.append(name, follow); return card;
        };
        const load = async () => {
            if (!term) return;
            try {
                const jobs = [];
                if (books) jobs.push(request('filtrarlivro.php?filtro=' + encodeURIComponent(term)).then(list => list.filter(book => {
                    const key = { livros: 'titulo', 'gêneros': 'generos', autores: 'autores' }[filter];
                    return !key || normalize(book[key]).includes(normalize(term));
                }).forEach(book => {
                    const card = document.createElement('a'); card.className = 'cardLivro'; card.href = url('html/livro.html');
                    const img = document.createElement('img'); img.className = 'capaLivro'; img.alt = book.titulo; img.src = 'https://covers.openlibrary.org/b/isbn/' + encodeURIComponent(book.id_livro) + '-L.jpg';
                    const name = document.createElement('h2'); name.textContent = book.titulo;
                    card.append(img, name); card.addEventListener('click', () => sessionStorage.setItem('codigoLivro', book.id_livro)); books.append(card);
                })));
                if (readers) jobs.push(request('buscarUsuarioNome.php?nome=' + encodeURIComponent(term)).then(list => list.forEach(person => readers.append(renderReader(person)))));
                await Promise.all(jobs);
                if ((!books || !books.children.length) && (!readers || !readers.children.length)) error('Nenhum resultado encontrado.');
            } catch (_) { error('Não foi possível carregar os resultados. Tente novamente.'); }
        };
        load();
        document.querySelectorAll('.botaoFiltro').forEach(button => button.addEventListener('click', () => {
            const filter = button.textContent.trim();
            if (filter === 'leitores') location.href = url('html/buscas/buscasUsuario.html') + '?termo=' + encodeURIComponent(term);
            else location.href = url('html/buscas/buscasGeral.html') + '?termo=' + encodeURIComponent(term) + '&filtro=' + encodeURIComponent(filter);
        }));
        const done = document.querySelector('.botaoFinalizar');
        if (done) done.addEventListener('click', () => location.href = url('html/homepage.html'));
    }
})();
