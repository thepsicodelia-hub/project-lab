# Guia visual do Project Lab

Baseado na inspeção visual e funcional da Floow em 13/09/2026. O objetivo é chegar a uma experiência de operação audiovisual igualmente clara e envolvente, com identidade própria do Project Lab.

## Atualização implementada — Studio Edition, 13/09/2026

O pedido mais recente do usuário substitui o acabamento excessivamente sóbrio abaixo por uma composição mais expressiva. A versão implementada usa Geist e Geist Mono hospedadas no próprio site, navegação flutuante, superfícies em carvão, acento citrino `#D7EE78`, painel de metas circular, agenda em linha do tempo e capas tipográficas de projetos. Ferramentas recebeu uma composição assimétrica com destaque para propostas. Acento personalizável e tema claro permanecem disponíveis.

Impeccable orientou composição e hierarquia; Emil orientou feedback, modais e motion curto; UI/UX Polish orientou as passagens separadas em desktop e celular. As animações ficam nas interações, sem loops decorativos, e respeitam movimento reduzido. Não foram usadas marcas, imagens ou código da Floow, nem Refero ou APIs pagas.

O restante deste documento preserva a direção planejada durante a auditoria; não é uma lista de recursos integralmente implementados. O estado validado está em VALIDACAO-VISUAL.md.

## Direção escolhida

**Cena:** produtor abre o sistema no notebook de madrugada, em uma ilha de edição; precisa enxergar operação, prazos e dinheiro sem uma tela fria de planilha.

O Project Lab será um **console editorial de produção**, não uma cópia neon da Floow. Fundo carvão profundo, superfícies com textura quase preta, citrino como assinatura e cores de estado precisas. O tom é técnico, cinematográfico e sóbrio.

| Elemento | Floow observada | Project Lab proposto |
| --- | --- | --- |
| Marca | laranja/verde/ciano com glow forte | símbolo P/L próprio, citrino `#D7EE78` e wordmark em Geist |
| Fundo | preto com halo quente e esverdeado | carvão neutro com luz radial citrina discreta |
| Cards | grandes, arredondados, borda e glow suave | superfícies planas em dois níveis, borda fina neutra, sem cartões dentro de cartões |
| Tipografia | sans geométrica, muitos rótulos em caixa alta | `Geist` para interface e `Geist Mono` para valores, status e timecode |
| Ícones | circular, colorido, por categoria | Lucide/Phosphor com traço único de 1.75 px; cor só em ações e estados |
| Motion | transições e carregamentos curtos | 160–240 ms, `cubic-bezier(0.23, 1, 0.32, 1)`, somente transform e opacity |

## Tokens iniciais

```css
:root {
  --bg: #090b10;
  --surface: #10141d;
  --surface-raised: #151b27;
  --line: #263147;
  --ink: #f3f6fb;
  --muted: #92a0b8;
  --accent: #d7ee78;
  --accent-soft: #28311b;
  --success: #43d6a1;
  --warning: #f3bb54;
  --danger: #f07178;
  --radius-card: 18px;
  --radius-control: 12px;
  --ease-out: cubic-bezier(.23, 1, .32, 1);
}
```

### Studio Edition implementada

- Marca própria em SVG (`public/brand/project-lab-symbol.svg` e `project-lab-logo.svg`), sem dependência externa.
- Projeto abre em workspace dedicado com abas de visão geral, tarefas, entregas, cronograma, materiais, horas e financeiro.
- Fluxo de caixa combina entradas, saídas e saldo acumulado; inclui legenda, mês em foco, tooltip por toque/mouse e tabela acessível de fallback.
- Motion de entrada usa transform/opacity e desenho progressivo do gráfico, limitado a 150–250 ms e desativado para `prefers-reduced-motion`.

## Estrutura comum

### Desktop

- Sidebar fixa de 248 px, com marca, workspace, navegação em grupos e configurações no rodapé.
- Conteúdo com largura máxima de 1440 px, padding de 32–48 px.
- Cabeçalho da página com título, frase curta, filtros e somente uma ação primária.
- Grade de 12 colunas para dashboards; páginas editoriais usam 8/4 ou 7/5.
- Botão flutuante de suporte não deve ser copiado; ajuda entra em central própria ou comando `?`.

### Mobile

- Topbar compacta de 64 px com marca, título de contexto e menu.
- Navegação vira drawer, não uma coluna comprimida.
- Cards métricos empilhados; tabelas viram linhas expansíveis; kanban vira seletor de etapa e lista.
- Área de toque mínima de 44 px e campos com ao menos 48 px de altura.

## Padrões de componentes

### Botões

- Primário: preenchido em citrino, texto carvão, ícone à esquerda quando fizer sentido.
- Secundário: superfície elevada com borda, nunca o mesmo peso visual do primário.
- Terciário: somente texto/ícone; usado para filtros, voltar e ações locais.
- Destrutivo: só em menus ou rodapé de modal, afastado da ação de salvar.
- Pressão: `scale(.98)` em 120 ms; loading troca conteúdo sem mudar largura.

### Cards e dados

- Um painel contém uma ideia: métrica, lista, gráfico ou ação. Evitar card dentro de card.
- Métrica: rótulo curto, número tabular grande, comparação em texto claro e sparkline opcional.
- Status sempre combina cor, texto e ícone.
- Tabelas usam cabeçalho fixo leve, números alinhados à direita e ações em menu contextual.

### Formulários e modais

