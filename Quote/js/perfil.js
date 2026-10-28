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
    function criarLivro(livro) {
        const link = linkLivro(livro, 'livro');
        const texto = elemento('div', 'textoLivro');
        const titulo = elemento('h2', '', livro.titulo);
        titulo.title = livro.titulo;
        const autor = elemento('p', '', livro.autores || 'Autor não informado');
        autor.title = livro.autores || '';
        texto.append(titulo, autor);
        link.append(capa(livro), texto);
        return link;
    }
    function criarResenha(avaliacao) {
        const artigo = elemento('article', 'resenha');
        const texto = elemento('div', 'textoResenha');
        const nota = elemento('div', 'notaResenha');
        const data = elemento('time', '', formatarData(avaliacao.dt_avaliacao));
        if (data.textContent) data.dateTime = String(avaliacao.dt_avaliacao).slice(0, 10);
        nota.append(data);
        texto.append(nota,
            elemento('p', 'conteudoResenha', avaliacao.txt_resenha || 'Avaliação sem resenha.'));
        artigo.append(criarLivro(avaliacao), texto);
        return artigo;
    }
    function abrirAba(nome) {
        if (!secoes.some(secao => secao.id === nome)) nome = 'principal';
        document.body.classList.toggle('abaMetasAtiva', nome === 'metas');
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
    document.getElementById('voltarMetas')?.addEventListener('click', () => {
        history.pushState(null, '', '#principal');
        abrirAba('principal');
        buscar('#aba-principal').focus();
    });

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
            imagem.addEventListener('error', () => { imagem.src = '../img/avatar.jpg'; }, { once: true });
            imagem.src = '../img/' + encodeURIComponent(codigo) + '.png';
        });
    }
    function mostrarEstante() {
        if (!dados.biblioteca) return;
        const livros = dados.biblioteca.filter(livro => filtroEstante === 'favoritos' ? Number(livro.favorito) === 1 : livro.status === filtroEstante);
        lista('listaEstante', livros, criarLivro, 'Nenhum livro nesta categoria da sua estante.');
        const favoritos = dados.biblioteca.filter(livro => Number(livro.favorito) === 1);
        lista('listaFavoritos', favoritos.slice(0, 5), criarLivro, 'Você ainda não marcou livros como favoritos.');
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
        lista('livrosRecentes', livros.slice(0, 5), criarLivro, 'Suas avaliações mais recentes aparecerão aqui.');
    }
    let atividadesExibidas = 5;
    function tempoAtividade(valor) {
        const somenteData = /^\d{4}-\d{2}-\d{2}$/.test(valor || '');
        const data = new Date(somenteData ? valor + 'T00:00:00' : valor);
        if (Number.isNaN(data.getTime())) return '';
        const agora = new Date();
        let dias;
        if (somenteData) {
            dias = Math.max(0, Math.round((Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate()) -
                Date.UTC(data.getFullYear(), data.getMonth(), data.getDate())) / 86400000));
        } else {
            const minutos = Math.max(0, Math.floor((agora - data) / 60000));
            if (minutos < 1) return 'agora';
            if (minutos < 60) return minutos + 'min';
            if (minutos < 1440) return Math.floor(minutos / 60) + 'h';
            dias = Math.floor(minutos / 1440);
        }
        if (dias < 1) return 'hoje';
        if (dias < 7) return dias + 'd';
        if (dias < 30) return Math.floor(dias / 7) + 'sem';
        if (dias < 365) return Math.floor(dias / 30) + 'm';
        return Math.floor(dias / 365) + 'a';
    }
    function criarAtividade(atividade) {
        const item = elemento('li');
        const texto = elemento('p', 'textoAtividade');
        const acoes = { favorito: 'adicionou', lido: 'leu', lendo: 'está lendo',
            'quero ler': 'quer ler', desisti: 'desistiu de ler', avaliacao: 'avaliou' };
        const livro = linkLivro(atividade, 'livroAtividade');
        livro.textContent = atividade.titulo;
        texto.append(elemento('strong', 'nomeAtividade', atividade.nm_usuario || dados.usuario?.nm_usuario || 'Você'),
            ' ' + (acoes[atividade.tipo] || 'atualizou') + ' ', livro);
        if (atividade.tipo === 'favorito') texto.append(' aos favoritos');
        if (atividade.tipo === 'avaliacao') {
            const estrelas = elemento('span', 'estrelasAtividade');
            const nota = Math.min(5, numero(atividade.nota));
            estrelas.setAttribute('role', 'img');
            estrelas.setAttribute('aria-label', 'Avaliação: ' + nota + ' de 5 estrelas');
            for (let i = 1; i <= 5; i++) {
                const estrela = elemento('span', i > nota ? 'estrelaVazia' : '', '★');
                estrela.setAttribute('aria-hidden', 'true');
                estrelas.append(estrela);
            }
            texto.append(estrelas);
        }
        const data = elemento(atividade.data ? 'time' : 'span', 'tempoAtividade', tempoAtividade(atividade.data) || '—');
        if (atividade.data && data.textContent !== '—') {
            data.dateTime = atividade.data;
            const somenteData = /^\d{4}-\d{2}-\d{2}$/.test(atividade.data);
            const instante = new Date(somenteData ? atividade.data + 'T00:00:00' : atividade.data);
            data.title = somenteData ? instante.toLocaleDateString('pt-BR') : instante.toLocaleString('pt-BR');
            data.setAttribute('aria-label', 'Em ' + data.title);
        } else {
            data.title = 'Data não registrada para este status ou favorito';
            data.setAttribute('aria-label', data.title);
        }
        item.append(texto, data);
        return item;
    }
    function mostrarAtividades() {
        if (!dados.avaliacoes && !dados.biblioteca) {
            buscar('#listaAtividades').replaceChildren();
            mensagem('contagemAtividades', '');
            buscar('#verMaisAtividades').hidden = true;
            return;
        }
        const avaliacoes = dados.avaliacoes || [];
        const avaliados = new Set(avaliacoes.map(item => String(item.id_livro)));
        const atividades = avaliacoes.map(avaliacao => ({ ...avaliacao, tipo: 'avaliacao', data: avaliacao.dt_avaliacao }));
        // A estante guarda o estado atual, mas não a data em que ele foi escolhido.
        // Esses itens são exibidos após as avaliações datadas, sem inventar datas.
        (dados.biblioteca || []).forEach(livro => {
            if (Number(livro.favorito) === 1) atividades.push({ ...livro, tipo: 'favorito' });
            if (livro.status !== 'lido' || !avaliados.has(String(livro.id_livro))) {
                atividades.push({ ...livro, tipo: livro.status });
            }
        });
        lista('listaAtividades', atividades.slice(0, atividadesExibidas), criarAtividade, 'Você ainda não tem atividades para exibir.');
        mensagem('contagemAtividades', Math.min(atividadesExibidas, atividades.length) + ' de ' + atividades.length + ' atividades exibidas.');
        if (!dados.avaliacoes || !dados.biblioteca) {
            mensagem('estadoAtividades', 'Alguns dados não puderam ser carregados. Use Tentar novamente no topo do perfil.');
        }
        buscar('#verMaisAtividades').hidden = atividadesExibidas >= atividades.length;
    }
    buscar('#verMaisAtividades').addEventListener('click', () => {
        if (carregando) return;
        atividadesExibidas += 5;
        mostrarAtividades();
    });
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
        const opcoes = elemento('details', 'opcoesMeta');
        const resumo = elemento('summary', '', '⋯');
        resumo.setAttribute('aria-label', 'Opções da meta de ' + anoData(meta.data));
        opcoes.append(resumo);
        const acoes = elemento('div', 'acoesMeta');
        const editar = elemento('button', '', 'Editar');
        editar.type = 'button';
        editar.addEventListener('click', () => { opcoes.open = false; abrirFormulario(meta); });
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
        opcoes.append(acoes);
        opcoes.addEventListener('keydown', evento => {
            if (evento.key !== 'Escape') return;
            opcoes.open = false;
            resumo.focus();
        });
        return opcoes;
    }
    function diasRestantes(data) {
        const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(data || '').slice(0, 10));
        if (!partes) return null;
        const hoje = new Date();
        const prazo = Date.UTC(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
        const inicioHoje = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        return Math.max(0, Math.ceil((prazo - inicioHoje) / 86400000));
    }
    function mediaDoAno(ano) {
        if (!dados.avaliacoes) return '—';
        const avaliacoes = dados.avaliacoes.filter(avaliacao => anoData(avaliacao.dt_avaliacao) === ano);
        if (!avaliacoes.length) return '—';
        const media = avaliacoes.reduce((total, avaliacao) => total + numero(avaliacao.nota), 0) / avaliacoes.length;
        return media.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }
    function icone(nome) {
        const span = elemento('span', 'material-symbols-outlined', nome);
        span.setAttribute('aria-hidden', 'true');
        return span;
    }
    function cardMeta(meta, historico = false) {
        const card = elemento(historico ? 'li' : 'article', historico ? 'itemHistoricoMeta' : 'cardMeta');
        const lidos = numero(meta.livros_lidos);
        const quantidade = numero(meta.qnt_livros);
        const porcentagem = quantidade ? Math.round(lidos / quantidade * 100) : 0;
        const dias = diasRestantes(meta.data);
        const atingida = quantidade > 0 && lidos >= quantidade;
        const progresso = elemento('progress');
        progresso.max = quantidade || 1;
        progresso.value = Math.min(lidos, quantidade);
        progresso.setAttribute('aria-label', 'Progresso da meta: ' + porcentagem + '%');
        if (historico) {
            card.classList.add(atingida ? 'metaAtingida' : 'metaPendente');
            const situacao = elemento('span', 'situacaoMeta', atingida ? 'atingida' : dias === 0 ? 'prazo encerrado' : 'em andamento');
            card.append(elemento('span', 'anoMeta', anoData(meta.data)),
                elemento('span', 'nomeMeta', 'Meta de leitura'),
                elemento('span', 'contagemMeta', lidos + '/' + quantidade + ' livros'), progresso,
                elemento('span', 'porcentagem', porcentagem + '%'), situacao, acoesMeta(meta));
            return card;
        }
        const corpo = elemento('div', 'metaAnual');
        const roda = elemento('div', 'roda');
        roda.style.setProperty('--progresso', Math.min(100, porcentagem) + '%');
        const contagem = elemento('div');
        contagem.append(elemento('strong', '', lidos), elemento('span', '', '/' + quantidade));
        roda.append(contagem);
        roda.setAttribute('role', 'progressbar');
        roda.setAttribute('aria-label', 'Livros da meta');
        roda.setAttribute('aria-valuemin', '0');
        roda.setAttribute('aria-valuemax', String(quantidade || 1));
        roda.setAttribute('aria-valuenow', String(Math.min(lidos, quantidade)));
        roda.setAttribute('aria-valuetext', lidos + ' de ' + quantidade + ' livros');
        const detalhe = elemento('div', 'detalheMeta');
        const titulo = elemento('h3');
        titulo.append(icone('track_changes'), 'Meta Anual ' + anoData(meta.data));
        const linha = elemento('div', 'linhaProgresso');
        linha.append(progresso, elemento('span', 'porcentagem', porcentagem + '%'));
        detalhe.append(titulo, elemento('p', '', atingida ? 'Você atingiu sua meta!' : dias === 0 ?
            'O prazo desta meta foi encerrado.' : 'Você está no caminho certo!'), linha,
            elemento('p', 'faltam', atingida ? 'Meta atingida.' : 'Faltam ' + (quantidade - lidos) + ' livros'),
            elemento('p', 'prazoMeta', 'Prazo: ' + formatarData(meta.data)));
        corpo.append(roda, detalhe);
        const numeros = elemento('ul', 'numerosMeta');
        [['menu_book', formatoNumero.format(lidos), 'lidos na estante'],
            ['star', mediaDoAno(anoData(meta.data)), 'média em ' + anoData(meta.data)],
            ['schedule', dias === null ? '—' : formatoNumero.format(dias), 'dias restantes']].forEach(([nome, valor, rotulo]) => {
            const item = elemento('li');
            const simbolo = icone(nome);
            if (nome === 'star') simbolo.classList.add('estrelaMeta');
            item.append(simbolo, elemento('strong', '', valor), elemento('span', '', rotulo));
            numeros.append(item);
        });
        card.append(corpo, numeros, acoesMeta(meta));
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
            adicionar('Livros lidos', formatoNumero.format(lidos.length));
            adicionar('Páginas lidas', formatoNumero.format(lidos.reduce((total, livro) => total + numero(livro.qnt_paginas), 0)));
            const generos = new Map();
            lidos.forEach(livro => {
                new Set(String(livro.generos || '').split(', ').map(nome => nome.trim()).filter(Boolean))
                    .forEach(nome => generos.set(nome, (generos.get(nome) || 0) + 1));
            });
            const maisLido = [...generos].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))[0];
            adicionar('Gênero mais lido', maisLido?.[0] || '—');
        }
        if (dados.avaliacoes) {
            const melhorNota = dados.avaliacoes.length ? Math.max(...dados.avaliacoes.map(avaliacao => numero(avaliacao.nota))) : null;
            adicionar('Melhor avaliação', melhorNota === null ? '—' : melhorNota.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' / 5');
        }
        resumo.replaceChildren(...itens);
        const melhores = (dados.avaliacoes || []).filter(avaliacao => anoData(avaliacao.dt_avaliacao) === anoAtual)
            .sort((a, b) => numero(b.nota) - numero(a.nota)).slice(0, 3);
        const area = buscar('#melhoresAno');
        area.replaceChildren(...melhores.map(avaliacao => {
            const item = elemento('li');
            const livro = criarLivro(avaliacao);
            livro.classList.add('livroResumo');
            item.append(livro);
            return item;
        }));
        buscar('#tituloMelhoresAvaliacoes').textContent = 'Melhores avaliados em ' + anoAtual;
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
        buscar('#verMaisAtividades').disabled = true;
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
        mostrarAtividades();
        atualizarAnos();
        seletorAno.disabled = !dados.metas && !dados.avaliacoes;
        carregando = false;
        buscar('#verMaisAtividades').disabled = false;
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
