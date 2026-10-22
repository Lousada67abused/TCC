(() => {
    let codigoUsuario = null;
    try { codigoUsuario = sessionStorage.getItem('codigo'); } catch (_) {}
    if (!/^[1-9]\d*$/.test(codigoUsuario || '')) codigoUsuario = null;

    let seguidos = new Set();
    let preparado = false;
    let jaCarregou = false;
    let jaTentouPreparar = false;
    let preparando = null;
    let processando = false;
    let erroConsulta = '';
    let proximoCard = 0;
    const cards = new Set();
    const seguidores = new Map();
    const fontesSeguidores = new WeakMap();

    function elemento(tag, classe, texto) {
        const novo = document.createElement(tag);
        novo.className = classe;
        if (texto !== undefined) novo.textContent = texto;
        return novo;
    }

    function quantidade(valor) {
        const numero = Number(valor);
        return Number.isFinite(numero) ? Math.max(0, Math.floor(numero)) : 0;
    }

    async function consultarSeguidos() {
        const resposta = await fetch('../api/buscarSeguidosUsuario.php?codigoUsuario=' + encodeURIComponent(codigoUsuario), {
            headers: { Accept: 'application/json' }
        });
        const resultado = await resposta.json();
        if (!resposta.ok || !(resultado.status === true || resultado.status === 'true') || !Array.isArray(resultado.resposta)) {
            throw new Error('Não foi possível consultar quem você segue.');
        }
        return new Set(resultado.resposta
            .filter(usuario => usuario && /^[1-9]\d*$/.test(String(usuario.id_usuario)))
            .map(usuario => String(usuario.id_usuario)));
    }

    function atualizarCard(card) {
        const { codigo, botao, icone, rotulo, estado, numeroSeguidores, numeroSeguindo } = card;
        const seguindo = seguidos.has(codigo);
        const indisponivel = !/^[1-9]\d*$/.test(codigo);
        botao.classList.toggle('seguindo', preparado && seguindo);
        botao.disabled = processando || Boolean(preparando) || indisponivel || !codigoUsuario || codigo === codigoUsuario;
        botao.removeAttribute('aria-pressed');
        icone.hidden = false;
        estado.textContent = card.mensagem || (!preparado && codigoUsuario ? erroConsulta : '');
        estado.classList.toggle('erroLeitor', Boolean(card.erro || (!preparado && erroConsulta)));
        if (indisponivel) {
            rotulo.textContent = 'Indisponível';
            icone.hidden = true;
        } else if (!codigoUsuario) {
            rotulo.textContent = 'Entre para seguir';
            icone.hidden = true;
        } else if (codigo === codigoUsuario) {
            rotulo.textContent = 'Você';
            icone.hidden = true;
        } else if (processando || preparando) {
            rotulo.textContent = processando ? 'Salvando...' : 'Carregando...';
            icone.hidden = true;
        } else if (!preparado) {
            rotulo.textContent = 'Tentar novamente';
            icone.hidden = true;
        } else {
            rotulo.textContent = seguindo ? 'seguindo' : 'seguir';
            icone.textContent = seguindo ? 'person_check' : 'person_add';
            botao.setAttribute('aria-pressed', String(seguindo));
        }
        numeroSeguidores.textContent = (seguidores.get(codigo) || 0).toLocaleString('pt-BR');
        if (codigo === codigoUsuario) {
            numeroSeguindo.textContent = (jaCarregou ? seguidos.size : card.seguindoInicial).toLocaleString('pt-BR');
        }
        botao.setAttribute('aria-label', rotulo.textContent + ': ' + card.nome);
        card.elemento.setAttribute('aria-busy', String(processando || Boolean(preparando)));
    }

    function atualizarTodos() {
        cards.forEach(atualizarCard);
    }

    async function preparar() {
        if (!codigoUsuario) return false;
        if (preparado) return true;
        if (preparando) return preparando;
        jaTentouPreparar = true;
        erroConsulta = '';
        preparando = (async () => {
            try {
                guardarConsulta(await consultarSeguidos());
                preparado = true;
                cards.forEach(card => { card.mensagem = ''; card.erro = false; });
                return true;
            } catch (_) {
                preparado = false;
                erroConsulta = 'Não foi possível consultar quem você segue. Tente novamente.';
                return false;
            } finally {
                preparando = null;
                atualizarTodos();
            }
        })();
        atualizarTodos();
        return preparando;
    }

    function guardarEstado(codigo, novoEstado) {
        const anterior = seguidos.has(codigo);
        if (anterior !== novoEstado) {
            if (seguidores.has(codigo)) {
                seguidores.set(codigo, Math.max(0, seguidores.get(codigo) + (novoEstado ? 1 : -1)));
            }
        }
        if (novoEstado) seguidos.add(codigo);
        else seguidos.delete(codigo);
    }

    function guardarConsulta(estadoAtual) {
        if (jaCarregou) {
            new Set([...seguidos, ...estadoAtual]).forEach(codigo => guardarEstado(codigo, estadoAtual.has(codigo)));
        }
        seguidos = estadoAtual;
        jaCarregou = true;
    }

    async function alternar(card) {
        if (processando || preparando || !codigoUsuario || card.codigo === codigoUsuario || !/^[1-9]\d*$/.test(card.codigo)) return;
        if (!preparado) {
            await preparar();
            return;
        }

        const novoEstado = !seguidos.has(card.codigo);
        processando = true;
        card.mensagem = '';
        card.erro = false;
        atualizarTodos();
        try {
            const resposta = await fetch('../api/' + (novoEstado ? 'seguirUsuario.php' : 'deixarDeSeguir.php'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ codigoSeguidor: codigoUsuario, codigoSeguido: card.codigo })
            });
            const resultado = await resposta.json();
            if (!resposta.ok || !(resultado.status === true || resultado.status === 'true')) {
                throw new Error('Não foi possível salvar.');
            }
            guardarEstado(card.codigo, novoEstado);
            card.mensagem = novoEstado ? 'Agora você segue este leitor.' : 'Você deixou de seguir este leitor.';
        } catch (_) {
            card.erro = true;
            try {
                const estadoAtual = await consultarSeguidos();
                guardarConsulta(estadoAtual);
                card.mensagem = 'A alteração não foi confirmada. O estado atual foi consultado; confira e tente novamente.';
            } catch (_) {
                preparado = false;
                erroConsulta = 'Não foi possível confirmar quem você segue. Tente novamente.';
                card.mensagem = erroConsulta;
            }
        } finally {
            processando = false;
            atualizarTodos();
        }
    }

    function criarCardLeitor(usuario) {
        const codigo = String(usuario?.id_usuario || '');
        const nome = String(usuario?.nm_usuario || 'Leitor');
        const item = elemento('li', 'cardLeitor');
        item.dataset.idUsuario = codigo;

        const foto = elemento('img', 'fotoLeitor');
        foto.alt = 'Foto de perfil de ' + nome;
        foto.loading = 'lazy';
        foto.width = 80;
        foto.height = 80;
        foto.addEventListener('error', () => { foto.src = '../img/avatar.jpg'; }, { once: true });
        foto.src = /^[1-9]\d*$/.test(codigo) ? '../img/' + codigo + '.png' : '../img/avatar.jpg';

        const informacoes = elemento('div', 'infoLeitor');
        const titulo = elemento('h3', 'nomeLeitor', nome);
        titulo.title = nome;
        const contagens = elemento('dl', 'contagensLeitor');
        let numeroSeguidores;
        let numeroSeguindo;
        [['Lidos', usuario?.qtd_lidos], ['Seguidores', usuario?.qtd_seguidores], ['Seguindo', usuario?.qtd_seguindo]]
            .forEach(([rotulo, valor]) => {
                const grupo = elemento('div', 'contagemLeitor');
                const descricao = elemento('dt', '', rotulo);
                const numero = elemento('dd', '', quantidade(valor).toLocaleString('pt-BR'));
                if (rotulo === 'Seguidores') numeroSeguidores = numero;
                if (rotulo === 'Seguindo') numeroSeguindo = numero;
                grupo.append(descricao, numero);
                contagens.append(grupo);
            });
        informacoes.append(titulo, contagens);

        const acoes = elemento('div', 'acoesLeitor');
        const botao = elemento('button', 'botaoSeguir');
        botao.type = 'button';
        const icone = elemento('span', 'material-symbols-outlined');
        icone.setAttribute('aria-hidden', 'true');
        const rotulo = elemento('span', 'rotuloSeguir');
        botao.append(icone, rotulo);
        const mensagem = elemento('p', 'mensagemLeitor');
        mensagem.id = 'estadoLeitor-' + (++proximoCard);
        mensagem.setAttribute('role', 'status');
        mensagem.setAttribute('aria-live', 'polite');
        botao.setAttribute('aria-describedby', mensagem.id);
        acoes.append(botao, mensagem);
        item.append(foto, informacoes, acoes);

        const seguidoresRecebidos = quantidade(usuario?.qtd_seguidores);
        // Trocar de aba reutiliza os objetos da consulta; uma nova resposta
        // da API fornece uma nova base, já incluindo alterações confirmadas.
        if (usuario && typeof usuario === 'object' && fontesSeguidores.get(usuario) !== seguidoresRecebidos) {
            seguidores.set(codigo, seguidoresRecebidos);
            fontesSeguidores.set(usuario, seguidoresRecebidos);
        } else if (!seguidores.has(codigo)) seguidores.set(codigo, seguidoresRecebidos);
        const card = { elemento: item, codigo, nome, botao, icone, rotulo, estado: mensagem,
            numeroSeguidores, numeroSeguindo, seguindoInicial: quantidade(usuario?.qtd_seguindo), mensagem: '', erro: false };
        cards.add(card);
        botao.addEventListener('click', () => alternar(card));
        atualizarCard(card);
        if (!jaTentouPreparar && codigoUsuario) preparar();
        return item;
    }

    window.Leitores = Object.freeze({ preparar, criarCardLeitor });
    window.criarCardLeitor = criarCardLeitor;
})();
