# Configurações e aparência

`html/configuracoes.html` é acessível pelo item Configurações do menu do avatar.
O perfil próprio também tem um atalho de engrenagem, disponível no celular.
A página reutiliza o cabeçalho, o botão Ranking e a navegação inferior de
quatro itens. Inclui aparência, identificação da conta e links para estante,
metas, atividade e perfil; não apresenta controles sem ação.

## Preferência de tema

O modo inicial é claro. O controle Modo noturno aplica o tema imediatamente e
salva `claro` ou `escuro` em `localStorage`, na chave `quote.tema`. A escolha
vale para o navegador e permanece após recarregar, navegar ou sair da conta.
Outras abas da mesma origem acompanham as alterações pelo evento `storage`.
Ao restaurar uma página pelo histórico ou voltar a uma aba, a preferência é
conferida novamente, antes de depender de um novo evento de armazenamento.
Não altera dados da conta nem exige migração ou nova API.

Se o armazenamento estiver bloqueado, o controle funciona na página atual e
informa que a preferência não pôde ser salva. Valores antigos ou desconhecidos
usam o modo claro. Limpar o armazenamento remove a preferência.
A escolha não salva permanece na memória da página, inclusive após eventos
de restauração ou visibilidade, sem voltar ao valor antigo do armazenamento.

`js/tema.js` é carregado no head, antes das folhas de estilo, e define
`html[data-tema]` e `color-scheme`. A interface usa `TemaQuote.obter()` e
`TemaQuote.definir(valor)`; o evento `tema:alterado` mantém o controle atualizado.
`css/tema.css` fica após os estilos das páginas, com cores por componente e
variáveis semânticas usadas na nova tela. O CSS dinâmico da pesquisa é inserido
antes dele. Imagens de capa e avatares não recebem filtros de inversão.

Ao criar outra página, inclua o script de tema antes do primeiro CSS e a folha
de tema por último, respeitando o caminho relativo. Na raiz pública, use
`js/tema.js?v=2`/`css/tema.css?v=2`; dentro de `html`, use
`../js/tema.js?v=2`/`../css/tema.css?v=2`. Marque a folha com `data-estilo-tema`
para que o CSS dinâmico da pesquisa seja inserido antes dela. A versão dos
recursos invalida suas cópias anteriores no cache quando o HTML atualizado é aberto.

Os links de entrada do ranking usam `ranking.html?genero=0`, o mesmo endereço
que a página mantém depois de inicializar o filtro Geral. Isso evita o caso em
que `ranking.html` recupera uma cópia antiga sem tema, enquanto recarregar o
endereço com `genero=0` obtém o HTML novo. A pesquisa sem recarga também atualiza
esse link ao reutilizar uma navegação proveniente de um modelo antigo em cache.

## Verificação

Verificados no Chromium: configurações em 320, 375, 768 e 1440 px, persistência
após recarga e navegação, teclado e toque, links do menu e atalho do perfil,
sincronização entre abas e uso com armazenamento bloqueado. Também foram
conferidos os temas nas demais páginas e nos fluxos de pesquisa, perfis,
metas, livro e janelas de interação, preservando as cores das capas e estrelas.

O caso de HTML antigo do ranking em cache foi reproduzido num servidor HTTP
local sem interceptação de requisições. Os links corrigidos passaram em 12
entradas nos dois temas em quatro larguras, sem recarregar, incluindo o acesso
pela pesquisa com modelo antigo em cache. A restauração real do histórico foi
conferida com `pageshow.persisted = true`, nos dois temas e com falhas de armazenamento.
