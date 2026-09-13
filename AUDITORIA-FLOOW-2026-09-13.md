# Auditoria funcional Floow — 13/09/2026

## Escopo e estado

Auditoria em andamento, autorizada com dados fictícios. Não é validação integral de todos os botões. Implementação do Project Lab permanece pausada por pedido do usuário.

Não acionar IA paga, cobranças, convites ou mensagens. Refero excluído. O usuário pediu manter a proposta de teste quando consultado sobre exclusão definitiva.

## Propostas: resultados comprovados

- Adicionar entregável: criou segunda linha e atualizou a prévia com descrição e prazo.
- Adicionar coluna de investimento: criou quinta coluna com título e conteúdo, visível na prévia.
- Valor `1250`: exibido como R$ 1.250,00 e preservado ao reabrir.
- Cor personalizada `#2563eb`: aplicada na prévia, preservada ao reabrir e visível na página pública.
- Salvar: proposta apareceu na listagem após selecionar TODOS; edição reabriu com conteúdo persistido. Não foi possível distinguir atraso de carregamento e efeito do filtro.
- Copiar Link Web: botão exibiu Copiado; leitura da área de transferência retornou vazia, portanto conteúdo copiado não validado.
- Gerar Proposta Web: abre modal com opção de proteção por senha e ativação explícita. Não é necessário gerar conteúdo com IA para obter o link.
- Ativar link: gerou página pública, com expiração informada para 18/09/2026 (cinco dias).
- Upload SVG: aceito na logo da capa, fundo da capa, logo da produtora, primeiro logo de cliente e primeira foto do portfólio. Imagem fictícia própria, sem dados privados.
- Imagens persistiram após salvar e foram verificadas visualmente na página pública, inclusive logo de cliente e portfólio.
- Salvar em PDF: botão acionado, sem arquivo confirmado em Downloads ou nova aba identificada. Exportação NÃO validada.
- Página pública renderizou resumo, investimento, termos, apresentação, portfólio e contato. Não havia botão de aceite na árvore acessível capturada; aceite comercial NÃO testado.

## Fluxos integrados comprovados

### Comercial → projeto

- A proposta recriada como `TESTE CODEX 1309 — Proposta com imagens` está salva e mantida, com logo de capa, fundo, logo da produtora, logo de cliente, portfólio e cor azul.
- A proposta gerou automaticamente um lead, com título da proposta e valor de R$ 1.250,00.
- Histórico interno do lead: nota criada e exibida com data e hora.
- Edição de lead: etapa e temperatura foram persistidas.
- Funil: mover para Fechado/Ganho atualizou potencial para R$ 0,00, convertido para R$ 1.250,00 e conversão para 100%.
- Criar projeto pelo lead fechado abriu o projeto correspondente, com cliente, data de captação e etapa Captação.
- Problema observado: o novo projeto inicialmente surgiu com valor zero, embora o lead e a proposta mostrassem R$ 1.250,00. Ao editar e salvar o valor manualmente, o financeiro passou a mostrar R$ 1.250,00 de valor e lucro, mas margem exibiu 0%.

### Projeto

- Financeiro: valor final manual persistiu.
- Recursos: a tela permite escolher equipamentos do inventário, membro da equipe e freelancer; não havia equipamento cadastrado para testar vínculo.
- Horas: preenchimento de 1h30 e descrição habilitou Adicionar Horas; a confirmação final do lançamento não ficou visível na captura.
- Tarefas: uma tarefa vinculada foi criada e marcada como Concluída.
- Cronograma: uma entrega foi criada e movida de A produzir para Em edição.
- Materiais: um link de teste com tag Referência foi salvo e mostra ações Copiar, Abrir e Remover.
- Área do Cliente: link personalizado foi ativado com permissões padrão (aprovação, propostas e materiais). O portal público exibiu o projeto, uma contagem de materiais e o estado dos vídeos.
- Aprovação de vídeos: entrega com URL `.mp4` foi criada; abrir sala mostrou player, feedback e aprovação integral. O player informou que não conseguiu abrir a mídia de exemplo, como esperado. Aprovação integral persistiu e o portal passou a mostrar 1 Aprovado.
- Problema observado: comentário com nome, timestamp e texto limpou o formulário, mas não apareceu no histórico, que continuou “Nenhum comentário ainda”.

### Financeiro

- Novo custo variável: exigiu descrição, categoria, valor e data, mesmo sendo necessário confirmar se data é realmente obrigatória na interface.
- Custo fictício de R$ 100,00 vinculado ao projeto persistiu na tabela e atualizou custos de setembro e de 2026.

