# Project Lab — levantamento da referência Floow Studio

Data: 10/09/2026. Fonte: https://www.floowstudio.com.br/

## Escopo solicitado

Estudar primeiro o funcionamento da plataforma para depois arquitetar um HTML chamado **Project Lab**. Preservar as funções úteis da referência, excluindo login de usuários e automações de WhatsApp. Nenhum HTML foi implementado nesta etapa.

## Método e limites

Inspeção da sessão autenticada já aberta no Chrome: navegação pelos 11 módulos principais, subabas, formulários vazios e editores acessíveis, além das configurações relevantes. Leitura do conteúdo da interface e inspeção visual pontual. Não houve cadastro ou salvamento deliberado de projetos, leads, receitas, custos, fornecedores, equipamentos ou documentos. Não foram enviados convites/mensagens, conectadas integrações ou acionadas gerações de IA.

A conta estava sem registros de trabalho. Portanto, este é um inventário de interfaces e fluxos acessíveis, não uma validação funcional integral. Não foram verificados cálculos com dados reais, persistência, arrastar registros, exportações efetivas, hub de projeto existente, ficha completa de cliente ou edição interna de storyboard salvo. As etapas Financeiro e Recursos de Novo Projeto estavam desabilitadas enquanto os campos obrigatórios não estavam preenchidos. Não foram inspecionadas operações de conta/assinatura sem relevância para o HTML.

## 1. Dashboard

- Faturamento mensal, faturamento anual e projetos ativos.
- Mission Control: meta do mês, faturado, restante e percentual atingido.
- Próximos compromissos em 15 dias.
- Até cinco widgets; o texto da interface informa que a ordem dos cliques define a posição.
- Oito opções: faturamento por tag; projetos concluídos no mês; próximos pagamentos/entregas; metas do mês; calendário; relógio/data; conversão de propostas; ticket médio do mês.
- Botão de novidades.

## 2. Projetos

- Quadro Clientes & Produção, busca, filtro anual e por mês.
- Etapas iniciais: Pré-produção, Captação, Em Edição, Finalizado.
- A interface informa que as colunas podem ser renomeadas e recoloridas.
- Novo Projeto tem três etapas: Informações, Financeiro, Recursos.
- Informações: nome do projeto e cliente obrigatórios; múltiplas datas de captação; contagem de diárias; projeto recorrente/retainer; etapa inicial; data de entrega opcional.
- Retainer é descrito como gerador de parcelas mensais automáticas.
- Há ações Salvar Projeto e Avançar. Etapas posteriores não percorridas por exigirem preenchimento.

## 3. Clientes

- Central de histórico por cliente.
- Busca e filtros Todos, Ativos, Inativos e Sem cadastro.
- Ordenação por maior faturamento, ordem alfabética, último trabalho, adicionados por último e mais projetos.
- Sem clientes disponíveis para inspecionar detalhes ou histórico real.

## 4. Gestão & Faturamento

### Visão Geral

Faturamento, custos, lucro, saldo em caixa, valores a receber, melhor mês, maior receita, cliente mais fiel, evolução mensal e melhores clientes. A descrição da receita mensal faz referência à data de captação; é necessário validar separadamente o critério dos relatórios de caixa.

### Faturamento

- Importar Planilha, seleção de registros, novo faturamento, filtros de ano/mês e ordenação.
- Indicadores mensal, anual e a receber no ano.
- Colunas: projeto, cliente, categoria, valor, datas, status e NF-e. A coluna NF-e não comprova emissão fiscal integrada.
- Novo Faturamento: título/descrição, cliente, categoria, valor, data do pagamento opcional, status e vínculo opcional com projeto.
- Categorias exibidas: Avulso, Cliente Direto, Agência, Governo, Freela.
- Status: Pago, 50% Pago, Pendente.
- A tela distingue lançamento avulso de projeto completo e permite vincular uma segunda parcela a projeto existente.
- Importação não executada; formatos e mapeamento ainda não inspecionados.

### Custos & Despesas

- Separação entre custos variáveis e fixos/recorrentes.
- Indicadores: custos do mês, custos fixos mensais e total anual.
- Novo Custo: descrição, tipo, categoria, vínculo opcional com projeto, valor e data.
- Tipo fixo oferece Recorrente Mensal e Parcelado; existe também custo fixo pontual.
- Não foram testados geração de parcelas ou salvamento.

### Resumo de Lucro

Entradas, saídas, lucro real, margem de lucro e gráfico mensal, com filtros de período.

### Fluxo de Caixa

Saldo de abertura editável, entradas/saídas mensais, saldo do mês e acumulado. Gráfico descrito como barras de movimentação e linha de saldo. Tabela identificada como Demonstrativo Simplificado (DRE). A denominação da referência não comprova equivalência a um demonstrativo contábil formal.

