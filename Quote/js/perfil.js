(() => {
    const principal = document.querySelector('main');
    if (!principal?.querySelector('.cabecalhoPerfil')) return;
    const buscar = seletor => principal.querySelector(seletor);
    const todos = seletor => [...principal.querySelectorAll(seletor)];
    const abas = todos('.abasPerfil button');
    const secoes = todos('.conteudoAba');
    const estado = buscar('#estadoPerfil');
    const repetir = buscar('#tentarPerfil');
    const formulario = buscar('#formMeta');
    const seletorAno = buscar('#seletorAnoMeta');
    const fotos = [...document.querySelectorAll('.fotoUsuarioLogado')];
    const nomeMenu = document.querySelector('.nomeMenu');
    const emailMenu = document.querySelector('.emailMenu');
    const dados = { usuario: null, biblioteca: null, avaliacoes: null, metas: null };
    let codigo = null;
    try { codigo = sessionStorage.getItem('codigo'); } catch (_) {}
    const conectado = /^[1-9]\d*$/.test(codigo || '');
    let carregando = false, enviandoMeta = false, falhouMeta = false;
    let filtroEstante = 'lido';
    let anoAtual = String(new Date().getFullYear());
    const formatoNumero = new Intl.NumberFormat('pt-BR');

    function elemento(tag, classe, texto) {
        const no = document.createElement(tag);
        if (classe) no.className = classe;
        if (texto !== undefined) no.textContent = String(texto);
        return no;
    }
    function numero(valor) { return Math.max(0, Number(valor) || 0); }
    function formatarData(valor) {
        const data = String(valor || '').slice(0, 10);
        return /^\d{4}-\d{2}-\d{2}$/.test(data) ? data.split('-').reverse().join('/') : '';
    }
    function anoData(valor) { return String(valor || '').slice(0, 4); }
    function mensagem(id, texto) { const no = buscar('#' + id); if (no) no.textContent = texto; }
    function lista(id, itens, criar, vazio) {
        const area = buscar('#' + id);
        area.replaceChildren(...itens.map(criar));
        const estados = { listaFavoritos: 'estadoFavoritos', livrosRecentes: 'estadoRecentes',
            resenhasRecentes: 'estadoResenhasRecentes', listaEstante: 'estadoEstante',
            listaResenhas: 'estadoResenhas', listaAtividades: 'estadoAtividades' };
        if (estados[id]) mensagem(estados[id], itens.length ? '' : vazio);
    }
    function estrelas(nota) {
        const area = elemento('div', 'estrelas');
        const valor = Math.min(5, numero(nota));
        area.setAttribute('aria-label', 'Nota ' + valor.toLocaleString('pt-BR') + ' de 5');
        for (let i = 1; i <= 5; i++) {
            const estrela = elemento('span', i <= Math.round(valor) ? 'cheia' : '', '★');
            estrela.setAttribute('aria-hidden', 'true');
            area.append(estrela);
        }
        return area;
    }
    function linkLivro(livro, classe = '') {
        const link = elemento('a', classe);
        link.href = 'livro.html?codigoLivro=' + encodeURIComponent(livro.id_livro);
        link.title = livro.titulo || 'Ver livro';
        link.addEventListener('click', () => {
            try { sessionStorage.setItem('codigoLivro', String(livro.id_livro)); } catch (_) {}
        });
        return link;
    }
    function capa(livro) {
        const imagem = elemento('img');
        imagem.src = 'https://covers.openlibrary.org/b/isbn/' + encodeURIComponent(livro.id_livro) + '-L.jpg';
        imagem.alt = 'Capa de ' + (livro.titulo || 'livro');
        imagem.loading = 'lazy';
        imagem.addEventListener('error', () => {
            const aviso = elemento('span', 'capaIndisponivel', 'Capa indisponível');
            aviso.setAttribute('role', 'img');
            aviso.setAttribute('aria-label', imagem.alt);
            imagem.replaceWith(aviso);
        }, { once: true });
        return imagem;
    }
    function capaComLink(livro) {
        const link = linkLivro(livro, 'linkCapa');
        link.append(capa(livro));
        return link;
    }
    function criarLivro(livro) {
        const link = linkLivro(livro, 'livro');
        const texto = elemento('div', 'textoLivro');
        const titulo = elemento('h2', '', livro.titulo);
        titulo.title = livro.titulo;
        const autor = elemento('p', '', livro.autores || 'Autor não informado');
        autor.title = livro.autores || '';
        texto.append(titulo, autor);
        link.append(capa(livro), texto, estrelas(livro.nota_media));
        return link;
    }
    function criarResenha(avaliacao) {
        const artigo = elemento('article', 'resenha');
        const texto = elemento('div', 'textoResenha');
        const link = linkLivro(avaliacao);
        link.append(elemento('h2', '', avaliacao.titulo));
        const nota = elemento('div', 'notaResenha');
        const data = elemento('time', '', formatarData(avaliacao.dt_avaliacao));
        if (data.textContent) data.dateTime = String(avaliacao.dt_avaliacao).slice(0, 10);
        nota.append(estrelas(avaliacao.nota), data);
        texto.append(link, elemento('p', 'autorResenha', avaliacao.autores || 'Autor não informado'), nota,
            elemento('p', 'conteudoResenha', avaliacao.txt_resenha || 'Avaliação sem resenha.'));
        artigo.append(capaComLink(avaliacao), texto);
        return artigo;
    }
    function abrirAba(nome) {
        if (!secoes.some(secao => secao.id === nome)) nome = 'principal';
        abas.forEach(botao => {
            const ativa = botao.dataset.aba === nome;
            botao.classList.toggle('ativo', ativa);
            botao.setAttribute('aria-selected', String(ativa));
            botao.tabIndex = ativa ? 0 : -1;
        });
        secoes.forEach(secao => {
            secao.hidden = secao.id !== nome;
            secao.classList.toggle('escondido', secao.hidden);
        });
    }
    abas.forEach((botao, indice) => {
        botao.addEventListener('click', () => {
            history.pushState(null, '', '#' + botao.dataset.aba);
            abrirAba(botao.dataset.aba);
        });
        botao.addEventListener('keydown', evento => {
            const teclas = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
            if (!teclas.includes(evento.key)) return;
            evento.preventDefault();
            const alvo = evento.key === 'Home' ? 0 : evento.key === 'End' ? abas.length - 1 :
                (indice + (evento.key === 'ArrowRight' ? 1 : -1) + abas.length) % abas.length;
            abas[alvo].focus();
            abas[alvo].click();
        });
    });
    function lerAba() {
        if (location.pathname.endsWith('/perfil.html')) abrirAba(location.hash.slice(1));
    }
    window.addEventListener('hashchange', lerAba);
    window.addEventListener('popstate', lerAba);
    abrirAba(location.hash.slice(1));

    async function consultar(api) {
        const resposta = await fetch('../api/' + api + '.php?codigoUsuario=' + encodeURIComponent(codigo), {
            headers: { Accept: 'application/json' }
        });
        const resultado = await resposta.json();
        if (!resposta.ok || !(resultado.status === true || resultado.status === 'true') || !Array.isArray(resultado.resposta)) {
            throw new Error('Não foi possível consultar os dados.');
        }
        return resultado.resposta;
    }
    function mostrarUsuario() {
        const usuario = dados.usuario;
        if (!usuario) return;
        buscar('.nomePerfil').textContent = usuario.nm_usuario;
        buscar('.bioPerfil').textContent = usuario.bio || 'Este perfil ainda não tem uma biografia.';
        if (nomeMenu) nomeMenu.textContent = usuario.nm_usuario;
        if (emailMenu) emailMenu.textContent = usuario.email || '';
        const valores = { lidos: usuario.qtd_lidos, seguidores: usuario.qtd_seguidores, seguindo: usuario.qtd_seguindo };
        todos('[data-contagem]').forEach(no => { no.textContent = formatoNumero.format(numero(valores[no.dataset.contagem])); });
        fotos.forEach(imagem => {
            imagem.alt = 'Foto de perfil de ' + usuario.nm_usuario;
            imagem.addEventListener('error', () => { imagem.src = '../img/avatar.png'; }, { once: true });
            imagem.src = '../img/' + encodeURIComponent(codigo) + '.png';
        });
    }
    function mostrarEstante() {
        if (!dados.biblioteca) return;
        const livros = dados.biblioteca.filter(livro => filtroEstante === 'favoritos' ? Number(livro.favorito) === 1 : livro.status === filtroEstante);
        lista('listaEstante', livros, criarLivro, 'Nenhum livro nesta categoria da sua estante.');
        const favoritos = dados.biblioteca.filter(livro => Number(livro.favorito) === 1);
        lista('listaFavoritos', favoritos.slice(0, 5), capaComLink, 'Você ainda não marcou livros como favoritos.');
    }
    todos('#estante [data-status]').forEach(botao => botao.addEventListener('click', () => {
        filtroEstante = botao.dataset.status;
        todos('#estante [data-status]').forEach(outro => {
            const ativo = outro === botao;
            outro.classList.toggle('ativo', ativo);
            outro.setAttribute('aria-pressed', String(ativo));
        });
        mostrarEstante();
    }));
    function mostrarAvaliacoes() {
        if (!dados.avaliacoes) return;
        const avaliacoes = dados.avaliacoes;
        lista('listaResenhas', avaliacoes, criarResenha, 'Você ainda não avaliou nenhum livro.');
        lista('resenhasRecentes', avaliacoes.slice(0, 2), criarResenha, 'Suas resenhas recentes aparecerão aqui.');
        const livros = [...new Map(avaliacoes.map(avaliacao => [String(avaliacao.id_livro), avaliacao])).values()];
        lista('livrosRecentes', livros.slice(0, 5), capaComLink, 'Suas avaliações mais recentes aparecerão aqui.');
        lista('listaAtividades', avaliacoes, avaliacao => {
            const item = elemento('li');
            const texto = elemento('p');
            texto.append(elemento('strong', '', dados.usuario?.nm_usuario || 'Você'), ' avaliou ');
            const link = linkLivro(avaliacao);
            link.textContent = avaliacao.titulo;
            texto.append(link);
            const data = elemento('time', 'tempo', formatarData(avaliacao.dt_avaliacao));
            if (data.textContent) data.dateTime = String(avaliacao.dt_avaliacao).slice(0, 10);
            item.append(texto, estrelas(avaliacao.nota), data);
            return item;
        }, 'Você ainda não tem avaliações para exibir na atividade.');
    }
    function atualizarAnos() {
        const anos = new Set([String(new Date().getFullYear())]);
        (dados.metas || []).forEach(meta => anos.add(anoData(meta.data)));
        (dados.avaliacoes || []).forEach(avaliacao => anos.add(anoData(avaliacao.dt_avaliacao)));
        if (!anos.has(anoAtual)) anoAtual = String(new Date().getFullYear());
        seletorAno.replaceChildren(...[...anos].filter(ano => /^\d{4}$/.test(ano)).sort().reverse().map(ano => {
            const opcao = elemento('option', '', ano);
            opcao.value = ano;
            return opcao;
        }));
        seletorAno.value = anoAtual;
    }
    function acoesMeta(meta) {
        const acoes = elemento('div', 'acoesMeta');
        const editar = elemento('button', '', 'Editar');
        editar.type = 'button';
        editar.addEventListener('click', () => abrirFormulario(meta));
        const excluir = elemento('button', 'excluirMeta', 'Excluir');
        excluir.type = 'button';
        excluir.addEventListener('click', () => {
            const confirmar = elemento('div', 'confirmacaoMeta');
            confirmar.append(elemento('p', '', 'Excluir esta meta de ' + meta.qnt_livros + ' livros?'));
            const sim = elemento('button', '', 'Confirmar exclusão');
            sim.type = 'button';
            sim.addEventListener('click', () => salvarMeta('deletarMetaLeitura', { codigoMeta: meta.id_meta }));
            const cancelar = elemento('button', '', 'Cancelar');
            cancelar.type = 'button';
            cancelar.addEventListener('click', () => { confirmar.remove(); excluir.focus(); });
            confirmar.append(sim, cancelar);
            acoes.append(confirmar);
            excluir.disabled = true;
            cancelar.addEventListener('click', () => { excluir.disabled = false; });
            sim.focus();
        });
        editar.disabled = excluir.disabled = carregando || enviandoMeta || falhouMeta || !dados.usuario;
        acoes.append(editar, excluir);
        return acoes;
    }
    function cardMeta(meta, historico = false) {
        const card = elemento(historico ? 'li' : 'article', historico ? 'itemHistoricoMeta' : 'cardMeta');
        const lidos = numero(meta.livros_lidos);
        const quantidade = numero(meta.qnt_livros);
        const porcentagem = quantidade ? Math.min(100, Math.round(lidos / quantidade * 100)) : 0;
        card.append(elemento('h3', '', 'Meta de ' + anoData(meta.data)),
            elemento('p', '', lidos + ' de ' + quantidade + ' livros'),
            elemento('p', 'prazoMeta', 'Prazo: ' + formatarData(meta.data)));
        const progresso = elemento('progress');
        progresso.max = quantidade || 1;
        progresso.value = Math.min(lidos, quantidade);
        progresso.setAttribute('aria-label', 'Progresso da meta: ' + porcentagem + '%');
        card.append(progresso, elemento('p', 'porcentagem', porcentagem + '%'),
            elemento('p', 'faltam', lidos >= quantidade ? 'Meta atingida.' : 'Faltam ' + (quantidade - lidos) + ' livros.'), acoesMeta(meta));
        return card;
    }
    function mostrarResumo() {
        const resumo = buscar('#resumoAno');
        const itens = [];
        function adicionar(rotulo, valor) {
            const item = elemento('li');
            item.append(elemento('span', '', rotulo), elemento('strong', '', valor));
            itens.push(item);
        }
        if (dados.biblioteca) {
            const lidos = dados.biblioteca.filter(livro => livro.status === 'lido');
            adicionar('Livros lidos na estante', formatoNumero.format(lidos.length));
            adicionar('Páginas desses livros', formatoNumero.format(lidos.reduce((total, livro) => total + numero(livro.qnt_paginas), 0)));
        }
        if (dados.avaliacoes) {
            adicionar('Avaliações publicadas', formatoNumero.format(dados.avaliacoes.length));
            const media = dados.avaliacoes.length ? dados.avaliacoes.reduce((soma, avaliacao) => soma + numero(avaliacao.nota), 0) / dados.avaliacoes.length : null;
            adicionar('Média das suas notas', media === null ? '—' : media.toLocaleString('pt-BR', { maximumFractionDigits: 1 }));
        }
        resumo.replaceChildren(...itens);
        const melhores = (dados.avaliacoes || []).filter(avaliacao => anoData(avaliacao.dt_avaliacao) === anoAtual)
            .sort((a, b) => numero(b.nota) - numero(a.nota)).slice(0, 3);
        const area = buscar('#melhoresAno');
        area.replaceChildren(...melhores.map(avaliacao => {
            const item = elemento('li');
            const texto = elemento('div');
            const link = linkLivro(avaliacao);
            link.append(elemento('h3', '', avaliacao.titulo));
            texto.append(link, elemento('p', '', avaliacao.autores || 'Autor não informado'), estrelas(avaliacao.nota));
            item.append(capaComLink(avaliacao), texto);
            return item;
        }));
        if (!melhores.length) area.append(elemento('li', 'vazioPerfil', dados.avaliacoes ? 'Nenhuma avaliação neste ano.' : 'Não foi possível carregar as avaliações.'));
    }
    function mostrarMetas() {
        const area = buscar('#metaAtual');
        const historico = buscar('#historicoMetas');
        if (dados.metas) {
            const selecionadas = dados.metas.filter(meta => anoData(meta.data) === anoAtual);
            area.replaceChildren(...selecionadas.map(meta => cardMeta(meta)));
            mensagem('estadoMetas', selecionadas.length ? '' : 'Nenhuma meta cadastrada para ' + anoAtual + '.');
            historico.replaceChildren(...dados.metas.filter(meta => anoData(meta.data) !== anoAtual)
                .slice().reverse().map(meta => cardMeta(meta, true)));
            if (!historico.children.length) historico.append(elemento('li', 'vazioPerfil', 'Nenhuma outra meta cadastrada.'));
        }
        buscar('#novaMeta').disabled = carregando || enviandoMeta || falhouMeta || !dados.usuario || !dados.metas;
        formulario.querySelectorAll('input, button').forEach(no => { no.disabled = carregando || enviandoMeta || falhouMeta || !dados.usuario; });
        mostrarResumo();
    }
    seletorAno.addEventListener('change', () => { anoAtual = seletorAno.value; mostrarMetas(); });
    function abrirFormulario(meta = null) {
        if (carregando || enviandoMeta || falhouMeta || !dados.usuario) return;
        formulario.reset();
        buscar('#idMeta').value = meta?.id_meta || '';
        buscar('#anoMeta').value = meta ? anoData(meta.data) : anoAtual;
        buscar('#quantidadeMeta').value = meta?.qnt_livros || '';
        formulario.hidden = false;
        buscar('#quantidadeMeta').focus();
        mensagem('estadoMeta', '');
    }
    buscar('#novaMeta').addEventListener('click', () => abrirFormulario());
    buscar('#cancelarMeta').addEventListener('click', () => { formulario.hidden = true; buscar('#novaMeta').focus(); });
    async function salvarMeta(api, corpo) {
        if (carregando || enviandoMeta || falhouMeta || !dados.usuario) return;
        enviandoMeta = true;
        mostrarMetas();
        mensagem('estadoMeta', 'Salvando alteração...');
        try {
            const resposta = await fetch('../api/' + api + '.php', {
                method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(corpo)
            });
            const resultado = await resposta.json();
            if (!resposta.ok || !(resultado.status === true || resultado.status === 'true')) {
                throw new Error(resultado.erro || resultado.mensagem || 'Não foi possível salvar a alteração.');
            }
            formulario.hidden = true;
            dados.metas = await consultar('buscarMetaUsuario');
            atualizarAnos();
            mensagem('estadoMeta', 'Alteração salva.');
        } catch (_) {
            // Uma resposta perdida pode esconder uma gravação confirmada no banco.
            try {
                dados.metas = await consultar('buscarMetaUsuario');
                atualizarAnos();
                formulario.hidden = true;
                mensagem('estadoMeta', 'Não foi possível confirmar o envio. Confira as metas atualizadas antes de tentar novamente.');
            } catch (_) {
                falhouMeta = true;
                repetir.hidden = false;
                mensagem('estadoMeta', 'Não foi possível confirmar a alteração. Recarregue os dados antes de tentar novamente.');
            }
        } finally {
            enviandoMeta = false;
            mostrarMetas();
        }
    }
    formulario.addEventListener('submit', evento => {
        evento.preventDefault();
        if (!formulario.reportValidity()) return;
        const id = buscar('#idMeta').value;
        const ano = buscar('#anoMeta').value;
        const quantidade = Number(buscar('#quantidadeMeta').value);
        if (!/^\d{4}$/.test(ano) || Number(ano) < 1000 || Number(ano) > 9999 || !Number.isSafeInteger(quantidade) || quantidade <= 0) return;
        const meta = dados.metas?.find(item => String(item.id_meta) === id);
        const data = meta && anoData(meta.data) === ano ? meta.data : ano + '-12-31';
        anoAtual = ano;
        salvarMeta(id ? 'atualizarMetaLeitura' : 'cadastrarMetaLeitura', id ?
            { codigoMeta: id, qntLivros: quantidade, data } : { codigoUsuario: codigo, qntLivros: quantidade, data });
    });
    const estadosPorRecurso = { biblioteca: ['estadoFavoritos', 'estadoEstante'],
        avaliacoes: ['estadoRecentes', 'estadoResenhasRecentes', 'estadoResenhas', 'estadoAtividades'], metas: ['estadoMetas'] };
    async function carregar() {
        if (carregando || enviandoMeta || !conectado) return;
        carregando = true;
        principal.setAttribute('aria-busy', 'true');
        buscar('#novaMeta').disabled = true;
        formulario.querySelectorAll('input, button').forEach(no => { no.disabled = true; });
        repetir.hidden = true;
        estado.textContent = 'Carregando perfil...';
        const recursos = { usuario: 'buscarUsuarioCodigo', biblioteca: 'buscarBibliotecaUsuario',
            avaliacoes: 'buscarAvaliacaoUsuario', metas: 'buscarMetaUsuario' };
        Object.values(estadosPorRecurso).flat().forEach(id => mensagem(id, 'Carregando...'));
        const resultados = await Promise.allSettled(Object.entries(recursos).map(async ([chave, api]) => {
            const resposta = await consultar(api);
            if (chave === 'usuario' && !resposta.length) throw new Error('Usuário não encontrado.');
            dados[chave] = chave === 'usuario' ? resposta[0] : resposta;
        }));
        const falhas = resultados.map((resultado, indice) => resultado.status === 'rejected' ? Object.keys(recursos)[indice] : null).filter(Boolean);
        falhas.forEach(chave => { dados[chave] = null; (estadosPorRecurso[chave] || []).forEach(id => mensagem(id, 'Não foi possível carregar. Use Tentar novamente no topo do perfil.')); });
        falhouMeta = falhas.includes('metas');
        mostrarUsuario();
        mostrarEstante();
        mostrarAvaliacoes();
        atualizarAnos();
        seletorAno.disabled = !dados.metas && !dados.avaliacoes;
        carregando = false;
        principal.setAttribute('aria-busy', 'false');
        mostrarMetas();
        estado.textContent = falhas.length ? 'Alguns dados não puderam ser carregados. Tente novamente.' : '';
        repetir.hidden = !falhas.length;
    }
    repetir.addEventListener('click', carregar);
    if (conectado) carregar();
    else {
        principal.setAttribute('aria-busy', 'false');
        buscar('.nomePerfil').textContent = 'Seu perfil';
        buscar('.bioPerfil').textContent = '';
        estado.textContent = 'Entre na sua conta para ver seu perfil.';
        const entrar = elemento('a', 'linkEntrarPerfil', 'Entrar');
        entrar.href = 'login.html';
        estado.append(' ', entrar);
        Object.values(estadosPorRecurso).flat().forEach(id => mensagem(id, 'Entre na sua conta para ver estas informações.'));
        buscar('#novaMeta').disabled = true;
        seletorAno.disabled = true;
    }
})();
