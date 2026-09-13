const months = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const currencyFormat = (currency) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency });

export function cashChartData(series, opening = 0) {
  let balance = opening;
  return series.map((row) => {
    balance += row.revenue - row.costs;
    return {
      month: row.month,
      revenue: row.revenue,
      costs: row.costs,
      balance,
    };
  });
}

export function chartGeometry(rows, width = 800, height = 280) {
  const left = width < 460 ? 48 : 66,
    right = 22,
    top = 24,
    bottom = height - 34;
  const values = rows.flatMap((r) => [r.revenue, r.costs, r.balance]);
  const min = Math.min(0, ...values),
    max = Math.max(0, ...values);
  const range = Math.max(100, max - min);
  const step = 10 ** Math.floor(Math.log10(range));
  const ceiling = Math.ceil((max || 100) / step) * step;
  const floor = Math.floor(min / step) * step;
  const span = Math.max(100, ceiling - floor);
  const x = (index) =>
    left + (index / Math.max(1, rows.length - 1)) * (width - left - right);
  const y = (value) => bottom - ((value - floor) / span) * (bottom - top);
  const points = rows.map((row, i) => ({
    x: x(i),
    y: y(row.balance),
    revenueY: y(row.revenue),
    costsY: y(row.costs),
  }));
  return {
    width,
    height,
    left,
    right,
    top,
    bottom,
    zero: y(0),
    floor,
    ceiling,
    points,
    ticks: Array.from({ length: 5 }, (_, i) => ({
      value: floor + (span * i) / 4,
      y: y(floor + (span * i) / 4),
    })),
    path: points
      .map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(" "),
  };
}

export function renderFinanceChart(
  series,
  { year, currency, opening = 0, selectedMonth = 0 },
) {
  const rows = cashChartData(series, opening),
    format = currencyFormat(currency);
  return `<section class="panel finance-chart" data-finance-chart data-series="${escape(JSON.stringify(rows))}" data-currency="${currency}" data-selected="${selectedMonth}">
    <div class="finance-chart-heading"><div><p class="chart-eyebrow">Panorama financeiro · ${year}</p><h2>Seu caixa em perspectiva.</h2><p>Entradas e saídas do mês. A linha conecta o saldo acumulado.</p></div><div class="chart-year-total"><span>Recebido no ano</span><strong>${format.format(rows.reduce((n, r) => n + r.revenue, 0))}</strong></div></div>
    <div class="chart-legend" aria-label="Séries do gráfico"><button type="button" data-chart-series="revenue" aria-pressed="true"><i class="legend-in"></i>Entradas</button><button type="button" data-chart-series="costs" aria-pressed="true"><i class="legend-out"></i>Saídas</button><button type="button" data-chart-series="balance" aria-pressed="true"><i class="legend-balance"></i>Saldo acumulado</button><span>${currency} · por data de pagamento</span></div>
    <div class="chart-canvas"><svg role="img" aria-label="Evolução mensal de entradas, saídas e saldo acumulado. Valores completos na tabela abaixo."></svg></div>
    <div class="chart-selection"><label>Mês em foco<input type="range" min="0" max="11" step="1" value="${selectedMonth}" aria-label="Mês em foco"></label><output class="chart-readout" aria-live="polite"></output></div>
    ${rows.every((r) => !r.revenue && !r.costs) ? '<p class="chart-empty-note">Sem movimentações datadas neste ano. Adicione uma receita ou despesa para acompanhar a evolução.</p>' : ""}
    <details class="chart-data-table"><summary>Consultar valores do gráfico</summary><div class="table-wrap"><table class="data-table"><thead><tr><th>Mês</th><th>Entradas</th><th>Saídas</th><th>Saldo acumulado</th></tr></thead><tbody>${rows.map((r, i) => `<tr><td>${months[i]}</td><td>${format.format(r.revenue)}</td><td>${format.format(r.costs)}</td><td>${format.format(r.balance)}</td></tr>`).join("")}</tbody></table></div></details>
  </section>`;
}

