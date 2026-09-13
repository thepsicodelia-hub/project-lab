# Validação da prévia Project Lab

## Atualização — 13/09/2026, Studio Edition

Esta seção descreve a versão atual; o registro V1 abaixo é histórico.

- Repaginação de composição, não apenas cores: menu flutuante, tipografia Geist local, painel de metas circular, agenda em linha do tempo, capas tipográficas de projetos, nova área de ferramentas e tela de acesso.
- Estilos compartilhados atualizados para clientes, agenda, tarefas, financeiro, comercial, objetivos, equipe, equipamentos, configurações e editores. Identidade carvão/citrino própria; nenhuma mídia ou código da Floow foi copiado.
- Conferência de layout das 12 páginas em navegador, em 390 px e 1440 px, sem transbordamento horizontal global. Quadros, tabelas e calendário mantêm rolagem própria quando necessário.
- Inspeção visual do painel e ferramentas em desktop e celular; tema claro e troca da cor de destaque confirmados pela interface na demonstração isolada. A cor testada foi `#b85212`; as preferências do endereço principal não foram alteradas.
- Ajustes após inspeção: rótulos operacionais maiores, ícone de busca visível no cabeçalho compacto, alvos de toque do cabeçalho e proteção para upload de imagens não reabrir um editor já fechado.
- Verificações funcionais anteriores nesta evolução: proposta com imagem compactada salva; valor de R$ 12.500,50 preservado na conversão para oportunidade e projeto; entrega, comentário com timecode e lançamento de 2,5 horas a R$ 40 persistidos no projeto de teste.
- `npm test`: 18 testes aprovados. Cobertura inclui dados, migração, painel, escape de conteúdo exportado, precisão monetária, regras de estúdio/permissões e concorrência. `npm run build`: concluído com Vite.

### Limites atuais de verificação

Não houve teste exaustivo de cada botão/estado. Upload de todas as galerias, download efetivo e impressão/PDF, leitores de tela, dispositivos físicos e autenticação real ainda precisam de validação específica. Login online, publicação e portal público não foram ativados. Não há alegação de paridade integral com a Floow.

## Registro histórico — V1

Data: 10/09/2026.

## Verificações realizadas

- `node --check app.js` e `node --check preview.mjs`: sem erros de sintaxe.
- Aplicação aberta em http://127.0.0.1:4173 no navegador do Codex.
- Cabeçalhos/conteúdo renderizados nas 12 rotas: visão geral, projetos, clientes, agenda, tarefas, financeiro, comercial, objetivos, equipe, equipamentos, ferramentas e configurações.
- Nenhum erro de JavaScript nos logs consultados do navegador.
- Criação de um projeto de QA pela interface e confirmação de persistência após recarregar a página.
- Busca de projeto por Aurora e alternância para lista confirmadas.
- Calculadora: custos de R$ 7.800, imposto 6%, margem 30%, preço de aproximadamente R$ 12.187,50 (interface arredonda para R$ 12.188).
- Abertura dos editores de roteiro, storyboard, ordem do dia e assistente criativo.
- Proposta: preenchimento de título/cliente, passagem do formulário para a prévia e conteúdo renderizado conferidos.
- Restauração dos exemplos para retirar o projeto de QA, pelo fluxo da própria interface.

## Inspeção visual

- Desktop 1440 × 1000: painel completo em tema escuro e claro.
- Celular simulado 390 × 844: painel completo, menu aberto e quadro de projetos.
- Largura do documento em celular: 390 px para viewport de 390 px. Tabelas e calendário usam contêineres próprios de rolagem.
- Ajustes após inspeção: ordenação dos próximos projetos por data, nome acessível em botões de busca/meta, menu móvel oculto fora de uso, alvos de toque maiores e contraste dos indicadores no tema claro.

## Revisão complementar de interação

| Antes | Depois | Motivo |
|---|---|---|
| Busca sem nome acessível quando o texto era ocultado | `aria-label` permanente | Identificação do controle em telas pequenas |
| Projetos em foco na ordem de cadastro | Ordenação por data de entrega | Próximo prazo aparece primeiro |
| Menu móvel apenas deslocado para fora da tela | Visibilidade removida quando fechado | Evitar foco em links invisíveis |
| Indicador positivo claro sobre fundo branco | Verde com maior contraste no tema claro | Legibilidade |

## Limites

Inspeção visual por amostragem: não equivale a aprovação visual de cada estado de cada formulário. Não foram testados upload de referências, downloads efetivos, impressão PDF, leitor de tela ou aparelhos físicos. Nenhuma sincronização, autenticação, geração IA ou publicação faz parte desta entrega. As telas e regras simplificadas são uma prévia, sem equivalência funcional integral à Floow.
