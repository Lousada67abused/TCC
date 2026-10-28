(() => {
    const registros = new Map();
    let codigoUsuario = null;
    try { codigoUsuario = sessionStorage.getItem('codigo'); } catch (_) {}
    let ativo = null, retorno = null, modal = null;

    function elemento(tag, classe, texto) {
        const no = document.createElement(tag);
        if (classe) no.className = classe;
        if (texto !== undefined) no.textContent = texto;
        return no;
    }
    function icone(caminho) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        const path = document.createElementNS(svg.namespaceURI, 'path');
        path.setAttribute('d', caminho);
        svg.append(path);
        return svg;
    }
    function autenticado(registro) {
        return Boolean(codigoUsuario && registro.estado?.autenticado === true &&
            String(registro.estado.codigoUsuarioLogado) === codigoUsuario);
    }
    function validarEstado(estado, registro) {
        if (!estado || String(estado.codigoAvaliacao) !== registro.codigo || String(estado.codigoLivro) !== registro.livro ||
            !Number.isSafeInteger(estado.quantidade_comentarios) || estado.quantidade_comentarios < 0 || typeof estado.autenticado !== 'boolean') {
            throw new Error('Não foi possível confirmar os comentários. Tente novamente.');
        }
        return estado;
    }
    function validarComentario(comentario, registro) {
        if (!comentario || !/^[1-9]\d*$/.test(String(comentario.id_comentario || '')) ||
            !/^[1-9]\d*$/.test(String(comentario.id_usuario || '')) ||
            String(comentario.id_avaliacao) !== registro.codigo || typeof comentario.texto !== 'string') {
            throw new Error('Não foi possível confirmar o comentário. Tente novamente.');
        }
        return comentario;
    }
    function criarComentario(comentario) {
        const item = elemento('li', 'comentarioAvaliacao');
        item.dataset.comentario = comentario.id_comentario;
        const nome = typeof comentario.nm_usuario === 'string' ? comentario.nm_usuario : 'Leitor';
        const endereco = 'perfilPublico.html?codigoUsuario=' + encodeURIComponent(comentario.id_usuario);
        const linkFoto = elemento('a', 'fotoComentarioAvaliacao');
        linkFoto.href = endereco;
        linkFoto.setAttribute('aria-label', 'Ver perfil de ' + nome);
        const foto = elemento('img');
        foto.alt = 'Foto de perfil de ' + nome;
        foto.loading = 'lazy';
        foto.addEventListener('error', () => { foto.src = '../img/avatar.jpg'; }, { once: true });
        foto.src = '../img/' + encodeURIComponent(comentario.id_usuario) + '.png';
        linkFoto.append(foto);
        const conteudo = elemento('div', 'conteudoComentarioAvaliacao');
        const cabecalho = elemento('div', 'autorComentarioAvaliacao');
        const linkNome = elemento('a', '', nome);
        linkNome.href = endereco;
        const data = elemento('time');
        const iso = String(comentario.dt_comentario || '').slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
            data.dateTime = iso;
            data.textContent = iso.split('-').reverse().join('/');
        }
        cabecalho.append(linkNome, data);
        conteudo.append(cabecalho, elemento('p', 'textoComentarioAvaliacao', comentario.texto));
        item.append(linkFoto, conteudo);
        return item;
    }
    function mostrar(registro) {
        registro.views.forEach(view => {
            if (view.raiz.isConnected) view.conectada = true;
            else if (view.conectada) { registro.views.delete(view); return; }
            const total = registro.estado?.quantidade_comentarios;
            view.contagem.textContent = total === undefined ? '—' : total;
            view.botao.setAttribute('aria-label', 'Ver comentários da avaliação' + (total === undefined ? '' : ' · ' + total + ' comentários'));
            view.botao.setAttribute('aria-busy', String(registro.carregando || registro.enviando));
        });
        if (ativo !== registro || !modal?.dialog.open) return;
        const { lista, estado, tentar, campo, form, enviar, entrar, avisoLogin } = modal;
        if (modal.registroLista !== registro || modal.comentariosLista !== registro.comentarios) {
            lista.replaceChildren(...(registro.comentarios || []).map(criarComentario));
            modal.registroLista = registro;
            modal.comentariosLista = registro.comentarios;
        }
        lista.setAttribute('aria-busy', String(registro.carregando));
        const erro = registro.erroEnvio || registro.erroLeitura;
        estado.textContent = erro || registro.sucesso || (registro.carregando && !registro.comentarios ? 'Carregando comentários...' :
            (registro.comentarios?.length === 0 ? 'Ainda não há comentários. Seja o primeiro a comentar.' : ''));
        estado.hidden = !estado.textContent;
        estado.classList.toggle('erro', Boolean(erro));
        estado.classList.toggle('sucesso', !erro && Boolean(registro.sucesso));
        tentar.hidden = !registro.erroLeitura || registro.carregando || registro.enviando;
        const podeComentar = autenticado(registro);
        form.hidden = !podeComentar;
        avisoLogin.hidden = !registro.estado || podeComentar;
        entrar.hidden = avisoLogin.hidden;
        campo.disabled = registro.enviando || registro.carregando;
        enviar.disabled = campo.disabled;
        enviar.setAttribute('aria-label', registro.enviando ? 'Enviando comentário' : 'Enviar comentário');
        form.setAttribute('aria-busy', String(registro.enviando));
        if (campo.value !== registro.rascunho) campo.value = registro.rascunho;
    }
    async function consultar(registro, resumo = false) {
        const parametros = new URLSearchParams({ avaliacao: registro.codigo, codigoLivro: registro.livro });
        if (resumo) parametros.set('resumo', '1');
        const resposta = await fetch('../api/buscarComentarioAvaliacao.php?' + parametros, { headers: { Accept: 'application/json' } });
        const resultado = await resposta.json();
        if (!resposta.ok || !(resultado.status === true || resultado.status === 'true') || !Array.isArray(resultado.resposta)) {
            throw new Error(resultado.mensagem || 'Não foi possível carregar os comentários. Tente novamente.');
        }
        const estado = validarEstado(resultado.estado, registro);
        const comentarios = resumo ? null : resultado.resposta.map(comentario => validarComentario(comentario, registro));
        registro.estado = estado;
        if (!resumo) registro.comentarios = comentarios;
    }
    async function carregar(registro, resumo = false) {
        if (registro.enviando) return;
        if (registro.carregando) {
            if (!resumo) registro.lerCompleto = true;
            return;
        }
        registro.carregando = true;
        registro.erroLeitura = '';
        mostrar(registro);
        try { await consultar(registro, resumo); }
        catch (_) { registro.erroLeitura = 'Não foi possível carregar os comentários. Tente novamente.'; }
        finally {
            registro.carregando = false;
            mostrar(registro);
            if (registro.lerCompleto) { registro.lerCompleto = false; carregar(registro); }
        }
    }
    function novaRequisicao() {
        if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
        if (globalThis.crypto?.getRandomValues) {
            return Array.from(crypto.getRandomValues(new Uint8Array(16)), valor => valor.toString(16).padStart(2, '0')).join('');
        }
        return Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    }
    async function enviarComentario(evento) {
        evento.preventDefault();
        const registro = ativo;
        if (!registro || registro.enviando || registro.carregando || !autenticado(registro)) return;
        const texto = modal.campo.value.trim();
        if (!texto || Array.from(texto).length > 500) {
            registro.erroEnvio = 'Escreva um comentário de 1 a 500 caracteres.';
            modal.campo.setAttribute('aria-invalid', 'true');
            mostrar(registro);
            modal.campo.focus();
            return;
        }
        registro.rascunho = texto;
        if (!registro.envio || registro.envio.texto !== texto) registro.envio = { texto, requisicaoId: novaRequisicao() };
        registro.enviando = true;
        registro.erroEnvio = '';
        registro.sucesso = '';
        clearTimeout(registro.temporizador);
        mostrar(registro);
        try {
            const resposta = await fetch('../api/cadastrarComentario.php', {
                method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ ...registro.envio, codigoUsuario, codigoAvaliacao: registro.codigo, codigoLivro: registro.livro })
            });
            const resultado = await resposta.json();
            if (!resposta.ok || !(resultado.status === true || resultado.status === 'true')) {
                throw new Error(resultado.mensagem || 'Não foi possível enviar o comentário. Tente novamente.');
            }
            const estado = validarEstado(resultado.estado, registro);
            const comentario = validarComentario(resultado.comentario, registro);
            registro.estado = estado;
            const existentes = registro.comentarios || [];
            registro.comentarios = [...existentes.filter(item => String(item.id_comentario) !== String(comentario.id_comentario) ||
                String(item.id_usuario) !== String(comentario.id_usuario)), comentario];
            registro.rascunho = '';
            registro.envio = null;
            registro.erroLeitura = '';
            registro.sucesso = 'Comentário enviado.';
            registro.temporizador = setTimeout(() => { registro.sucesso = ''; mostrar(registro); }, 2000);
        } catch (erro) {
            // Preserve o token: repetir o envio não deve criar outro comentário.
            try { await consultar(registro); }
            catch (_) { registro.erroLeitura = 'Não foi possível atualizar a lista de comentários.'; }
            registro.erroEnvio = erro instanceof TypeError || erro instanceof SyntaxError ?
                'Não foi possível confirmar o envio. Tente enviar novamente.' : erro.message;
        } finally {
            registro.enviando = false;
            mostrar(registro);
            if (ativo === registro && modal.dialog.open && !registro.rascunho) {
                modal.corpo.scrollTop = modal.corpo.scrollHeight;
                modal.campo.focus();
            }
        }
    }
    function fechar() {
        if (!modal?.dialog.open) return;
        modal.dialog.close();
        ativo = null;
        const alvo = retorno;
        retorno = null;
        if (alvo?.isConnected) alvo.focus();
    }
    function criarModal() {
        if (modal) return;
        const dialog = elemento('dialog', 'popupComentariosAvaliacao');
        dialog.id = 'popupComentariosAvaliacao';
        dialog.setAttribute('aria-labelledby', 'tituloComentariosAvaliacao');
        const cabecalho = elemento('div', 'cabecalhoComentariosAvaliacao');
        const titulo = elemento('h2', '', 'Comentários');
        titulo.id = 'tituloComentariosAvaliacao';
        const fecharBotao = elemento('button', 'fecharComentariosAvaliacao', '×');
        fecharBotao.type = 'button';
        fecharBotao.setAttribute('aria-label', 'Fechar comentários');
        fecharBotao.addEventListener('click', fechar);
        cabecalho.append(titulo, fecharBotao);
        const corpo = elemento('div', 'corpoComentariosAvaliacao');
        const lista = elemento('ol', 'listaComentariosAvaliacao');
        const estado = elemento('p', 'estadoComentariosAvaliacao');
        estado.id = 'estadoComentariosAvaliacao';
        estado.setAttribute('role', 'status');
        const tentar = elemento('button', 'tentarComentariosAvaliacao', 'Tentar novamente');
        tentar.type = 'button';
        tentar.addEventListener('click', () => { if (ativo) carregar(ativo); });
        corpo.append(lista, estado, tentar);
        const rodape = elemento('div', 'rodapeComentariosAvaliacao');
        const form = elemento('form', 'formComentarioAvaliacao');
        form.noValidate = true;
        const label = elemento('label', 'rotuloComentarioAvaliacao', 'Adicionar um comentário');
        label.htmlFor = 'textoComentarioAvaliacao';
        const campo = elemento('textarea');
        campo.id = 'textoComentarioAvaliacao';
        campo.name = 'texto';
        campo.rows = 1;
        campo.maxLength = 500;
        campo.required = true;
        campo.placeholder = 'Adicionar um comentário';
        campo.setAttribute('aria-describedby', estado.id);
        campo.addEventListener('input', () => {
            if (!ativo || ativo.enviando) return;
            ativo.rascunho = campo.value;
            if (ativo.envio && ativo.envio.texto !== campo.value.trim()) ativo.envio = null;
            ativo.erroEnvio = '';
            ativo.sucesso = '';
            campo.removeAttribute('aria-invalid');
            mostrar(ativo);
        });
        const enviar = elemento('button', 'enviarComentarioAvaliacao');
        enviar.type = 'submit';
        enviar.append(icone('M5 12h14m-6-6 6 6-6 6'));
        form.append(label, campo, enviar);
        form.addEventListener('submit', enviarComentario);
        const avisoLogin = elemento('p', 'loginComentarioAvaliacao', 'Entre na sua conta para comentar.');
        const entrar = elemento('a', 'entrarComentarioAvaliacao', 'Entrar');
        entrar.href = 'login.html';
        rodape.append(form, avisoLogin, entrar);
        dialog.append(cabecalho, corpo, rodape);
        document.body.append(dialog);
        modal = { dialog, corpo, lista, estado, tentar, campo, form, enviar, entrar, avisoLogin, fecharBotao };
        dialog.addEventListener('cancel', evento => { evento.preventDefault(); fechar(); });
        dialog.addEventListener('click', evento => {
            if (evento.target !== dialog) return;
            const rect = dialog.getBoundingClientRect();
            if (evento.clientX < rect.left || evento.clientX > rect.right || evento.clientY < rect.top || evento.clientY > rect.bottom) fechar();
        });
        dialog.addEventListener('close', () => { if (!dialog.open && ativo) { ativo = null; retorno?.focus(); retorno = null; } });
    }
    function abrir(registro, botao) {
        criarModal();
        ativo = registro;
        retorno = botao;
        modal.campo.removeAttribute('aria-invalid');
        mostrar(registro);
        if (!modal.dialog.open) modal.dialog.showModal();
        mostrar(registro);
        modal.fecharBotao.focus();
        carregar(registro);
    }
    function criar(avaliacao) {
        const raiz = elemento('div', 'comentariosAvaliacao');
        const codigo = String(avaliacao.id_avaliacao || ''), livro = String(avaliacao.id_livro || '');
        if (!/^[1-9]\d{0,9}$/.test(codigo) || Number(codigo) > 2147483647 || !/^[1-9]\d{0,18}$/.test(livro)) {
            raiz.hidden = true;
            return raiz;
        }
        const chave = codigo + ':' + livro;
        let registro = registros.get(chave);
        if (!registro) {
            registro = { codigo, livro, estado: null, comentarios: null, carregando: false, enviando: false,
                rascunho: '', envio: null, erroLeitura: '', erroEnvio: '', sucesso: '', views: new Set() };
            registros.set(chave, registro);
        }
        raiz.dataset.comentariosAvaliacao = codigo;
        const botao = elemento('button', 'botaoComentariosAvaliacao');
        botao.type = 'button';
        botao.setAttribute('aria-haspopup', 'dialog');
        botao.setAttribute('aria-controls', 'popupComentariosAvaliacao');
        botao.title = 'Comentários';
        const contagem = elemento('span', 'quantidadeComentariosAvaliacao');
        contagem.setAttribute('aria-hidden', 'true');
        botao.append(icone('M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z'), contagem);
        botao.addEventListener('click', () => abrir(registro, botao));
        raiz.append(botao);
        registro.views.add({ raiz, botao, contagem, conectada: false });
        mostrar(registro);
        if (!registro.estado && !registro.carregando) carregar(registro, true);
        return raiz;
    }
    window.ComentariosAvaliacao = Object.freeze({ criar });
})();