/** SVG remains visible without motion; reveal animations are transient enhancements. */
export function bindFinanceChart(
  root,
  { animate = false, reducedMotion = false } = {},
) {
  const chart = root.querySelector("[data-finance-chart]");
  if (!chart) return () => {};
  const rows = JSON.parse(chart.dataset.series),
    format = currencyFormat(chart.dataset.currency);
  const compact = new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const canvas = chart.querySelector(".chart-canvas"),
    svg = canvas.querySelector("svg");
  const range = chart.querySelector("input[type=range]"),
    output = chart.querySelector("output");
  let selected = Math.min(11, Math.max(0, Number(chart.dataset.selected))),
    geometry;
  const visibility = { revenue: true, costs: true, balance: true };
  function select(index, announce = true) {
    selected = Math.min(rows.length - 1, Math.max(0, index));
    const point = geometry.points[selected],
      row = rows[selected];
    svg
      .querySelector(".chart-guide")
      .setAttribute("transform", `translate(${point.x} 0)`);
    svg.querySelector(".chart-balance-dot").setAttribute("cx", point.x);
    svg.querySelector(".chart-balance-dot").setAttribute("cy", point.y);
    svg
      .querySelectorAll("[data-point-month]")
      .forEach((el) =>
        el.classList.toggle(
          "selected",
          Number(el.dataset.pointMonth) === selected,
        ),
      );
    range.value = selected;
    range.setAttribute(
      "aria-valuetext",
      `${months[selected]}: entradas ${format.format(row.revenue)}, saídas ${format.format(row.costs)}, saldo ${format.format(row.balance)}`,
    );
    output.setAttribute("aria-live", announce ? "polite" : "off");
    output.innerHTML = `<strong>${months[selected]}</strong><span>Entradas <b>${format.format(row.revenue)}</b></span><span>Saídas <b>${format.format(row.costs)}</b></span><span>Saldo <b>${format.format(row.balance)}</b></span>`;
  }
  function draw() {
    geometry = chartGeometry(rows, Math.max(260, canvas.clientWidth));
    const g = geometry,
      barWidth = Math.max(3, Math.min(13, (g.width - g.left - g.right) / 40));
    svg.setAttribute("viewBox", `0 0 ${g.width} ${g.height}`);
    svg.innerHTML = `${g.ticks.map((t) => `<g class="chart-grid"><line x1="${g.left}" x2="${g.width - g.right}" y1="${t.y}" y2="${t.y}"/><text x="${g.left - 12}" y="${t.y + 4}" text-anchor="end">${compact.format(t.value)}</text></g>`).join("")}
      <line class="chart-zero" x1="${g.left}" x2="${g.width - g.right}" y1="${g.zero}" y2="${g.zero}"/>
      <g data-layer="revenue">${g.points.map((p, i) => `<rect class="chart-bar chart-in" data-point-month="${i}" x="${p.x - barWidth - 2}" y="${p.revenueY}" width="${barWidth}" height="${Math.max(0, g.zero - p.revenueY)}" rx="2"/>`).join("")}</g>
      <g data-layer="costs">${g.points.map((p, i) => `<rect class="chart-bar chart-out" data-point-month="${i}" x="${p.x + 2}" y="${p.costsY}" width="${barWidth}" height="${Math.max(0, g.zero - p.costsY)}" rx="2"/>`).join("")}</g>
      <g data-layer="balance"><path class="chart-balance" pathLength="1000" d="${g.path}"/>${g.points.map((p) => `<circle class="chart-node" cx="${p.x}" cy="${p.y}" r="3"/>`).join("")}<circle class="chart-balance-dot" r="5"/></g>
      <g class="chart-guide"><line y1="${g.top - 6}" y2="${g.bottom}"/><rect x="-20" y="${g.bottom + 10}" width="40" height="22" rx="6"/></g>
      ${g.points.map((p, i) => `<text class="chart-month" data-point-month="${i}" x="${p.x}" y="${g.bottom + 25}" text-anchor="middle" ${g.width < 500 && i % 2 && i !== 11 ? 'style="display:none"' : ""}>${months[i]}</text>`).join("")}`;
    Object.entries(visibility).forEach(
      ([key, visible]) =>
        (svg.querySelector(`[data-layer="${key}"]`).style.display = visible
          ? ""
          : "none"),
    );
    select(selected, false);
  }
  draw();
  if (animate && !reducedMotion) {
    svg.querySelector(".chart-balance").animate(
      [
        { strokeDasharray: "1000", strokeDashoffset: "1000" },
        { strokeDasharray: "1000", strokeDashoffset: "0" },
      ],
      { duration: 700, easing: "cubic-bezier(.22,1,.36,1)" },
    );
    svg.querySelectorAll(".chart-bar").forEach((el) => {
      el.style.transformBox = "fill-box";
      el.style.transformOrigin = "bottom";
      el.animate(
        [
          { transform: "scaleY(.05)", opacity: 0.4 },
          { transform: "scaleY(1)", opacity: 1 },
        ],
        { duration: 440, easing: "cubic-bezier(.22,1,.36,1)" },
      );
    });
  }
  range.oninput = () => select(Number(range.value));
  canvas.onpointermove = (event) => {
    if (event.pointerType !== "mouse") return;
    const rect = canvas.getBoundingClientRect();
    select(
      Math.round(
        ((event.clientX - rect.left - geometry.left) /
          (geometry.width - geometry.left - geometry.right)) *
          (rows.length - 1),
      ),
      false,
    );
  };
  canvas.onclick = (event) => {
    const rect = canvas.getBoundingClientRect();
    select(
      Math.round(
        ((event.clientX - rect.left - geometry.left) /
          (geometry.width - geometry.left - geometry.right)) *
          (rows.length - 1),
      ),
    );
  };
  chart.querySelectorAll("[data-chart-series]").forEach(
    (button) =>
      (button.onclick = () => {
        const key = button.dataset.chartSeries;
        visibility[key] = !visibility[key];
        button.setAttribute("aria-pressed", String(visibility[key]));
        svg.querySelector(`[data-layer="${key}"]`).style.display = visibility[
          key
        ]
          ? ""
          : "none";
      }),
  );
  let previousWidth = canvas.clientWidth;
  const observer = new ResizeObserver(() => {
    if (canvas.clientWidth !== previousWidth) {
      previousWidth = canvas.clientWidth;
      draw();
    }
  });
  observer.observe(canvas);
  return () => observer.disconnect();
}
