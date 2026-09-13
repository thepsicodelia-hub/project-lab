# Project Lab — começar aqui no outro computador

> Atualização de 13/09/2026: as instruções V1 abaixo são históricas. O projeto agora usa Vite e dependências npm. Siga LEIA-ME.md (`npm ci`, `npm run dev`); não abra `index.html` diretamente. Login/Supabase foram preparados no código, mas não configurados nem publicados. Imagens das ferramentas agora podem ser salvas, há importação de backup e a identidade foi repaginada com Impeccable, Emil e UI/UX Polish. Refero foi explicitamente excluído pelo usuário.

Pacote de continuidade preparado em 11/09/2026.

## Abrir a página

1. Extraia todo o ZIP para uma pasta no outro computador.
2. Abra `index.html` no navegador. Mantenha `app.js` e `styles.css` ao lado dele.
3. Para continuar o desenvolvimento no Codex, abra a pasta extraída como projeto.

Não é necessário instalar pacotes para abrir a página. Ela usa HTML, CSS e JavaScript locais, sem etapa de compilação. Como alternativa, se houver Node.js instalado, execute `node preview.mjs` na pasta e acesse http://127.0.0.1:4173. Esse endereço se refere ao computador onde o comando está rodando; não é um site publicado.

## Retomar o trabalho com outro assistente

Copie este pedido para a nova conversa:

> Continue este projeto a partir da pasta atual. Leia CONTINUAR-EM-OUTRO-PC.md, LEIA-ME.md, DIRECAO-VISUAL.md, VALIDACAO-VISUAL.md e LEVANTAMENTO-FLOOW-PROJECT-LAB.md antes de propor mudanças. O Project Lab é uma prévia visual navegável de gestão de produção audiovisual, inspirada na lógica da Floow Studio e com identidade própria azul/grafite. Primeiro vamos revisar e evoluir o visual; o processo de repositório GitHub, distribuição por clone e armazenamento compartilhado virá depois. Preserve o que já foi construído e aguarde minha indicação sobre a próxima alteração. Não trate a prévia como um sistema completo nem diga que os dados já sincronizam com o GitHub.

## Objetivo e decisões do usuário

- Sistema para produtoras: projetos, clientes, equipe, tarefas, agenda, comercial, financeiro, objetivos, equipamentos e ferramentas de produção.
- Nome originalmente definido: **Project Lab**, mantido na versão atual. Posteriormente o usuário mencionou “Lab Studio, uma coisa assim”, sem confirmar uma renomeação. Confirmar somente se ele voltar a pedir mudança de nome.
- Visual próprio em azul, usando a organização funcional da Floow como referência.
- Excluir automações de WhatsApp e login de usuários da primeira versão.
- Primeiro montar e revisar a página; depois preparar GitHub e distribuição.
- Futuramente cada produtora deve poder ter seu próprio repositório/sistema, com mais de uma pessoa trabalhando e alterações compartilhadas automaticamente.
- Foi explicado que publicar arquivos HTML no GitHub não faz os dados digitados voltarem automaticamente ao repositório. A solução de gravação, autenticação/autorização e conflitos entre editores ainda precisa ser arquitetada. Não há decisão aprovada sobre banco de dados ou uso da API do GitHub.

## Estado entregue

A prévia visual contém 11 módulos principais e configurações, dados fictícios, navegação, formulários locais, busca, tema claro/escuro e layouts responsivos. Existem cálculos e editores simplificados para demonstrar a experiência. Não é uma reprodução funcional integral da plataforma original.

O servidor opcional `preview.mjs` serve somente os três arquivos da aplicação em 127.0.0.1:4173; não salva dados e não expõe uma API. Não há repositório Git criado, publicação, backend, integração IA ou sincronização.

O levantamento da Floow foi feito na sessão autenticada do teste do usuário. A conta estava vazia. Telas que exigiam registros salvos, fórmulas e exportações não foram integralmente verificadas. Todas as limitações estão no levantamento e no registro de validação.

## Dados do navegador não viajam neste ZIP

O pacote contém código, exemplos iniciais e documentação. Não contém uma cópia do armazenamento local do navegador.

Se você cadastrou dados após a entrega, antes de sair do computador original abra **Configurações → Exportar dados da prévia** e leve também o JSON baixado. A versão atual ainda não tem botão de importar JSON. Para restaurar esse backup no novo computador, a importação precisará ser implementada ou conduzida pelo assistente com o arquivo fornecido. Não use “Restaurar demonstração” para recuperar um backup: esse botão volta aos exemplos iniciais.

A chave local é `project-lab-visual-v1`. Navegadores e endereços diferentes possuem armazenamentos separados. Abrir por `file://` ou por `http://127.0.0.1:4173` pode mostrar conjuntos diferentes. Moodboard e storyboard são temporários e não entram nesse backup.

## Referências de acabamento

Foram aplicadas orientações de tipografia/acessibilidade da skill Refero Design em modo fallback, pois a consulta online retornou assinatura indisponível. O usuário também indicou suas skills locais em `Agent Lab/Skills/SKILLS PARA HTML`; foram consultadas UI POLISH e emilkowalski-design para revisão responsiva e feedback discreto.

Essas skills não são dependências de execução da página e não precisam estar instaladas no outro PC para abrir ou editar o projeto. O resumo das decisões relevantes está em DIRECAO-VISUAL.md. Não presumir que os caminhos antigos de skills existam na nova máquina.

## Próximas etapas possíveis — ainda não executadas

1. Receber feedback sobre o visual e ajustar apenas o que for solicitado.
2. Detalhar regras e funções por módulo, distinguindo simulação visual de implementação real.
3. Implementar importação/backup e decidir o modelo de dados.
4. Definir gravação compartilhada, permissões e conflitos de edição.
5. Preparar repositório, documentação de clone/template e publicação conforme a solução aprovada.

O pacote não inclui credenciais, cookies ou sessão autenticada da Floow.
