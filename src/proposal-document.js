import {
  proposalSchema,
  safeWebsite,
  safeEmail,
  safeImage,
} from "./proposal-data.js";
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

export function proposalDocument(raw, workspace = "Meu estúdio") {
  const p = proposalSchema.parse(raw),
    e = escape;
  const price = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: p.currency,
  }).format(p.value);
  const site = safeWebsite(p.website),
    email = safeEmail(p.commercialEmail);
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(p.name)} — ${e(workspace)}</title><style>
  :root{--accent:${p.accent};color-scheme:light}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#f4f6fa;color:#172030;font:${16 * p.textScale}px/1.7 system-ui,sans-serif}a{color:inherit}header{padding:20px 7%;display:flex;justify-content:space-between;gap:20px;align-items:center;border-bottom:1px solid #dce1ea;background:white}nav{display:flex;gap:20px;font-size:.8em}nav a{text-decoration:none}main{max-width:1200px;margin:auto}section{padding:64px 8%;scroll-margin:20px}h1,h2,h3,p{margin:0}h1{font-size:clamp(2.3em,6vw,4em);line-height:1.08;letter-spacing:-.04em;max-width:16ch;overflow-wrap:anywhere}h2{font-size:2em;letter-spacing:-.03em;line-height:1.2;margin-bottom:24px}h3{line-height:1.3;margin-bottom:12px}p{max-width:70ch}small{color:#536077}.hero{position:relative;isolation:isolate;background:#101827;color:white;min-height:470px;display:flex;flex-direction:column;justify-content:center;gap:24px}.hero>img.backdrop{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2}.hero:has(.backdrop):after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,#0b1220ed,#0b122075);z-index:-1}.hero .logo{max-width:190px;max-height:70px;object-fit:contain;object-position:left}.hero small{color:#dce4f0}.hero .tag{font-size:.8em;font-weight:600}.section-top{display:flex;justify-content:space-between;gap:24px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:32px}.scope{background:white}.meta{margin-top:28px;display:flex;gap:32px}.meta span{display:block;color:#536077;font-size:.85em}.deliverables{padding:0;list-style:none}.deliverables li{display:flex;justify-content:space-between;gap:24px;padding:18px 0;border-bottom:1px solid #dce1ea}.investment{background:#101827;color:#fff}.investment .price{font-size:2.8em;font-weight:650;letter-spacing:-.04em;white-space:normal}.investment .columns{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:24px;margin:36px 0;padding:28px 0;border-block:1px solid #ffffff30}.investment h3{color:color-mix(in srgb,var(--accent),white 45%)}.investment small{color:#c2cede}.portfolio{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:24px}.portfolio img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:12px}.portfolio img:first-child:last-child{grid-column:1/-1;aspect-ratio:16/9}.logos{display:flex;align-items:center;gap:28px;flex-wrap:wrap;margin-top:36px}.logos img{height:${p.logoSize}px;width:auto;max-width:160px;object-fit:contain}.studio-logo{max-height:80px;max-width:220px;object-fit:contain;margin-bottom:24px}.accent-rule{width:48px;height:5px;background:var(--accent);margin-bottom:20px;border-radius:4px}footer{padding:40px 8%;background:#e7ecf4;display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}.contact{display:flex;gap:20px;flex-wrap:wrap}a:focus-visible{outline:3px solid var(--accent);outline-offset:5px}@media(max-width:600px){header{padding:16px 6%}nav{gap:12px}section{padding:36px 6%}.grid,.portfolio{grid-template-columns:1fr}.hero{min-height:400px}.investment .price{font-size:2.1em}.meta{flex-wrap:wrap}.deliverables li{flex-direction:column;gap:4px}}@media print{body{background:white;font-size:11pt}nav{display:none}section{padding:28px 5%;break-inside:avoid}.hero{min-height:330px}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}footer{break-inside:avoid}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
  </style></head><body><header><strong>${e(workspace)}</strong><nav aria-label="Proposta"><a href="#escopo">Escopo</a><a href="#investimento">Investimento</a><a href="#estudio">Estúdio</a></nav></header><main>
  <section class="hero">${photo(p.coverImage, "", "backdrop")}${photo(p.coverLogo, workspace, "logo")}<span class="tag">${e(p.badge)}</span><h1>${e(p.name)}</h1><p>${paragraphs(p.subtitle)}</p><small>Preparada para ${e(p.client || "seu próximo projeto")}</small></section>
  <section id="escopo" class="scope"><div class="accent-rule"></div><h2>Da ideia à realização.</h2><div class="grid"><div><h3>O objetivo</h3><p>${paragraphs(p.objective || "Descreva o desafio e o resultado que vamos construir juntos.")}</p></div><div><h3>O que vamos fazer</h3><p>${paragraphs(p.scope || "Defina as etapas, os formatos e os limites desta produção.")}</p><div class="meta"><div><span>Equipe</span>${e(p.team || "A definir")}</div><div><span>Captação</span>${p.days} diária${p.days === 1 ? "" : "s"}</div></div></div></div>
  ${
    p.deliverables.some((d) => d.name)
      ? `<h3 style="margin-top:40px">Entregáveis</h3><ul class="deliverables">${p.deliverables
          .filter((d) => d.name)
          .map(
            (d) =>
              `<li><strong>${e(d.name)}</strong><small>${e(d.deadline)}</small></li>`,
          )
          .join("")}</ul>`
      : ""
  }</section>
  <section id="investimento" class="investment"><h2>Investimento no projeto</h2><div class="price">${price}</div><div class="columns">${p.investment
    .filter((i) => i.title || i.description)
    .map(
      (i) =>
        `<div><h3>${e(i.title)}</h3><p>${paragraphs(i.description)}</p></div>`,
    )
    .join(
      "",
    )}</div><h3>Condições de pagamento</h3><p>${paragraphs(p.payment)}</p>${p.terms ? `<div style="margin-top:28px"><small>${paragraphs(p.terms)}</small></div>` : ""}</section>
  <section id="estudio">${photo(p.studioLogo, workspace, "studio-logo")}<h2>${e(workspace)}</h2><p>${paragraphs(p.about)}</p>${p.clientLogos.length ? `<div class="logos" aria-label="Clientes">${p.clientLogos.map((src, i) => photo(src, `Cliente ${i + 1}`)).join("")}</div>` : ""}${p.portfolio.length ? `<h3 style="margin-top:40px">Histórias que já criamos</h3><div class="portfolio">${p.portfolio.map((src, i) => photo(src, `Projeto do portfólio ${i + 1}`)).join("")}</div>` : ""}</section></main>
  <footer><strong>Vamos criar juntos?</strong><div class="contact">${email ? `<a href="mailto:${e(email)}">${e(email)}</a>` : ""}${site ? `<a href="${e(site)}" target="_blank" rel="noopener noreferrer">Visite nosso site</a>` : ""}</div></footer></body></html>`;
}
