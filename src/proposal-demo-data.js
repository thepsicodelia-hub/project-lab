import { createProposal, proposalSchema } from "./proposal-data.js";

export function createDemoProposal(coverImage) {
  return proposalSchema.parse({
    ...createProposal("projectlab", "BRL"),
    id: "horizonte-demo",
    name: "Vértice — Filme de marca",
    headline: "Um novo\nponto de vista.",
    badge: "Vértice — Filme de marca",
    client: "Vértice",
    projectType: "Filme de marca",
    period: "Setembro de 2026",
    subtitle: "Uma história para revelar o que torna sua marca única.",
    coverImage,
    coverShade: 25,
    introTitle: "Uma ideia.\nUm filme à altura.",
    objective:
      "Traduzir a essência da Vértice em uma narrativa visual que aproxima, inspira e deixa uma impressão. Um filme com direção, sensibilidade e atenção ao que faz a sua marca ser sua.",
    scope:
      "Da primeira conversa à última imagem: conceito criativo, roteiro, produção e finalização. Uma linguagem que conecta o filme principal aos conteúdos da campanha.",
    team: "Direção, fotografia e produção",
    days: 2,
    deliverables: [
      { name: "Filme principal", deadline: "60–90 segundos · 4K" },
      { name: "Cortes para redes", deadline: "3 versões · vertical" },
      { name: "Frames da campanha", deadline: "6 imagens · alta resolução" },
    ],
    timeline: [
      { title: "Alinhamento", description: "Semana 01 · Imersão e conceito" },
      {
        title: "Pré-produção",
        description: "Semana 02 · Roteiro e planejamento",
      },
      { title: "Captação", description: "Semana 03 · Dois dias de filmagem" },
      { title: "Finalização", description: "Semana 04 · Edição, cor e som" },
    ],
    calculateTotal: true,
    value: 18500,
    investment: [
      {
        title: "Pré-produção",
        description: "Conceito, roteiro e planejamento criativo.",
        amount: 3500,
      },
      {
        title: "Produção",
        description: "Equipe, equipamentos e duas diárias de captação.",
        amount: 9000,
      },
      {
        title: "Pós-produção",
        description: "Edição, cor, desenho de som e versões finais.",
        amount: 6000,
      },
    ],
    payment: "50% na aprovação da proposta.\n50% na entrega do projeto.",
    terms:
      "Inclui duas rodadas de ajustes na edição. O cronograma começa após a aprovação do escopo e a confirmação da primeira parcela. Serviços adicionais serão combinados e orçados antes da execução.",
    about:
      "Somos um estúdio que aproxima estratégia e olhar criativo. Da ideia à entrega, construímos imagens com intenção e histórias que fazem sentido para cada marca.",
    website: "https://www.projectlabstudio.com.br/",
  });
}