- Labels visíveis; ajuda abaixo do campo quando houver regra ou impacto financeiro.
- Wizard usa etapas numeradas, permite voltar e preserva rascunho.
- Modal com título, contexto, fechar, conteúdo rolável e rodapé fixo com Cancelar/Salvar.
- Erro aparece no campo e explica como resolver; exclusão terá opção de desfazer quando tecnicamente possível.

### Motion

- Navegação: crossfade curto + deslocamento de 8 px; conteúdo nunca começa invisível.
- Modal: opacidade de 0 para 1 e `scale(.97)` para 1 em 200 ms.
- Menus: surgem a partir do botão que os abriu, em 160 ms.
- Lista nova: entrada de 12 px e fade em 180 ms; até 5 itens com intervalo de 35 ms.
- Drag de kanban, calendário e moodboard: usar spring interrompível; sem movimento decorativo contínuo.
- Sempre respeitar `prefers-reduced-motion`.

## Páginas e composição

### Dashboard

No mobile da Floow, os três KPIs aparecem como cartões altos empilhados. No Project Lab, manter a leitura direta, mas reduzir altura: uma faixa de 3 métricas no desktop e carrossel horizontal no mobile. Abaixo, meta mensal em painel largo com anel de progresso e contexto financeiro. Widgets configuráveis entram em uma grade com alças de reordenação explícitas.

### Projetos

Desktop: quadro kanban com colunas de etapa, cabeçalho com quantidade e cor, cards com cliente, valor, entrega e responsáveis. Mobile: filtros no topo e uma lista de cartões; o status é um select de etapa. O card não deve carregar todos os metadados: mostrar valor, prazo e um indicador de saúde.

### Projeto detalhado

Cabeçalho com nome, cliente, etapa e saúde do projeto. Subnavegação por tabs: visão geral, entregas, tarefas, financeiro, materiais e cliente. A visão geral usa uma faixa de progresso e duas colunas: financeiro e próxima ação. Evitar misturar painéis de financeiro, horas, equipe e datas no mesmo bloco denso.

### Clientes e Comercial

Clientes: busca, filtros em chips e ranking com avatar tipográfico. Perfil do cliente é uma página de histórico, com receita, projetos e entregas em timeline.

Comercial: pipeline é o foco. No desktop usar colunas; no mobile, uma lista agrupada por etapa. Temperatura é tag pequena; não pode ser o único indicador do status. Lead aberto usa painel lateral para não remover o contexto do funil.

### Proposta web

Editor em dois painéis no desktop: campos à esquerda e prévia persistente à direita. No mobile, Configurar e Visualizar em tabs. A proposta pública ganha ritmo editorial: capa, escopo, investimento, termos, prova social, portfólio e CTA. A cor de destaque deve influenciar detalhes, bordas e gráficos, não transformar todos os textos em cor.

### Financeiro

Visão geral com uma métrica principal e três menores. Gráficos em painel sem borda excessiva, com legenda textual. Faturamento e custos usam tabelas com filtros no cabeçalho e cadastro em modal. Fluxo de caixa prioriza entradas, saídas e saldo acumulado no mesmo gráfico com contraste suficiente.

### Agenda, tarefas e equipe

Agenda: calendário limpo; eventos com cor, ícone e texto. Criar compromisso abre modal leve. Gerenciar categorias deve ser uma lista editável com preview de cor.

Tarefas: Planner, Quadro e Lista têm a mesma estrutura de dados e apenas mudam a lente. Cada tarefa mostra título, projeto, responsável e prazo. Conclusão usa check animado e mantém a tarefa recuperável por um curto período.

Time: central de trabalho para projetos, calendário e fornecedores. Organograma deve ter zoom e arrastar, mas também uma visão de lista acessível.

### Equipamentos e ferramentas

Equipamentos: cards compactos por item; compra, custo por diária, retorno e uso aparecem em uma escala de amortização. Não usar glow para todos os itens; reservar destaque para alerta ou retorno concluído.

Ferramentas: página de launcher com blocos de tamanhos diferentes por importância, não grade uniforme. Roteiro, moodboard e ordem do dia são editores de foco; esconder navegação secundária durante edição e oferecer autosave explícito.

### Configurações

Tabs horizontais no desktop e lista no mobile. Tema e cor devem ter preview vivo. Moeda precisa avisar claramente que é apenas formatação. Assinatura, integrações e IA ficam separados de preferências comuns.

## O que aproveitar e o que corrigir da referência

| Manter como princípio | Ajustar no Project Lab |
| --- | --- |
| dark mode de operação audiovisual | identidade de cor própria, com menos glow e maior contraste |
| cards amplos e painéis de controle | menos superfícies aninhadas e menos texto comprimido |
| editor de proposta em prévia imediata | rascunho seguro, exportação verificável e valores consistentes |
| kanban, calendário, timeline e portal do cliente | o mesmo dado deve alimentar todas as telas sem divergências |
| customização de acento e tema | tokens semânticos, contraste validado e preferência restaurável |
| microfeedback em salvar, copiar e concluir | estados de erro reais, desfazer em exclusões e acessibilidade de teclado |

## Critérios para implementação

- Não usar assets, texto, logotipo ou identidade da Floow.
- Nenhuma IA, chat, geração de imagem, Unsplash, geocodificação ou integração paga na primeira versão.
- Usar SVG consistente, não emoji como ícone de interface.
- Contraste AA e foco visível em todos os controles.
- Testar desktop e mobile separadamente antes de considerar uma página pronta.
