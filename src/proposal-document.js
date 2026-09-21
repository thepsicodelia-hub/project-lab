import {
  proposalSchema,
  proposalTotal,
  safeWebsite,
  safeEmail,
  safeImage,
} from "./proposal-data.js";
import { proposalFont } from "./proposal-font.js";
import { proposalTheme } from "./proposal-theme.js";

const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const paragraphs = (value) => escape(value).replace(/\n/g, "<br>");
const photo = (src, alt, cls = "") =>
  safeImage(src)
    ? `<img class="${cls}" src="${src}" alt="${escape(alt)}">`
    : "";

function accentInk(hex) {
  const rgb = hex
    .slice(1)
    .match(/../g)
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2] > 0.179
    ? "#000"
    : "#fff";
}

/** Standalone, script-free document shared by preview, HTML export and printing. */
export function proposalDocument(raw, workspace = "Meu estúdio") {
  const p = proposalSchema.parse(raw),
    e = escape;
  const money = (value) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: p.currency,
    }).format(value);
  const site = safeWebsite(p.website),
    email = safeEmail(p.commercialEmail);
  const deliveries = p.deliverables.filter((d) => d.name.trim());
  const timeline = p.timeline.filter((d) => d.title.trim());
  const items = p.investment.filter(
    (i) => i.title || i.description || i.amount,
  );
  const contact = email ? `mailto:${email}` : site;
  const logo =
    photo(p.coverLogo, workspace, "brand-logo") ||
    `<span class="wordmark">${e(workspace)}</span>`;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${e(p.name)} — ${e(workspace)}</title><style>
  @font-face{font-family:Manrope;src:url('${proposalFont}') format('woff2');font-weight:200 800;font-display:swap}
  :root{--accent:${p.accent};--accent-ink:${accentInk(p.accent)};--scale:${p.textScale};--cover-position:${p.coverPosition}%;--cover-shade:${p.coverShade / 100};--logo-size:${p.logoSize}px}
  ${proposalTheme}
  </style></head><body><main>
  <section class="hero" id="capa">
    ${photo(p.coverImage, "", "backdrop")}
    <header class="document-header"><a class="brand" href="#capa" aria-label="${e(workspace)} — início">${logo}</a><nav aria-label="Proposta"><a href="#escopo">O projeto</a>${deliveries.length ? '<a href="#entregas">Entregas</a>' : ""}<a href="#investimento">Investimento</a></nav></header>
    <div class="hero-copy"><span class="project-badge"><i aria-hidden="true"></i>${e(p.badge)}</span><h1>${paragraphs(p.headline || p.name)}</h1>${p.subtitle ? `<p class="subtitle">${paragraphs(p.subtitle)}</p>` : ""}</div>
    <div class="hero-bottom"><div><span>Preparada para</span><strong>${e(p.client || "Seu próximo projeto")}</strong></div>${p.projectType ? `<div><span>Projeto</span><strong>${e(p.projectType)}</strong></div>` : ""}${p.period ? `<div><span>Apresentação</span><strong>${e(p.period)}</strong></div>` : ""}<a href="#escopo" class="continue" aria-label="Conhecer o projeto">↓</a></div>
  </section>
  <section class="scope page-section" id="escopo"><div class="scope-intro"><h2>${paragraphs(p.introTitle || "Da ideia à realização.")}</h2><div>${p.objective ? `<p class="lead">${paragraphs(p.objective)}</p>` : ""}${p.scope ? `<p class="scope-description">${paragraphs(p.scope)}</p>` : ""}</div></div>
    ${p.team || p.days ? `<div class="production-meta">${p.team ? `<span><small>Equipe</small>${e(p.team)}</span>` : ""}${p.days ? `<span><small>Captação</small>${p.days} diária${p.days === 1 ? "" : "s"}</span>` : ""}</div>` : ""}
    ${deliveries.length ? `<div class="deliverables" id="entregas"><div class="section-label"><h3>O que vamos entregar</h3><span>${String(deliveries.length).padStart(2, "0")} entregas</span></div><ol>${deliveries.map((d) => `<li><strong>${e(d.name)}</strong><span>${e(d.deadline)}</span><span class="delivery-arrow" aria-hidden="true">↗</span></li>`).join("")}</ol></div>` : ""}
  </section>
  ${timeline.length ? `<section class="timeline-section page-section" id="cronograma"><div class="section-label"><h2>Do primeiro encontro<br>ao último detalhe.</h2><p>O caminho do projeto</p></div><ol class="timeline">${timeline.map((d, i) => `<li><span class="step-index">${String(i + 1).padStart(2, "0")}</span><h3>${e(d.title)}</h3><p>${paragraphs(d.description)}</p></li>`).join("")}</ol></section>` : ""}
  <section class="investment page-section" id="investimento"><div class="investment-layout"><div class="investment-total"><span class="investment-label">Investimento no projeto</span><div class="price">${money(proposalTotal(p))}</div>${p.payment ? `<p class="payment">${paragraphs(p.payment)}</p>` : ""}${contact ? `<a class="contact-cta" href="${e(contact)}" ${!email ? 'target="_blank" rel="noopener noreferrer"' : ""}>Vamos conversar <span aria-hidden="true">↗</span></a>` : ""}</div><div class="investment-items">${items.map((i) => `<div class="investment-item"><div><h3>${e(i.title)}</h3>${i.description ? `<p>${paragraphs(i.description)}</p>` : ""}</div>${p.calculateTotal || i.amount ? `<strong>${money(i.amount)}</strong>` : ""}</div>`).join("")}</div></div>${p.terms ? `<details class="terms" open><summary>Condições do projeto</summary><p>${paragraphs(p.terms)}</p></details>` : ""}</section>
  <section class="studio page-section" id="estudio"><div class="studio-intro"><div>${photo(p.studioLogo, workspace, "studio-logo") || `<h2>${e(workspace)}</h2>`}<p class="studio-signoff">Boas histórias começam<br>com uma boa conversa.</p></div>${p.about ? `<p>${paragraphs(p.about)}</p>` : ""}</div>${p.clientLogos.length ? `<div class="logos" aria-label="Clientes">${p.clientLogos.map((src, i) => photo(src, `Cliente ${i + 1}`)).join("")}</div>` : ""}${p.portfolio.length ? `<div class="portfolio">${p.portfolio.map((src, i) => photo(src, `Projeto do portfólio ${i + 1}`)).join("")}</div>` : ""}</section>
  <footer><span>${e(workspace)} <span class="footer-dot">·</span> ${e(p.name)}</span><div>${email ? `<a href="mailto:${e(email)}">${e(email)}</a>` : ""}${site ? `<a href="${e(site)}" target="_blank" rel="noopener noreferrer">Nosso site ↗</a>` : ""}</div></footer>
  </main></body></html>`;
}