### Agenda, tarefas e equipamentos

- Agenda: novo compromisso com título, cliente, categoria Entrega, endereço e observação foi salvo no calendário no horário selecionado.
- To-Do: item rápido colorido foi criado; o botão de conclusão recebeu clique, mas o estado visual de riscado não foi exposto pela árvore de acessibilidade.
- Equipamentos: câmera fictícia de R$ 2.000,00 e vida útil de 40 diárias calculou R$ 50,00 por diária.
- Vínculo de equipamento: projeto escolhido, R$ 200,00 cobrados e uma diária. Total amortizado atualizou para R$ 200,00 e amortização para 10%.

### Clientes e aparência

- Central de Clientes: o cliente criado pelo fluxo possui histórico agregado por abas de projetos, financeiro, cronograma, entregas, roteiros, propostas e arquivos. O faturamento exibido refletiu R$ 1.250,00 do projeto de teste.
- Aparência: confirmados dois temas, três moedas de exibição, sete presets de acento, cor hexadecimal manual, fundo sincronizado com a cor de acento e escolha de abas visíveis na barra lateral. Não foram alteradas as preferências reais do workspace durante a auditoria.

### Time e ferramentas manuais

- Fornecedores: fornecedor fictício com função, WhatsApp e diária foi criado e exibiu ações de editar, excluir e abrir WhatsApp.
- Organograma: departamento de teste e cargo vago foram criados e renderizados no quadro; zoom e reset também estão disponíveis.
- Roteiros: editor manual aceita título e texto, salva e retorna o roteiro à listagem com status Rascunho. O botão PDF foi localizado, mas nenhum arquivo de exportação foi confirmado.
- Moodboard: título é aceito, porém salvar continua desabilitado sem item visual. O editor não expôs um input de arquivo acessível; geração Gemini e busca Unsplash não foram acionadas por serem integrações externas/IA fora do escopo gratuito.
- Ordem do Dia: adicionar localização, linha de cronograma e membro de equipe criou novos blocos no documento. Geocodificação e previsão não foram acionadas.
- Calculadora independente: ativar Serviços cria itens com quantidade e valor; custo de R$ 500,00 com margem de 30% gerou valor final de R$ 650,00 e lucro de R$ 150,00. A fórmula é acréscimo de margem sobre o custo, e não margem sobre o preço final.

### Dashboard e objetivos

- Dashboard: personalizador permite até cinco widgets, define ordem pela sequência de clique e oferece faturamento por tag, concluídos, pagamentos/entregas, metas, calendário, relógio/data, conversão e ticket médio. Configuração existente foi apenas inspecionada e preservada.
- Objetivos: metas mensal e anual alimentam percentuais, projeção e comparativo. Modal confirmou valores atuais de R$ 15.000 mensais e R$ 180.000 anuais; foi fechado sem alteração.

## Incidente na exclusão e estado pendente

A exclusão da proposta fictícia abriu confirmação: “Excluir esta proposta? Essa ação não pode ser desfeita.” Foi solicitada confirmação específica ao usuário. Na chamada seguinte tentou-se dispensar o diálogo se ainda estivesse aberto. A listagem já retornou vazia e a página pública passou a informar “Proposta não encontrada”. Não há evidência suficiente para atribuir a causa à aplicação, ao controle do diálogo ou à interação humana concorrente.

O usuário respondeu “Manter por enquanto”. A proposta foi recriada e confirmada na listagem como `TESTE CODEX 1309 — Proposta com imagens`.

Possível registro relacionado: a primeira ativação do link criou ou associou “Cliente fictício de auditoria”, pois a indicação de novo cliente desapareceu após gerar o link. Conferir em Clientes antes de concluir limpeza. Nenhum registro existente do usuário foi deliberadamente alterado.

## Pendências

- Concluir testes dos demais módulos: projetos/recursos, clientes, financeiro, leads/funil, tarefas, equipe, equipamentos, ferramentas manuais, agenda e preferências reversíveis.
- Validar exportação PDF, formatos de upload adicionais, substituição/remoção de imagens e limites de slots.
- Separar ações comprovadas, tentadas e bloqueadas no relatório final.

## Implicações para Project Lab

- Editor de proposta com capa, fundo, logos, portfólio, colunas e entregáveis dinâmicos, prévia reativa e cor própria.
- Salvamento com confirmação visível e retorno consistente à lista.
- Link público com expiração configurável e opção de proteção, sem dependência de IA.
- Exclusão deve oferecer recuperação e confirmação inequívoca.
- Upload manual não exige API de geração de imagens; armazenamento e hospedagem ainda precisam de arquitetura e limites definidos.