## 5. Comercial

- Subabas: Visão Geral, Prospecção IA, Leads, Funil, Calculadora, Propostas.
- Prospecção IA aparece marcada **em breve**; não foi tratada como funcionalidade operacional confirmada.
- Visão geral: potencial financeiro do pipeline, conversão, leads ativos, aguardando resposta, leads quentes e fila de ações.

### Leads e Funil

- Cadastro: nome obrigatório, empresa, cargo, e-mail, telefone, origem, temperatura, segmento, redes sociais, etapa, título da proposta/projeto, valor estimado e notas.
- Temperaturas: automática pelo status, quente, morno e frio.
- Origens: indicação, LinkedIn, Instagram, site, inbound, outbound, evento, Google Ads, Facebook Ads, Apollo e outros; opção de escrever uma origem.
- Segmentos incluem agência, produtora, educação, saúde, tecnologia, governo e outros.
- Etapas exibidas no formulário e no funil: Esperando Contato, Contatado, Aguardando Resposta, Fechado/Ganho, Recusado/Negado.
- Observação: o resumo comercial também exibe uma categoria Negociação. Não assumir que a estrutura é idêntica em todas as telas sem testar registros.
- Filtros por período, origem e temperatura. Tabela com contato, segmento, status e próximo passo.
- Funil: potencial de ganho, valor convertido, ticket médio e conversão estimada.

### Calculadora de Orçamento

- Simulação independente de um projeto.
- Grupos ativáveis: Serviços de Produção & Execução, Equipamentos Utilizados, Impostos (%) e Custo Fixo/Fee (%).
- Serviço: nome/entregável, quantidade, valor e subtotal.
- Margem desejada em slider e valor final editável.
- Demonstrativo: preço final, custo operacional, impostos e lucro estimado.
- Ação Criar Proposta Web. Fórmula interna e limites da margem não validados numericamente.

### Propostas

- Lista por ano/mês e editor com prévia.
- Identidade/capa: projeto, cliente, e-mail, telefone, badge, descrição, logo, fundo e escala do texto.
- Resumo: objetivo, quantidade de diárias, equipe escalada, escopo e entregáveis com prazos.
- Investimento: valor total e colunas de escopo editáveis/adicionáveis.
- Termos: pagamento e observações/contrato.
- Quem somos: apresentação, logo da produtora, seis logos de clientes e ajuste de tamanho.
- Portfólio: até cinco fotos.
- Encerramento: e-mail comercial e site.
- Cor de destaque e paleta rápida.
- Ações: Salvar Proposta, Gerar Proposta Web, Salvar em PDF e Apagar Proposta.
- Aprovação via link é anunciada, mas não foi publicada nem testada.

## 6. Objetivos

Metas mensal e anual, percentual atingido, faturado e restante. Configurar Metas. Projeção de fechamento do ano e indicador de velocidade de execução. O bloco usa o rótulo IA de Missão, mas a tela não permite concluir se depende de um modelo de IA ou apenas de cálculo determinístico.

## 7. Tarefas

- Planner Semanal com navegação entre semanas e arrastar entre dias, conforme instrução da tela.
- Quadro para tarefas atribuídas ao usuário; as do time ficam em Gestão do Time.
- To-Do List explicitamente independente do quadro, com conclusão por marcação.
- Formulário do planner: título, descrição, dia, horário, cor, cliente/projeto e etapa.
- Etapas sugeridas: Pré-produção, Briefing, Edição, Entrega, Reunião.
- Não presumir que planner, quadro e lista compartilham o mesmo modelo de dados.

## 8. Time

- Central de Tarefas com filtros por membro, agrupamento por status ou membro e criação de tarefa.
- Calendário da Equipe semanal/mensal, filtros por membro e novo compromisso.
- Banco de Fornecedores com busca por nome/função.
- Fornecedor: nome, funções/especialidades múltiplas, WhatsApp e valor da diária.
- Organograma com departamentos, cargos, posições vagas, zoom e criação de departamento/cargo.
- Departamentos iniciais observados: Diretoria, Comercial, Projetos, Captação, Pós-Produção.
- Adaptação possível: manter cadastro de pessoas, funções e responsáveis sem criar contas de acesso.

## 9. Equipamentos

- Inventário, categorias e novo equipamento.
- Indicadores: total investido, total amortizado, lucro total, quantidade de equipamentos e vínculos com trabalhos.
- Cadastro: nome, categoria, status, valor de compra, data de compra opcional e diárias estimadas de uso/vida útil.
- Retorno e amortização anunciados pela interface; fórmula e vínculo por uso não testados.

