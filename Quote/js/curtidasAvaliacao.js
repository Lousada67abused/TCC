(() => {
    const registros = new Map();
    let codigoUsuario = null;
    try { codigoUsuario = sessionStorage.getItem('codigo'); } catch (_) {}

    function autenticado(registro) {
        return Boolean(codigoUsuario && registro.estado?.autenticado === true &&
            String(registro.estado.codigoUsuarioLogado) === codigoUsuario);
    }
    function mostrar(registro) {
        const curtida = autenticado(registro) && registro.estado.curtida;
        const quantidade = registro.estado?.quantidade_curtidas;
        registro.views.forEach(view => {
            if (view.raiz.isConnected) view.conectada = true;
            else if (view.conectada) { registro.views.delete(view); return; }
            view.botao.disabled = registro.pendente;
            view.botao.classList.toggle('curtida', Boolean(curtida));
            view.botao.setAttribute('aria-pressed', String(Boolean(curtida)));
            view.botao.setAttribute('aria-busy', String(registro.pendente));
            const acao = registro.estado ? (curtida ? 'Remover curtida da avaliação' : 'Curtir avaliação') :
                (registro.pendente ? 'Carregando curtidas' : 'Tentar carregar curtidas novamente');
            view.botao.setAttribute('aria-label', acao + (quantidade === undefined ? '' : ' · ' + quantidade + ' curtidas'));
            view.botao.title = acao;
            view.contagem.textContent = quantidade === undefined ? (registro.pendente ? '—' : 'tentar novamente') : quantidade;
            view.mensagem.textContent = registro.erro;
            view.mensagem.hidden = !registro.erro;
            view.entrar.hidden = !registro.login;
        });
    }
    function estadoValido(estado, registro) {
        if (!estado || String(estado.codigoAvaliacao) !== registro.codigo ||
            String(estado.codigoLivro) !== registro.livro || typeof estado.curtida !== 'boolean' ||
            typeof estado.autenticado !== 'boolean' || !Number.isSafeInteger(estado.quantidade_curtidas) || estado.quantidade_curtidas < 0) {
            throw new Error('Não foi possível confirmar as curtidas. Tente novamente.');
        }
        return estado;
    }
    async function consultar(registro) {
        const parametros = new URLSearchParams({ codigoAvaliacao: registro.codigo, codigoLivro: registro.livro });
        const resposta = await fetch('../api/contarCurtidasAvaliacao.php?' + parametros, { headers: { Accept: 'application/json' } });
        const resultado = await resposta.json();
        if (!resposta.ok || !(resultado.status === true || resultado.status === 'true')) {
            throw new Error(resultado.mensagem || 'Não foi possível carregar as curtidas. Tente novamente.');
        }
        return estadoValido(resultado.estado, registro);
    }
    async function carregar(registro) {
        if (registro.pendente) return;
        registro.pendente = true;
        registro.erro = '';
        mostrar(registro);
        try { registro.estado = await consultar(registro); }
        catch (_) { registro.erro = 'Não foi possível carregar as curtidas. Tente novamente.'; }
        finally { registro.pendente = false; mostrar(registro); }
    }
    async function alternar(registro) {
        if (registro.pendente) return;
        if (!registro.estado) { await carregar(registro); return; }
        if (!autenticado(registro)) {
            registro.erro = 'Entre na sua conta para curtir esta avaliação.';
            registro.login = true;
            mostrar(registro);
            return;
        }
        const curtir = !registro.estado.curtida;
        registro.pendente = true;
        registro.erro = '';
        registro.login = false;
        mostrar(registro);
        try {
            const resposta = await fetch('../api/' + (curtir ? 'curtirAvaliacao.php' : 'descurtirAvaliacao.php'), {
                method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ codigoUsuario, codigoAvaliacao: registro.codigo, codigoLivro: registro.livro })
            });
            const resultado = await resposta.json();
            if (!resposta.ok || !(resultado.status === true || resultado.status === 'true')) {
                throw new Error(resultado.mensagem || 'Não foi possível salvar a curtida. Tente novamente.');
            }
            registro.estado = estadoValido(resultado.estado, registro);
        } catch (erro) {
            // A escrita pode ter sido confirmada mesmo se a resposta foi perdida.
            try { registro.estado = await consultar(registro); }
            catch (_) { registro.estado = null; }
            registro.erro = erro instanceof TypeError || erro instanceof SyntaxError ?
                'Não foi possível confirmar o envio. Confira as curtidas e tente novamente.' : erro.message;
        } finally { registro.pendente = false; mostrar(registro); }
    }
    function criar(avaliacao) {
        const raiz = document.createElement('div');
        raiz.className = 'curtidasAvaliacao';
        const codigo = String(avaliacao.id_avaliacao || ''), livro = String(avaliacao.id_livro || '');
        if (!/^[1-9]\d{0,9}$/.test(codigo) || Number(codigo) > 2147483647 || !/^[1-9]\d{0,18}$/.test(livro)) {
            raiz.hidden = true;
            return raiz;
        }
        raiz.dataset.curtidaAvaliacao = codigo;
        const chave = codigo + ':' + livro;
        let registro = registros.get(chave);
        if (!registro) {
            registro = { codigo, livro, estado: null, pendente: false, erro: '', login: false, views: new Set() };
            registros.set(chave, registro);
        }
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'botaoCurtirAvaliacao';
        const icone = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icone.setAttribute('viewBox', '0 0 24 24');
        icone.setAttribute('aria-hidden', 'true');
        icone.setAttribute('focusable', 'false');
        const caminho = document.createElementNS(icone.namespaceURI, 'path');
        caminho.setAttribute('d', 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z');
        icone.append(caminho);
        const contagem = document.createElement('span');
        contagem.className = 'quantidadeCurtidas';
        contagem.setAttribute('aria-hidden', 'true');
        botao.append(icone, contagem);
        const mensagem = document.createElement('p');
        mensagem.className = 'erroCurtidaAvaliacao';
        mensagem.setAttribute('role', 'status');
        const entrar = document.createElement('a');
        entrar.href = 'login.html';
        entrar.className = 'entrarCurtirAvaliacao';
        entrar.textContent = 'Entrar';
        raiz.append(botao, mensagem, entrar);
        registro.views.add({ raiz, botao, contagem, mensagem, entrar, conectada: false });
        botao.addEventListener('click', () => alternar(registro));
        mostrar(registro);
        if (!registro.estado && !registro.pendente) carregar(registro);
        return raiz;
    }
    window.CurtidasAvaliacao = Object.freeze({ criar });
})();
