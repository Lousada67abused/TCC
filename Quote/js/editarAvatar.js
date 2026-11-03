(() => {
    const wrapper = document.querySelector('.fotoPerfilEditor');
    const fotoPerfil = wrapper?.querySelector('.fotoPerfil');
    if (!wrapper || !fotoPerfil) return;
    let codigoUsuario = null;
    try { codigoUsuario = sessionStorage.getItem('codigo'); } catch (_) {}
    if (!/^[1-9]\d{0,9}$/.test(codigoUsuario || '') || Number(codigoUsuario) > 2147483647) return;

    function elemento(tag, classe, texto) {
        const no = document.createElement(tag);
        if (classe) no.className = classe;
        if (texto !== undefined) no.textContent = texto;
        return no;
    }
    let alterar = document.getElementById('alterarFotoPerfil');
    if (!alterar) {
        alterar = elemento('button', 'alterarFotoPerfil');
        alterar.id = 'alterarFotoPerfil';
        alterar.type = 'button';
        alterar.setAttribute('aria-label', 'Alterar foto de perfil');
        alterar.hidden = true;
        alterar.disabled = true;
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        const path = document.createElementNS(svg.namespaceURI, 'path');
        path.setAttribute('d', 'M4 6h4l2-3h4l2 3h4v15H4z M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0');
        svg.append(path);
        alterar.append(svg);
        wrapper.append(alterar);
    }
    alterar.setAttribute('aria-haspopup', 'dialog');
    alterar.setAttribute('aria-controls', 'popupEditarAvatar');

    const feedback = elemento('div', 'feedbackAvatarPerfil');
    feedback.hidden = true;
    const estadoPerfil = elemento('p');
    estadoPerfil.id = 'estadoAvatarPerfil';
    estadoPerfil.setAttribute('role', 'status');
    const tentarPerfil = elemento('button', 'botaoTentarAvatar', 'Tentar novamente');
    tentarPerfil.id = 'tentarAvatarPerfil';
    tentarPerfil.type = 'button';
    feedback.append(estadoPerfil, tentarPerfil);
    (wrapper.closest('.cabecalhoPerfil') || wrapper).after(feedback);

    let dados = null, modal = null, arquivo = null, urlPrevia = null, remover = false;
    let consultando = false, salvando = false, preparando = false, falhaConsulta = false, selecao = 0;
    let temporizador;
    const urls = new Set();
    function autenticado() {
        return dados?.autenticado === true && String(dados.codigoUsuarioLogado) === codigoUsuario;
    }
    function mensagemPerfil(texto, sucesso = false, repetir = false) {
        clearTimeout(temporizador);
        estadoPerfil.textContent = texto;
        estadoPerfil.classList.toggle('sucesso', sucesso);
        estadoPerfil.classList.toggle('erro', Boolean(texto) && !sucesso);
        tentarPerfil.hidden = !repetir;
        feedback.hidden = !texto && !repetir;
        if (sucesso) temporizador = setTimeout(() => mensagemPerfil(''), 2000);
    }
    function mensagemModal(texto, erro = false) {
        if (!modal) return;
        modal.estado.textContent = texto;
        modal.estado.hidden = !texto;
        modal.estado.classList.toggle('erro', erro);
    }
    function revogar(url) {
        if (url && urls.delete(url)) URL.revokeObjectURL(url);
    }
    function descartar() {
        selecao++;
        urls.forEach(url => URL.revokeObjectURL(url));
        urls.clear();
        arquivo = null;
        urlPrevia = null;
        remover = false;
        preparando = false;
        if (modal) modal.input.value = '';
    }
    function controles() {
        alterar.hidden = !autenticado() || falhaConsulta;
        alterar.disabled = consultando || salvando;
        tentarPerfil.disabled = consultando;
        if (!modal) return;
        const ocupado = salvando || consultando || preparando;
        modal.escolher.disabled = ocupado || !autenticado();
        modal.input.disabled = modal.escolher.disabled;
        modal.salvar.disabled = ocupado || falhaConsulta || !autenticado() || (!arquivo && !remover);
        modal.salvar.textContent = salvando ? 'Salvando...' : 'Salvar';
        modal.remover.hidden = !dados?.personalizado;
        modal.remover.disabled = ocupado || !autenticado() || remover;
        modal.cancelar.disabled = salvando;
        modal.fechar.disabled = salvando;
        modal.tentar.hidden = !falhaConsulta;
        modal.tentar.disabled = ocupado;
        modal.form.setAttribute('aria-busy', String(salvando));
        modal.previa.src = urlPrevia || (remover ? '../img/avatar.jpg' : dados?.url || fotoPerfil.src);
    }
    function validarResposta(resultado) {
        const resposta = resultado?.resposta;
        if (!(resultado?.status === true || resultado?.status === 'true') || !resposta ||
            String(resposta.codigoUsuario) !== codigoUsuario || typeof resposta.url !== 'string' || !resposta.url ||
            typeof resposta.personalizado !== 'boolean' || typeof resposta.autenticado !== 'boolean' || typeof resposta.versao !== 'string') {
            throw new Error('Não foi possível confirmar a foto de perfil. Tente novamente.');
        }
        if (new URL(resposta.url, location.href).origin !== location.origin) {
            throw new Error('Não foi possível confirmar a foto de perfil. Tente novamente.');
        }
        return resposta;
    }
    async function consultar() {
        const resposta = await fetch('../api/buscarAvatarUsuario.php?codigoUsuario=' + encodeURIComponent(codigoUsuario), {
            headers: { Accept: 'application/json' }
        });
        const resultado = await resposta.json();
        if (!resposta.ok) throw new Error(resultado.mensagem || 'Não foi possível carregar a foto de perfil.');
        return validarResposta(resultado);
    }
    function atualizarFotos() {
        try {
            if (window.Avatares?.atualizar) window.Avatares.atualizar(codigoUsuario, dados.versao);
            else fotoPerfil.src = dados.url;
        } catch (_) { fotoPerfil.src = dados.url; }
    }
    async function carregar() {
        if (consultando || salvando) return;
        consultando = true;
        controles();
        try {
            const anterior = dados?.versao;
            dados = await consultar();
            falhaConsulta = false;
            if (anterior !== undefined && anterior !== dados.versao) atualizarFotos();
            if (modal?.dialog.open) {
                mensagemModal(autenticado() ? '' : 'Entre novamente na sua conta para alterar a foto.', !autenticado());
            } else mensagemPerfil('');
        } catch (_) {
            falhaConsulta = true;
            if (modal?.dialog.open) mensagemModal('Não foi possível carregar a foto. Tente novamente.', true);
            else mensagemPerfil('Não foi possível carregar a foto de perfil.', false, true);
        } finally { consultando = false; controles(); }
    }
    function fechar() {
        if (salvando || !modal?.dialog.open) return;
        modal.dialog.close();
        descartar();
        mensagemModal('');
        controles();
        if (!alterar.hidden) alterar.focus();
    }
    async function selecionarFoto() {
        const selecionado = modal.input.files?.[0];
        modal.input.value = '';
        if (!selecionado || salvando || consultando || !autenticado()) return;
        const tipo = selecionado.type.toLowerCase();
        if ((tipo && !['image/jpeg', 'image/png', 'image/webp'].includes(tipo)) ||
            (!tipo && !/\.(jpe?g|png|webp)$/i.test(selecionado.name))) {
            mensagemModal('Escolha uma foto JPG, PNG ou WebP.', true);
            return;
        }
        if (!selecionado.size || selecionado.size > 5 * 1024 * 1024) {
            mensagemModal(selecionado.size ? 'A foto deve ter até 5 MB.' : 'Escolha uma foto válida.', true);
            return;
        }
        const atual = ++selecao;
        preparando = true;
        mensagemModal('Preparando a prévia...');
        controles();
        let novaUrl = null;
        try {
            novaUrl = URL.createObjectURL(selecionado);
            urls.add(novaUrl);
            const imagem = new Image();
            imagem.src = novaUrl;
            await imagem.decode();
            if (!imagem.naturalWidth || !imagem.naturalHeight) throw new Error();
            if (atual !== selecao || !modal.dialog.open) { revogar(novaUrl); return; }
            revogar(urlPrevia);
            arquivo = selecionado;
            urlPrevia = novaUrl;
            remover = false;
            mensagemModal('');
        } catch (_) {
            revogar(novaUrl);
            if (atual === selecao && modal.dialog.open) mensagemModal('Não foi possível abrir esta foto. Escolha outra imagem JPG, PNG ou WebP.', true);
        } finally {
            if (atual === selecao) { preparando = false; controles(); }
        }
    }
    async function salvar(evento) {
        evento.preventDefault();
        if (salvando || consultando || preparando || falhaConsulta || !autenticado() || (!arquivo && !remover)) return;
        salvando = true;
        mensagemModal('Salvando a foto...');
        controles();
        const corpo = new FormData();
        corpo.append('codigoUsuario', codigoUsuario);
        if (remover) corpo.append('acao', 'remover');
        else corpo.append('foto', arquivo, arquivo.name);
        let concluido = false;
        try {
            const resposta = await fetch('../api/atualizarAvatarUsuario.php', {
                method: 'POST', headers: { Accept: 'application/json' }, body: corpo
            });
            const resultado = await resposta.json();
            if (!resposta.ok) throw new Error(resultado.mensagem || 'Não foi possível salvar a foto. Tente novamente.');
            dados = validarResposta(resultado);
            falhaConsulta = false;
            atualizarFotos();
            concluido = true;
        } catch (erro) {
            const versaoAnterior = dados?.versao;
            try {
                dados = await consultar();
                falhaConsulta = false;
                if (dados.versao !== versaoAnterior) atualizarFotos();
            } catch (_) { falhaConsulta = true; }
            mensagemModal(erro instanceof TypeError || erro instanceof SyntaxError ?
                'Não foi possível confirmar o envio da foto. Tente salvar novamente.' : erro.message, true);
        } finally {
            salvando = false;
            controles();
            if (concluido) {
                fechar();
                mensagemPerfil('Foto de perfil atualizada!', true);
            }
        }
    }
    function criarModal() {
        if (modal) return;
        const dialog = elemento('dialog', 'popupEditarAvatar');
        dialog.id = 'popupEditarAvatar';
        dialog.setAttribute('aria-labelledby', 'tituloEditarAvatar');
        const form = elemento('form', 'formAvatarPerfil');
        form.id = 'formAvatarPerfil';
        form.noValidate = true;
        const botaoFechar = elemento('button', 'fecharAvatarPerfil', '×');
        botaoFechar.id = 'fecharAvatarPerfil';
        botaoFechar.type = 'button';
        botaoFechar.setAttribute('aria-label', 'Fechar edição de foto');
        botaoFechar.addEventListener('click', fechar);
        const titulo = elemento('h2', '', 'Foto de perfil');
        titulo.id = 'tituloEditarAvatar';
        const previa = elemento('img', 'previaAvatarPerfil');
        previa.id = 'previaAvatarPerfil';
        previa.alt = 'Prévia da foto de perfil';
        const escolher = elemento('button', 'escolherFotoAvatar', 'Escolher foto');
        escolher.id = 'escolherFotoAvatar';
        escolher.type = 'button';
        const input = elemento('input');
        input.id = 'arquivoAvatarPerfil';
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/webp';
        input.hidden = true;
        input.setAttribute('aria-label', 'Escolher arquivo de foto');
        escolher.setAttribute('aria-controls', input.id);
        escolher.addEventListener('click', () => input.click());
        input.addEventListener('change', selecionarFoto);
        const ajuda = elemento('p', 'ajudaAvatarPerfil', 'JPG, PNG ou WebP, até 5 MB.');
        const estado = elemento('p', 'estadoEditarAvatar');
        estado.id = 'estadoEditarAvatar';
        estado.setAttribute('role', 'status');
        const tentar = elemento('button', 'botaoTentarAvatar', 'Tentar novamente');
        tentar.id = 'tentarEditarAvatar';
        tentar.type = 'button';
        tentar.addEventListener('click', carregar);
        const removerBotao = elemento('button', 'removerAvatarPerfil', 'Remover foto');
        removerBotao.id = 'removerAvatarPerfil';
        removerBotao.type = 'button';
        removerBotao.addEventListener('click', () => {
            if (salvando || consultando || preparando || !autenticado() || !dados.personalizado) return;
            descartar();
            remover = true;
            mensagemModal('Clique em Salvar para remover a foto.');
            controles();
        });
        const acoes = elemento('div', 'acoesAvatarPerfil');
        const cancelar = elemento('button', 'cancelarAvatarPerfil', 'Cancelar');
        cancelar.id = 'cancelarAvatarPerfil';
        cancelar.type = 'button';
        cancelar.addEventListener('click', fechar);
        const botaoSalvar = elemento('button', 'salvarAvatarPerfil', 'Salvar');
        botaoSalvar.id = 'salvarAvatarPerfil';
        botaoSalvar.type = 'submit';
        acoes.append(cancelar, botaoSalvar);
        form.append(botaoFechar, titulo, previa, escolher, input, ajuda, removerBotao, estado, tentar, acoes);
        form.addEventListener('submit', salvar);
        dialog.append(form);
        document.body.append(dialog);
        modal = { dialog, form, previa, escolher, input, estado, tentar, remover: removerBotao,
            salvar: botaoSalvar, cancelar, fechar: botaoFechar };
        dialog.addEventListener('cancel', evento => { evento.preventDefault(); fechar(); });
        dialog.addEventListener('click', evento => {
            if (evento.target !== dialog || salvando) return;
            const rect = dialog.getBoundingClientRect();
            if (evento.clientX < rect.left || evento.clientX > rect.right || evento.clientY < rect.top || evento.clientY > rect.bottom) fechar();
        });
        dialog.addEventListener('close', () => { if (!dialog.open && !salvando) descartar(); });
    }
    alterar.addEventListener('click', () => {
        if (!autenticado() || consultando || salvando || falhaConsulta) return;
        criarModal();
        descartar();
        mensagemModal('');
        mensagemPerfil('');
        controles();
        modal.dialog.showModal();
        modal.escolher.focus();
    });
    tentarPerfil.addEventListener('click', carregar);
    carregar();
})();
