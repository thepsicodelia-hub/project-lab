# Project Lab — Studio Edition

Sistema de gestão de produção audiovisual. Visual repaginado em 13/09/2026 com identidade própria, usando a auditoria da Floow como referência funcional.

## Abrir corretamente

Use Node.js 22.12 ou superior. Na pasta do projeto:

```sh
npm ci
npm run dev
```

Abra http://127.0.0.1:4173 e escolha **Explorar demonstração**. Não abra `index.html` ou `tests/visual.html` diretamente pelo Finder: a aplicação precisa do servidor Vite. O antigo `preview.mjs` é da V1 e não serve esta versão.

Para verificar o código: `npm test`. Para gerar os arquivos de publicação: `npm run build` (saída em `dist`). O endereço local funciona somente neste computador; não significa que o site está publicado.

## Visual e funções atuais

- Geist e Geist Mono variáveis locais, menu flutuante, painel de metas com dados reais, agenda e cards de projetos com capas gráficas próprias.
- 12 páginas, tema claro/escuro, cor personalizável, layouts responsivos e motion curto com suporte a movimento reduzido.
- Projetos com tarefas, entregas, comentários internos, materiais, horas e financeiro; clientes, agenda, equipe, fornecedores e organização.
- Comercial com propostas editáveis: imagens, logos, portfólio, escopo, entregáveis, valores e identidade própria. Prévia, exportação HTML, impressão pelo navegador e conversão para oportunidade/projeto.
- Equipamentos com uso por projeto, amortização diária e receita atribuída.
- Roteiros, ordens do dia, moodboard e storyboard salvos; ferramentas manuais, sem IA ou APIs pagas.

## Dados e limites

A demonstração salva neste navegador, na chave `project-lab-demo-v2`. Endereços, portas e navegadores diferentes têm dados separados. O GitHub não recebe automaticamente os cadastros.

Use **Configurações → Exportar backup** antes de trocar de computador ou limpar os dados do navegador. A importação de JSON está implementada. Restaurar demonstração substitui os registros pelos exemplos, após confirmação.

Imagens JPG/PNG/WebP são compactadas no navegador e entram no backup. O limite atual é **1 MB por estúdio**, incluindo imagens e demais registros. Arquivos grandes e vídeos devem ficar no armazenamento externo escolhido pelo usuário. Esta arquitetura ainda requer evolução para uso intensivo de mídia.

Login, cadastro, estúdios, permissões e controle de concorrência têm implementação Supabase e migração em `supabase/migrations`. A conexão **não está configurada**, não foi validada com uma conta real nem publicada. `.env.example` descreve a configuração; nunca coloque segredos de servidor no frontend ou no GitHub.

Propostas HTML exportadas são arquivos, não links públicos hospedados. Comentários e revisões de entregas são internos; não há portal público de aprovação, assinatura, envio automático ou cobrança de mensalidades. Impressão/PDF usa o navegador. Nenhuma contratação paga foi feita.

## Referências

- `VALIDACAO-VISUAL.md`: verificações e limites de teste.
- `GUIA-VISUAL-PROJECT-LAB.md`: direção e atualização visual implementada.
- `AUDITORIA-FLOOW-2026-09-13.md`: evidências da referência.
- `PRODUCT.md`: contexto de produto e decisões atuais.