## 10. Ferramentas

### Calculadora e Propostas

Atalhos para as ferramentas também acessíveis pelo Comercial.

### Roteiros

- Lista e criação em branco ou com Copiloto IA.
- Editor com título, status inicial Rascunho, negrito, itálico, sublinhado, marcadores e destaque.
- Ações Salvar e PDF.
- Copiloto recebe briefing; interface identifica Gemini 2.0 Flash.
- Texto da interface informa salvamento do roteiro gerado e autosave das edições após 2 segundos no Supabase. Isso é uma descrição do produto, não inspeção da implementação.
- Nenhum conteúdo foi escrito ou gerado.

### Moodboard

- Lista e editor com título, salvar e exportar PDF.
- Imagens locais por arrastar, geração de frame com IA e busca de referências via Unsplash API.
- Busca por termo e filtros de cor.
- Não houve upload, busca externa ou geração.

### Storyboard

- Lista e criação com nome obrigatório.
- Editor interno depende de criar um registro; não acessado nesta inspeção.

### Ordem do Dia

- Documento editável com impressão/exportação A4.
- Logo, título/projeto/diária, data, crew call e wrap.
- Locações com nome, endereço e notas; adição/remoção.
- Cronograma com horário, cena/atividade, observações e tag; destaque e novas linhas.
- Equipe escalada com função, nome e campo de identificação.
- Previsão do tempo por endereço/data e horários solares: dependência externa, sem geocodificação acionada.
- A tela carrega conteúdo demonstrativo, não dados reais do usuário.

### Chat & Criação de Imagens

- Chat audiovisual; interface identifica Gemini 2.5 Flash.
- Modo Imagens com prompt, sugestões e formatos 16:9 e 9:16.
- Exibe franquia de créditos de imagens.
- Não foram enviados prompts nem consumidos créditos por geração.

## 11. Agenda

- Calendário mensal, navegação, Hoje e filtros por categorias.
- Categorias iniciais: Captação, Reunião, Entrega, Pagamento.
- A interface permite gerenciar categorias e informa reagendamento por arrastar.
- Novo compromisso: título, data, início, término opcional, cliente, categoria, endereço e observações.
- Conexão com Google Agenda anunciada; não acionada.

## 12. Configurações relevantes

- Time & Workspace: membros, convites e perfis Membro/Gestor, com diferentes acessos. Excluir essa camada no Project Lab.
- Abas Minha conta e Assinatura presentes; operações não inspecionadas por estarem fora do escopo local.
- WhatsApp: número conectado, alteração de número e link para conversar com bot. Não utilizado.
- Aparência: claro/escuro, presets e cor personalizada, cor de fundo independente ou sincronizada, ocultação de itens da barra lateral.
- Moedas Real, Euro e Dólar. A tela declara que muda apenas a apresentação, sem converter os valores.
- Suporte e link flutuante de WhatsApp: elementos da plataforma original, sem utilidade no Project Lab.

## Implicações para a futura arquitetura — ainda não fechada

1. É viável construir a gestão local sem autenticação e sem banco de dados remoto, mas os dados precisam de armazenamento local e backup/exportação/importação.
2. A equipe pode ser um cadastro de pessoas com funções e tarefas, administrado pelo usuário; isso não exige login de cada pessoa.
3. Projetos, receitas, custos, agenda e recursos precisam de vínculos coerentes; telas isoladas não reproduzem o funcionamento integrado.
4. Propostas podem preservar o editor e exportação local. Link público, aprovação remota e portal de cliente exigem outra arquitetura.
5. IA de texto/imagem, busca Unsplash, previsão do tempo e sincronização Google Agenda são dependências externas adicionais ao WhatsApp/login. Não foram automaticamente excluídas pelo pedido; precisam de decisão explícita na arquitetura.
6. Recorrência local deve ser calculada ao abrir/usar a aplicação, sem prometer execução de tarefas com o navegador fechado.
7. O formato final de armazenamento (arquivos de backup, armazenamento do navegador e imagens locais) será escolhido na etapa seguinte.

## Pendências de fidelidade antes de declarar equivalência funcional

- Etapas Financeiro/Recursos e hub de um projeto existente.
- Histórico e ficha detalhada de cliente.
- Editor interno de storyboard após criação.
- Importação de planilhas, formatos e mapeamento.
- Fluxos de tarefa de equipe e detalhes de registros existentes.
- Cálculos com valores de exemplo: recorrência, status parcial, lucro, caixa e amortização.
- Exportação efetiva de PDF, comportamento de arrastar e persistência.

Estas pendências não devem ser preenchidas por suposição nem apresentadas como recursos testados.
