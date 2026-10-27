(() => {
    const card = document.querySelector('.cardNovaResenha');
    const form = document.querySelector('.formularioAvaliacao');
    const text = document.getElementById('txtResenha');
    const button = document.querySelector('.btnPublicar');
    const stars = document.querySelectorAll('.avaliadorEstrelasInput span');
    const list = document.querySelector('.listaResenhasComunidade');
    if (!card || !form || !text || !button || !list) return;
    const container = card.closest('.containerDetalhesLivro');
    const popup = document.getElementById('popupFeedbackLivro');
    const popupForm = popup?.querySelector('.formularioFeedback');
    const popupText = document.getElementById('txtFeedback');
    const popupMessage = document.getElementById('estadoFeedbackLivro');
    const popupButton = popup?.querySelector('.btnEnviarAvaliacao');
    const popupStars = [...(popup?.querySelectorAll('.estrelasAvaliacaoModal button') || [])];
    const popupClose = popup?.querySelector('.btnFecharModal');

    const codigoUsuario = sessionStorage.getItem('codigo');
    const codigoLivro = sessionStorage.getItem('codigoLivro');
    let nota = 0;
    let notaPopup = 0;
    let carregado = false;
    let enviando = false;
    let minhaResenha = null;
    let editando = null;
    let usuario = {};
    try { usuario = JSON.parse(sessionStorage.getItem('usuario')) || {}; } catch (_) {}

    const message = document.createElement('p');
    message.className = 'mensagemErro';
    message.setAttribute('role', 'status');
    message.hidden = true;
    card.before(message);
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Tentar novamente';
    retry.hidden = true;
    message.after(retry);
    const style = document.createElement('style');
    style.textContent = '.cardNovaResenha[hidden]{display:none!important}.containerDetalhesLivro.resenhaPublicada .cardResenhaUsuario{border:1px solid #bdd7ff;box-shadow:none}.avaliadorEstrelasInput span{cursor:pointer}.avaliadorEstrelasInput .estrelaCheia,.listaResenhasComunidade .estrelaCheia{color:#ffc107;font-variation-settings:"FILL" 1}.avaliadorEstrelasInput .estrelaVazia,.listaResenhasComunidade .estrelaVazia{color:#b3afaf;font-variation-settings:"FILL" 1}.textoResenhaUsuario{white-space:pre-wrap}.acoesMinhaResenha{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}.acoesMinhaResenha button{display:inline-flex;align-items:center;border:0;border-radius:6px;padding:6px;background:#f0f4f8;cursor:pointer}.acoesMinhaResenha button:disabled{opacity:.5;cursor:default}.acoesMinhaResenha .excluirResenha{color:#dc2626}';
    document.head.appendChild(style);

    const temporizadoresMensagens = new WeakMap();
    function mostrarMensagem(alvo, texto, sucesso = false) {
        clearTimeout(temporizadoresMensagens.get(alvo));
        temporizadoresMensagens.delete(alvo);
        alvo.textContent = texto;
        alvo.hidden = !texto;
        alvo.classList.toggle('mensagemSucesso', sucesso);
        if (sucesso) {
            temporizadoresMensagens.set(alvo, setTimeout(() => mostrarMensagem(alvo, ''), 2000));
        }
    }

    function foto(img, codigo) {
        img.onerror = function () { this.onerror = null; this.src = '../img/avatar.jpg'; };
        img.src = '../img/' + encodeURIComponent(codigo) + '.png';
    }
    const avatar = card.querySelector('img');
    if (avatar && codigoUsuario) foto(avatar, codigoUsuario);

    function resenhaLiberada() {
        return container?.dataset.resenhaLiberada === 'true';
    }
    function bibliotecaPendente() {
        return Boolean(container?.querySelector('.botoesAcaoInterativa[aria-busy="true"]'));
    }
    function atualizarTela() {
        card.hidden = !carregado || Boolean(minhaResenha) || !codigoUsuario || !resenhaLiberada() || Boolean(popup?.open);
        button.disabled = !carregado || enviando || Boolean(minhaResenha) || !resenhaLiberada() || bibliotecaPendente();
        container?.classList.toggle('resenhaPublicada', Boolean(minhaResenha));
        if (popupButton) {
            popupButton.disabled = !carregado || enviando || !codigoUsuario;
            popupButton.textContent = editando ? 'salvar alterações' : (minhaResenha ? 'marcar como lido' : 'enviar avaliação');
        }
        if (popupClose) popupClose.disabled = enviando;
        popupStars.forEach(star => { star.disabled = enviando || (Boolean(minhaResenha) && !editando); });
        if (popupText) popupText.disabled = enviando || (Boolean(minhaResenha) && !editando);
        popupForm?.setAttribute('aria-busy', String(enviando));
    }
    container?.addEventListener('biblioteca:alterada', atualizarTela);

    function elemento(tag, classe, conteudo) {
        const el = document.createElement(tag);
        el.className = classe;
        if (conteudo !== undefined) el.textContent = conteudo;
        return el;
    }
    function criarAcoes(avaliacao, item, article) {
        if (String(avaliacao.id_usuario) === String(codigoUsuario)) {
            const actions = elemento('div', 'acoesMinhaResenha');
            const edit = document.createElement('button');
            edit.type = 'button';
            edit.className = 'editarResenha';
            edit.disabled = !avaliacao.id_avaliacao || !popup;
            edit.title = 'Editar resenha';
            edit.setAttribute('aria-label', 'Editar resenha');
            edit.append(elemento('span', 'material-symbols-outlined', 'edit'));
            edit.addEventListener('click', () => {
                if (!enviando && avaliacao.id_avaliacao) abrirFeedback(avaliacao);
            });
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'excluirResenha';
            remove.title = 'Excluir resenha';
            remove.setAttribute('aria-label', 'Excluir resenha');
            remove.append(elemento('span', 'material-symbols-outlined', 'delete'));
            // A freshly saved local review may not have received its ID yet.
            remove.disabled = !avaliacao.id_avaliacao;
            remove.addEventListener('click', async () => {
                if (enviando || !avaliacao.id_avaliacao) return;
                enviando = true;
                remove.disabled = true;
                try {
                    const response = await fetch('../api/deletarAvaliacao.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ codigoAvaliacao: avaliacao.id_avaliacao, codigoLivro })
                    });
                    const result = await response.json();
                    if (!response.ok || result.status !== true) throw new Error(result.mensagem || 'Não foi possível excluir a resenha.');
                    window.ResenhasLivro.remover(avaliacao.id_avaliacao);
                    minhaResenha = null;
                    nota = 0;
                    text.value = '';
                    stars.forEach(el => {
                        el.classList.remove('estrelaCheia');
                        el.classList.add('estrelaVazia');
                        el.setAttribute('aria-pressed', 'false');
                    });
                    mostrarMensagem(message, 'Resenha excluída. Você pode publicar outra avaliação.', true);
                } catch (erro) {
                    mostrarMensagem(message, erro.message || 'Não foi possível excluir. Tente novamente.');
                    remove.disabled = false;
                } finally {
                    enviando = false;
                    atualizarTela();
                }
            });
            actions.append(edit, remove);
            article.append(actions);
        }
    }
    function mostrarResenhas(avaliacoes) {
        minhaResenha = avaliacoes.find(a => String(a.id_usuario) === String(codigoUsuario)) || null;
        window.ResenhasLivro.mostrar(avaliacoes, criarAcoes);
        if (popup?.open && minhaResenha && !editando) preencherMinhaAvaliacao();
        atualizarTela();
    }
    function consultar() {
        return window.ResenhasLivro.consultar();
    }
    async function iniciar() {
        retry.hidden = true;
        mostrarMensagem(message, 'Verificando as resenhas do livro...');
        try {
            if (!codigoLivro) throw new Error('Selecione um livro antes de avaliar.');
            const avaliacoes = await consultar();
            carregado = true;
            mostrarResenhas(avaliacoes);
            mostrarMensagem(message, codigoUsuario ? '' : 'Entre na sua conta para publicar uma resenha.');
            if (popup?.open) mostrarMensagem(popupMessage, minhaResenha ? 'Você já avaliou este livro. Confirme para marcá-lo como lido.' : '');
        } catch (erro) {
            mostrarMensagem(message, erro.message);
            if (popup?.open) mostrarMensagem(popupMessage, 'Não foi possível consultar as avaliações. Feche e tente novamente.');
            retry.hidden = false;
        }
        atualizarTela();
    }
    retry.addEventListener('click', iniciar);

    stars.forEach((star, index) => {
        star.tabIndex = 0;
        star.setAttribute('role', 'button');
        star.setAttribute('aria-label', 'Dar nota ' + (index + 1));
        function selecionar() {
            if (enviando) return;
            nota = index + 1;
            stars.forEach((el, j) => {
                el.classList.toggle('estrelaCheia', j < nota);
                el.classList.toggle('estrelaVazia', j >= nota);
                el.setAttribute('aria-pressed', String(j < nota));
            });
        }
        star.addEventListener('click', selecionar);
        star.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selecionar(); }
        });
    });

    async function publicar(notaSelecionada, resenha, status, marcarLido = false) {
        if (!carregado || enviando) return false;
        if (!codigoUsuario) { mostrarMensagem(status, 'Entre na sua conta para avaliar.'); return false; }
        enviando = true;
        atualizarTela();
        mostrarMensagem(status, 'Publicando...');
        try {
            // Requery before writing to avoid a duplicate from another tab or a lost response.
            const avaliacoes = await consultar();
            const existente = avaliacoes.some(a => String(a.id_usuario) === String(codigoUsuario));
            if (existente) mostrarResenhas(avaliacoes);
            if (existente && !marcarLido) {
                mostrarMensagem(status, 'Você já publicou uma resenha deste livro.');
                return false;
            }
            if (!marcarLido && (!resenhaLiberada() || bibliotecaPendente())) {
                throw new Error('Aguarde a confirmação do estado de leitura antes de publicar.');
            }
            if (marcarLido && !(await window.BibliotecaLivro.marcarLido())) {
                throw new Error('Não foi possível marcar o livro como lido. Confira a mensagem da estante e tente novamente.');
            }
            if (existente) {
                const sucesso = 'Livro marcado como lido. Sua avaliação foi preservada.';
                mostrarMensagem(status, sucesso, true);
                if (status !== message) mostrarMensagem(message, sucesso, true);
                return true;
            }
            const response = await fetch('../api/avaliarLivro.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigoUsuario, codigoLivro, nota: notaSelecionada, resenha })
            });
            const resultado = await response.json();
            if (!response.ok || !(resultado.status === true || resultado.status === 'true')) {
                throw new Error(resultado.mensagem || resultado.erro || 'Não foi possível publicar a resenha.');
            }
            const local = { id_usuario: codigoUsuario, nm_usuario: usuario.nm_usuario || 'Você', nota: notaSelecionada, txt_resenha: resenha, dt_avaliacao: new Date().toLocaleDateString('sv-SE') };
            mostrarResenhas([local, ...avaliacoes]);
            mostrarMensagem(message, 'Avaliação publicada com sucesso!', true);
            if (status !== message) mostrarMensagem(status, 'Avaliação publicada com sucesso!', true);
            try {
                const atualizadas = await consultar();
                if (atualizadas.some(a => String(a.id_usuario) === String(codigoUsuario))) mostrarResenhas(atualizadas);
            } catch (_) { /* Keep the confirmed review visible if refresh fails. */ }
            return true;
        } catch (erro) {
            mostrarMensagem(status, erro.message || 'Não foi possível publicar. Tente novamente.');
            return false;
        } finally {
            enviando = false;
            atualizarTela();
        }
    }

    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (!carregado || enviando || minhaResenha || !resenhaLiberada() || bibliotecaPendente() || popup?.open) return;
        if (nota < 1 || nota > 5) { mostrarMensagem(message, 'Selecione uma nota de 1 a 5.'); return; }
        const resenha = text.value.trim();
        if (!resenha) { mostrarMensagem(message, 'Escreva sua resenha antes de publicar.'); text.focus(); return; }
        if (resenha.length > 500) { mostrarMensagem(message, 'A resenha deve ter no máximo 500 caracteres.'); return; }
        await publicar(nota, resenha, message);
    });

    async function salvarEdicao(resenha) {
        if (!editando || enviando) return;
        const atualizada = { ...editando, nota: notaPopup, txt_resenha: resenha };
        enviando = true;
        atualizarTela();
        mostrarMensagem(popupMessage, 'Salvando alterações...');
        try {
            const response = await fetch('../api/atualizarAvaliacao.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo: atualizada.id_avaliacao, codigoLivro, nota: atualizada.nota, resenha })
            });
            const resultado = await response.json();
            if (!response.ok || !(resultado.status === true || resultado.status === 'true')) {
                throw new Error(resultado.mensagem || resultado.resposta || 'Não foi possível editar a resenha.');
            }
            minhaResenha = atualizada;
            window.ResenhasLivro.atualizar(atualizada);
            mostrarMensagem(message, 'Resenha atualizada com sucesso!', true);
            popup.close();
        } catch (erro) {
            mostrarMensagem(popupMessage, erro.message || 'Não foi possível editar. Tente novamente.');
        } finally {
            enviando = false;
            atualizarTela();
        }
    }

    function atualizarNotaPopup() {
        popupStars.forEach((star, index) => {
            star.classList.toggle('estrelaCheia', index < notaPopup);
            star.setAttribute('aria-pressed', String(index < notaPopup));
        });
        const legenda = ['', 'péssimo', 'ruim', 'bom', 'muito bom', 'excelente'];
        const badge = popup?.querySelector('.badgeNota span');
        if (badge) badge.textContent = notaPopup ? '★ ' + notaPopup + ' - ' + legenda[notaPopup] : 'Selecione uma nota';
    }
    function atualizarContador() {
        const counter = popup?.querySelector('.contadorCaracteres');
        if (counter) counter.textContent = popupText.value.length + '/' + popupText.maxLength;
    }
    function preencherMinhaAvaliacao() {
        const avaliacao = editando || minhaResenha;
        notaPopup = Number(avaliacao.nota) || 0;
        popupText.value = avaliacao.txt_resenha || '';
        atualizarNotaPopup();
        atualizarContador();
    }
    function atualizarLivroPopup() {
        if (!popup) return;
        const capa = container.querySelector('.capaDestaque');
        const capaModal = popup.querySelector('.capaModal');
        if (capa.getAttribute('src')) capaModal.src = capa.currentSrc || capa.src;
        else capaModal.removeAttribute('src');
        capaModal.alt = capa.alt || 'Capa do livro';
        popup.querySelector('.infoLivroModal h3').textContent = container.querySelector('.tituloLivroDestaque').textContent || 'Carregando livro...';
        popup.querySelector('.infoLivroModal p').textContent = container.querySelector('.autorNome').textContent;
    }
    container?.addEventListener('livro:carregado', () => { if (popup?.open) atualizarLivroPopup(); });

    function abrirFeedback(avaliacao = null) {
        if (enviando || !codigoUsuario || !popup) return;
        editando = avaliacao ? { ...avaliacao } : null;
        atualizarLivroPopup();
        popup.querySelector('.tituloModal').textContent = editando ? 'Editar sua resenha' : 'Dê seu feedback sobre o livro';
        popupText.maxLength = editando ? 500 : 200;
        notaPopup = 0;
        popupText.value = '';
        atualizarNotaPopup();
        atualizarContador();
        if (editando || minhaResenha) preencherMinhaAvaliacao();
        mostrarMensagem(popupMessage, !editando && minhaResenha ? 'Você já avaliou este livro. Confirme para marcá-lo como lido.' : '');
        popup.showModal();
        atualizarTela();
        if (!carregado) iniciar();
    }

    if (popup && popupForm && popupText && popupButton && popupMessage) {
        popupStars.forEach((star, index) => {
            star.addEventListener('click', () => {
                if (enviando || (minhaResenha && !editando)) return;
                notaPopup = index + 1;
                atualizarNotaPopup();
            });
        });
        popupText.addEventListener('input', atualizarContador);
        popupClose?.addEventListener('click', () => { if (!enviando) popup.close(); });
        popup.addEventListener('cancel', event => { if (enviando) event.preventDefault(); });
        popup.addEventListener('close', () => {
            editando = null;
            atualizarTela();
        });
        popupForm.addEventListener('submit', async event => {
            event.preventDefault();
            if (!popup.open || enviando || !carregado) return;
            if ((editando || !minhaResenha) && (notaPopup < 1 || notaPopup > 5)) {
                mostrarMensagem(popupMessage, 'Selecione uma nota de 1 a 5.');
                popupStars[0]?.focus();
                return;
            }
            const resenha = popupText.value.trim();
            if ((editando || !minhaResenha) && resenha.length > popupText.maxLength) {
                mostrarMensagem(popupMessage, 'A resenha deve ter no máximo ' + popupText.maxLength + ' caracteres.');
                return;
            }
            if (editando) {
                await salvarEdicao(resenha);
                return;
            }
            if (await publicar(notaPopup, resenha, popupMessage, true)) popup.close();
        });
        window.FeedbackLivro = { abrir: () => abrirFeedback() };
    }
    list.replaceChildren();
    container?.querySelectorAll('.secaoResenhasComunidade .contadorTotal').forEach(el => el.textContent = '(...)');
    atualizarTela();
    iniciar();
})();
