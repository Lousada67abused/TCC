(() => {
    const container = document.querySelector('.containerDetalhesLivro');
    const seletores = [...document.querySelectorAll('.selectStatus')];
    const botoes = [...document.querySelectorAll('.btnFavorito')];
    const estado = document.getElementById('estadoBibliotecaLivro');
    const tentar = document.getElementById('tentarBibliotecaLivro');
    const feedback = document.querySelector('.feedbackBibliotecaLivro');
    if (!container || !seletores.length || !botoes.length || !estado || !tentar || !feedback) return;

    const statusValidos = new Set(['lido', 'lendo', 'quero ler', 'desisti']);
    let codigoUsuario = null;
    let codigoLivro = null;
    try {
        codigoUsuario = sessionStorage.getItem('codigo');
        codigoLivro = sessionStorage.getItem('codigoLivro');
    } catch (_) { /* Sem sessão, os controles ficam indisponíveis. */ }

    let entrada = null;
    let carregado = false;
    let pendente = false;
    let statusEmEnvio = null;
    // A consulta evita cadastros duplicados, mas a escolha da página começa vazia.
    let statusSelecionado = '';

    function confirmarSelecao(status) {
        statusSelecionado = status;
        container.dataset.resenhaLiberada = String(['lido', 'lendo', 'desisti'].includes(status));
        container.dispatchEvent(new Event('biblioteca:alterada'));
    }

    let temporizadorMensagem;
    function mensagem(texto, repetir = false, sucesso = false) {
        clearTimeout(temporizadorMensagem);
        estado.textContent = texto;
        estado.classList.toggle('mensagemSucesso', sucesso);
        tentar.hidden = !repetir;
        feedback.hidden = !texto && !repetir;
        if (sucesso) temporizadorMensagem = setTimeout(() => mensagem(''), 2000);
    }

    function atualizarControles() {
        const favorito = entrada?.favorito === 1;
        seletores.forEach(seletor => {
            seletor.value = statusEmEnvio || statusSelecionado;
            seletor.disabled = !carregado || pendente;
        });
        botoes.forEach(botao => {
            botao.disabled = !carregado || pendente || !entrada;
            botao.classList.toggle('favoritoAtivo', favorito);
            botao.setAttribute('aria-pressed', String(favorito));
            botao.setAttribute('aria-label', favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
            botao.title = entrada ? '' : 'Adicione o livro à estante para favoritar.';
            const rotulo = botao.querySelector('.rotuloFavorito');
            const icone = botao.querySelector('.material-symbols-outlined');
            if (rotulo) rotulo.textContent = favorito ? 'Favorito' : 'Favoritar';
            if (icone) icone.textContent = favorito ? 'bookmark' : 'bookmark_border';
        });
        container.querySelectorAll('.botoesAcaoInterativa').forEach(area => {
            area.setAttribute('aria-busy', String(pendente));
        });
        tentar.disabled = pendente;
        container.dispatchEvent(new Event('biblioteca:alterada'));
    }

    async function consultar() {
        const resposta = await fetch('../api/buscarBibliotecaUsuario.php?codigoUsuario=' + encodeURIComponent(codigoUsuario), {
            headers: { Accept: 'application/json' }
        });
        const resultado = await resposta.json();
        if (!resposta.ok || !(resultado.status === true || resultado.status === 'true') || !Array.isArray(resultado.resposta)) {
            throw new Error('Não foi possível consultar a estante.');
        }
        const livro = resultado.resposta.find(item => item && String(item.id_livro) === codigoLivro);
        if (!livro) return null;
        if (!statusValidos.has(livro.status)) throw new Error('Estado de leitura inválido.');
        return { status: livro.status, favorito: Number(livro.favorito) === 1 ? 1 : 0 };
    }

    async function enviar(api, dados) {
        const resposta = await fetch('../api/' + api + '.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(dados)
        });
        const resultado = await resposta.json();
        if (!resposta.ok || !(resultado.status === true || resultado.status === 'true')) {
            throw new Error('Não foi possível salvar a alteração.');
        }
    }

    async function carregar() {
        if (pendente) return;
        pendente = true;
        carregado = false;
        mensagem('Carregando sua estante...');
        atualizarControles();
        try {
            entrada = await consultar();
            if (statusSelecionado && entrada?.status !== statusSelecionado) confirmarSelecao('');
            carregado = true;
            mensagem(entrada ? '' : 'Adicione o livro à estante para favoritar.');
        } catch (_) {
            confirmarSelecao('');
            mensagem('Não foi possível carregar sua estante. Tente novamente.', true);
        } finally {
            pendente = false;
            atualizarControles();
        }
    }

    async function conferirAposFalha(texto) {
        // Uma resposta perdida ou um cadastro concorrente pode ter gravado o livro.
        // Reconsultar evita apresentar uma alteração como confirmada sem saber o estado atual.
        try {
            entrada = await consultar();
            if (statusSelecionado && entrada?.status !== statusSelecionado) confirmarSelecao('');
            carregado = true;
            mensagem(texto + ' Confira o estado atual e tente novamente.', true);
        } catch (_) {
            carregado = false;
            confirmarSelecao('');
            mensagem('Não foi possível confirmar o estado da sua estante. Tente novamente.', true);
        }
    }

    async function salvarStatus(novoStatus) {
        if (!carregado || pendente || !statusValidos.has(novoStatus)) {
            atualizarControles();
            return false;
        }
        if (entrada?.status === novoStatus) {
            confirmarSelecao(novoStatus);
            atualizarControles();
            return true;
        }
        pendente = true;
        statusEmEnvio = novoStatus;
        const existente = entrada !== null;
        mensagem('Salvando estado de leitura...');
        atualizarControles();
        try {
            const dados = { codigoUsuario, codigoLivro, status: novoStatus };
            if (existente) {
                await enviar('atualizarStatusBiblioteca', dados);
                entrada = { ...entrada, status: novoStatus };
            } else {
                await enviar('cadastrarBiblioteca', { ...dados, visivel: 1, favorito: 0 });
                entrada = { status: novoStatus, favorito: 0 };
            }
            confirmarSelecao(novoStatus);
            mensagem(existente ? 'Estado de leitura atualizado.' : 'Livro adicionado à estante.', false, true);
            return true;
        } catch (_) {
            await conferirAposFalha('Não foi possível salvar o estado de leitura.');
            return false;
        } finally {
            statusEmEnvio = null;
            pendente = false;
            atualizarControles();
        }
    }

    window.BibliotecaLivro = { marcarLido: () => salvarStatus('lido') };

    seletores.forEach(seletor => seletor.addEventListener('change', () => {
        const novoStatus = seletor.value;
        if (!carregado || pendente || !statusValidos.has(novoStatus)) {
            atualizarControles();
            return;
        }
        if (novoStatus === 'lido') {
            // Cancelar o feedback preserva a seleção anterior e não grava na estante.
            atualizarControles();
            window.FeedbackLivro?.abrir();
            return;
        }
        salvarStatus(novoStatus);
    }));

    botoes.forEach(botao => botao.addEventListener('click', async () => {
        if (!carregado || pendente || !entrada) return;
        const favorito = entrada.favorito === 1 ? 0 : 1;
        pendente = true;
        mensagem('Atualizando favoritos...');
        atualizarControles();
        try {
            await enviar('atualizarFavoritoBiblioteca', { codigoUsuario, codigoLivro, favorito });
            entrada = { ...entrada, favorito };
            mensagem(favorito ? 'Livro adicionado aos favoritos.' : 'Livro removido dos favoritos.', false, true);
        } catch (_) {
            await conferirAposFalha('Não foi possível atualizar os favoritos.');
        } finally {
            pendente = false;
            atualizarControles();
        }
    }));

    confirmarSelecao('');
    atualizarControles();
    if (!/^[1-9]\d*$/.test(codigoUsuario || '')) {
        mensagem('Entre na sua conta para organizar sua estante.');
        return;
    }
    if (!/^[1-9]\d*$/.test(codigoLivro || '')) {
        mensagem('Selecione um livro para organizar sua estante.');
        return;
    }
    tentar.addEventListener('click', carregar);
    carregar();
})();
