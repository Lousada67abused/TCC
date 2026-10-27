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
    let usuario = {};
    try { usuario = JSON.parse(sessionStorage.getItem('usuario')) || {}; } catch (_) {}

    const message = document.createElement('p');
    message.className = 'mensagemErro';
    message.setAttribute('role', 'status');
    card.before(message);
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Tentar novamente';
    retry.hidden = true;
    message.after(retry);
    const style = document.createElement('style');
    style.textContent = '.cardNovaResenha[hidden]{display:none!important}.containerDetalhesLivro.resenhaPublicada .cardResenhaUsuario{border:1px solid #bdd7ff;box-shadow:none}.avaliadorEstrelasInput span{cursor:pointer}.avaliadorEstrelasInput .estrelaCheia,.listaResenhasComunidade .estrelaCheia{color:#ffc107;font-variation-settings:"FILL" 1}.avaliadorEstrelasInput .estrelaVazia,.listaResenhasComunidade .estrelaVazia{color:#b3afaf;font-variation-settings:"FILL" 1}.textoResenhaUsuario{white-space:pre-wrap}.acoesMinhaResenha{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}.acoesMinhaResenha button{display:inline-flex;align-items:center;border:0;border-radius:6px;padding:6px;background:#f0f4f8;cursor:pointer}.acoesMinhaResenha button:disabled{opacity:.5;cursor:default}.acoesMinhaResenha .excluirResenha{color:#dc2626}';
    document.head.appendChild(style);

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
            popupButton.textContent = minhaResenha ? 'marcar como lido' : 'enviar avaliação';
        }
        if (popupClose) popupClose.disabled = enviando;
        popupStars.forEach(star => { star.disabled = enviando || Boolean(minhaResenha); });
        if (popupText) popupText.disabled = enviando || Boolean(minhaResenha);
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
            edit.disabled = true;
            edit.title = 'Editar resenha (em breve)';
            edit.setAttribute('aria-label', 'Editar resenha (em breve)');
            edit.append(elemento('span', 'material-symbols-outlined', 'edit'));
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
                    message.textContent = 'Resenha excluída. Você pode publicar outra avaliação.';
                } catch (erro) {
                    message.textContent = erro.message || 'Não foi possível excluir. Tente novamente.';
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
        if (popup?.open && minhaResenha) preencherMinhaAvaliacao();
        atualizarTela();
    }
    function consultar() {
        return window.ResenhasLivro.consultar();
    }
    async function iniciar() {
        retry.hidden = true;
        message.textContent = 'Verificando as resenhas do livro...';
        try {
            if (!codigoLivro) throw new Error('Selecione um livro antes de avaliar.');
            const avaliacoes = await consultar();
            carregado = true;
            mostrarResenhas(avaliacoes);
            message.textContent = codigoUsuario ? '' : 'Entre na sua conta para publicar uma resenha.';
            if (popup?.open) popupMessage.textContent = minhaResenha ? 'Você já avaliou este livro. Confirme para marcá-lo como lido.' : '';
        } catch (erro) {
            message.textContent = erro.message;
            if (popup?.open) popupMessage.textContent = 'Não foi possível consultar as avaliações. Feche e tente novamente.';
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
        if (!codigoUsuario) { status.textContent = 'Entre na sua conta para avaliar.'; return false; }
        enviando = true;
        atualizarTela();
        status.textContent = 'Publicando...';
        try {
            // Requery before writing to avoid a duplicate from another tab or a lost response.
            const avaliacoes = await consultar();
            const existente = avaliacoes.some(a => String(a.id_usuario) === String(codigoUsuario));
            if (existente) mostrarResenhas(avaliacoes);
            if (existente && !marcarLido) {
                status.textContent = 'Você já publicou uma resenha deste livro.';
                return false;
            }
            if (!marcarLido && (!resenhaLiberada() || bibliotecaPendente())) {
                throw new Error('Aguarde a confirmação do estado de leitura antes de publicar.');
            }
            if (marcarLido && !(await window.BibliotecaLivro.marcarLido())) {
                throw new Error('Não foi possível marcar o livro como lido. Confira a mensagem da estante e tente novamente.');
            }
            if (existente) {
                status.textContent = 'Livro marcado como lido. Sua avaliação foi preservada.';
                message.textContent = status.textContent;
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
            message.textContent = status.textContent = 'Avaliação publicada com sucesso!';
            try {
                const atualizadas = await consultar();
                if (atualizadas.some(a => String(a.id_usuario) === String(codigoUsuario))) mostrarResenhas(atualizadas);
            } catch (_) { /* Keep the confirmed review visible if refresh fails. */ }
            return true;
        } catch (erro) {
            status.textContent = erro.message || 'Não foi possível publicar. Tente novamente.';
            return false;
        } finally {
            enviando = false;
            atualizarTela();
        }
    }

    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (!carregado || enviando || minhaResenha || !resenhaLiberada() || bibliotecaPendente() || popup?.open) return;
        if (nota < 1 || nota > 5) { message.textContent = 'Selecione uma nota de 1 a 5.'; return; }
        const resenha = text.value.trim();
        if (!resenha) { message.textContent = 'Escreva sua resenha antes de publicar.'; text.focus(); return; }
        if (resenha.length > 500) { message.textContent = 'A resenha deve ter no máximo 500 caracteres.'; return; }
        await publicar(nota, resenha, message);
    });

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
        if (counter) counter.textContent = popupText.value.length + '/200';
    }
    function preencherMinhaAvaliacao() {
        notaPopup = Number(minhaResenha.nota) || 0;
        popupText.value = minhaResenha.txt_resenha || '';
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
    if (popup && popupForm && popupText && popupButton && popupMessage) {
        popupStars.forEach((star, index) => {
            star.addEventListener('click', () => {
                if (enviando || minhaResenha) return;
                notaPopup = index + 1;
                atualizarNotaPopup();
            });
        });
        popupText.addEventListener('input', atualizarContador);
        popupClose?.addEventListener('click', () => { if (!enviando) popup.close(); });
        popup.addEventListener('cancel', event => { if (enviando) event.preventDefault(); });
        popup.addEventListener('close', atualizarTela);
        popupForm.addEventListener('submit', async event => {
            event.preventDefault();
            if (!popup.open || enviando || !carregado) return;
            if (!minhaResenha && (notaPopup < 1 || notaPopup > 5)) {
                popupMessage.textContent = 'Selecione uma nota de 1 a 5.';
                popupStars[0]?.focus();
                return;
            }
            const resenha = popupText.value.trim();
            if (!minhaResenha && resenha.length > 200) {
                popupMessage.textContent = 'A resenha deve ter no máximo 200 caracteres.';
                return;
            }
            if (await publicar(notaPopup, resenha, popupMessage, true)) popup.close();
        });
        window.FeedbackLivro = {
            abrir() {
                if (enviando || !codigoUsuario) return;
                atualizarLivroPopup();
                notaPopup = 0;
                popupText.value = '';
                atualizarNotaPopup();
                atualizarContador();
                if (minhaResenha) preencherMinhaAvaliacao();
                popupMessage.textContent = minhaResenha ? 'Você já avaliou este livro. Confirme para marcá-lo como lido.' : '';
                popup.showModal();
                atualizarTela();
                if (!carregado) iniciar();
            }
        };
    }
    list.replaceChildren();
    container?.querySelectorAll('.secaoResenhasComunidade .contadorTotal').forEach(el => el.textContent = '(...)');
    atualizarTela();
    iniciar();
})();
