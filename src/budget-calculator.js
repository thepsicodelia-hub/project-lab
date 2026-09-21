const defaults = { services: 6000, rental: 1800, tax: 6, margin: 30 };

export function calculateBudget({ services, rental, tax, margin }) {
  if ([services, rental, tax, margin].some((n) => !Number.isFinite(n) || n < 0))
    return {
      error: "Preencha os campos com valores iguais ou maiores que zero.",
    };
  if (tax + margin >= 100)
    return { error: "Impostos e margem precisam somar menos de 100%." };
  const cost = services + rental;
  const total = cost / (1 - (tax + margin) / 100);
  if (!Number.isFinite(total))
    return {
      error: "Os valores ultrapassam o limite do cálculo. Revise os custos.",
    };
  return {
    cost,
    total,
    taxes: total * (tax / 100),
    profit: total * (margin / 100),
  };
}

export function openBudgetCalculator({
  openModal,
  money,
  currency,
  icon,
  toast,
}) {
  const currencyMark = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  })
    .formatToParts(0)
    .find((part) => part.type === "currency").value;
  const costField = (name, label, hint) =>
    `<label class="bc-field" for="bc-${name}"><span>${label}</span><span class="bc-input-wrap"><span aria-hidden="true">${currencyMark}</span><input id="bc-${name}" name="${name}" type="number" inputmode="decimal" min="0" step="0.01" value="${defaults[name]}" required aria-describedby="bc-${name}-hint bc-error"></span><small id="bc-${name}-hint">${hint}</small></label>`;
  const rateField = (name, label) =>
    `<label class="bc-field bc-rate" for="bc-${name}"><span>${label}</span><span class="bc-input-wrap"><input id="bc-${name}" name="${name}" type="number" inputmode="decimal" min="0" max="99.9" step="0.1" value="${defaults[name]}" required aria-describedby="bc-rate-hint bc-error"><span aria-hidden="true">%</span></span></label>`;
  openModal(
    "Calculadora de orçamento",
    `<div class="budget-calculator">
    <div class="bc-layout">
      <form class="bc-form" id="budget-form" novalidate>
        <div class="bc-intro"><h3>Um preço que faz sentido.</h3><p>Ajuste os custos e veja quanto cobrar pelo projeto.</p></div>
        <fieldset class="bc-costs"><legend>${icon("camera")}Custos do projeto</legend>
          ${costField("services", "Serviços de produção", "Equipe, captação e pós-produção.")}
          ${costField("rental", "Equipamentos e locação", "Inclua aluguéis e estrutura para produzir.")}
        </fieldset>
        <fieldset class="bc-rates"><legend>${icon("settings")}Impostos e margem</legend>
          <div class="bc-rate-grid">${rateField("tax", "Impostos")}${rateField("margin", "Margem desejada")}</div>
          <input class="bc-slider" type="range" min="0" max="99.9" step="0.1" value="30" aria-label="Ajustar margem desejada" aria-describedby="bc-rate-hint" id="bc-margin-slider">
          <div class="bc-presets"><span>Simular margem</span>${[20, 30, 40].map((n) => `<button type="button" data-budget-margin="${n}" aria-label="Usar margem de ${n}%" aria-pressed="${n === 30}">${n}%</button>`).join("")}</div>
          <p id="bc-rate-hint" class="bc-help">Percentuais sobre o preço de venda, já incluindo os custos.</p>
        </fieldset>
        <button class="bc-reset" type="reset">${icon("tools")}Restaurar valores iniciais</button>
      </form>
      <section class="bc-summary" aria-label="Resultado do orçamento">
        <div class="bc-summary-heading"><h3>Resumo do orçamento</h3><span class="bc-live"><i></i>Em tempo real</span></div>
        <div class="bc-price"><span>Preço sugerido</span><output id="bc-total" aria-label="Preço sugerido" aria-live="off" for="bc-services bc-rental bc-tax bc-margin"></output><p id="bc-price-note">Custos cobertos. Margem incluída.</p></div>
        <div class="bc-composition"><h4>Como o preço se divide</h4><div class="bc-bar" aria-hidden="true"><span data-budget-part="cost"></span><span data-budget-part="tax"></span><span data-budget-part="margin"></span></div>
          <dl class="bc-breakdown"><div><dt><i class="bc-dot bc-dot-cost"></i>Custos do projeto</dt><dd id="bc-cost"></dd></div><div><dt><i class="bc-dot bc-dot-tax"></i>Impostos <span id="bc-tax-label"></span></dt><dd id="bc-taxes"></dd></div><div class="bc-profit"><dt><i class="bc-dot bc-dot-margin"></i>Resultado estimado <span id="bc-margin-label"></span></dt><dd id="bc-profit"></dd></div></dl>
        </div>
        <p class="bc-error" id="bc-error" role="status" hidden></p>
        <div class="bc-summary-actions"><button type="button" class="bc-copy" id="bc-copy">${icon("file")}<span>Copiar resumo</span>${icon("arrow")}</button><p>Simulação. Não cria lançamentos no Caixa.</p></div>
        <details class="bc-formula"><summary>Como esse valor é calculado ${icon("down")}</summary><p>Dividimos os custos pela parte do preço que sobra após impostos e margem.</p><code>Custos ÷ [1 − (impostos + margem) ÷ 100]</code></details>
        <span class="bc-sr-only" role="status" id="bc-announcement"></span>
      </section>
    </div>
  </div>`,
    true,
  );
  const root = document.querySelector(".budget-calculator");
  const form = root.querySelector("form");
  const slider = root.querySelector("#bc-margin-slider");
  const copy = root.querySelector("#bc-copy");
  const error = root.querySelector("#bc-error");
  const fields = Object.fromEntries(
    Object.keys(defaults).map((name) => [name, form.elements.namedItem(name)]),
  );
  let values, result, announceTimer;
  const percent = (n) =>
    new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(n) +
    "%";
  function update() {
    values = Object.fromEntries(
      Object.entries(fields).map(([name, input]) => [
        name,
        input.valueAsNumber,
      ]),
    );
    result = calculateBudget(values);
    slider.value = Number.isFinite(values.margin) ? values.margin : 0;
    slider.setAttribute(
      "aria-valuetext",
      percent(Number(slider.value)) + " de margem",
    );
    form
      .querySelectorAll("[data-budget-margin]")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(Number(button.dataset.budgetMargin) === values.margin),
        ),
      );
    const invalidRates = values.tax + values.margin >= 100;
    for (const [name, input] of Object.entries(fields)) {
      const invalid =
        !Number.isFinite(values[name]) ||
        values[name] < 0 ||
        (invalidRates && ["tax", "margin"].includes(name));
      input.setAttribute("aria-invalid", String(invalid));
    }
    root.dataset.valid = String(!result.error);
    error.hidden = !result.error;
    error.textContent = result.error || "";
    copy.disabled = Boolean(result.error);
    root.querySelector("#bc-total").textContent = result.error
      ? "—"
      : money(result.total);
    root.querySelector("#bc-price-note").textContent = result.error
      ? "Revise os campos para continuar."
      : result.cost === 0
        ? "Informe os custos para simular seu projeto."
        : "Custos cobertos. Margem incluída.";
    for (const [id, key] of [
      ["bc-cost", "cost"],
      ["bc-taxes", "taxes"],
      ["bc-profit", "profit"],
    ])
      root.querySelector("#" + id).textContent = result.error
        ? "—"
        : money(result[key]);
    root.querySelector("#bc-tax-label").textContent = result.error
      ? ""
      : percent(values.tax);
    root.querySelector("#bc-margin-label").textContent = result.error
      ? ""
      : percent(values.margin);
    for (const [key, size] of Object.entries({
      cost: 100 - values.tax - values.margin,
      tax: values.tax,
      margin: values.margin,
    }))
      root.querySelector(`[data-budget-part="${key}"]`).style.width =
        (result.error || !result.total ? 0 : size) + "%";
    copy.querySelector("span").textContent = "Copiar resumo";
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      if (root.isConnected)
        root.querySelector("#bc-announcement").textContent = result.error
          ? ""
          : `Preço sugerido: ${money(result.total)}. Resultado estimado: ${money(result.profit)}.`;
    }, 350);
  }
  form.addEventListener("submit", (e) => e.preventDefault());
  form.addEventListener("input", (e) => {
    if (e.target === slider) fields.margin.value = slider.value;
    update();
  });
  form.addEventListener("click", (e) => {
    const button = e.target.closest("[data-budget-margin]");
    if (button) {
      fields.margin.value = button.dataset.budgetMargin;
      update();
    }
  });
  form.addEventListener("reset", (e) => {
    e.preventDefault();
    for (const [name, value] of Object.entries(defaults))
      fields[name].value = value;
    update();
    toast("Valores iniciais restaurados.");
  });
  copy.addEventListener("click", async () => {
    if (result.error) return;
    const summary = `Resumo do orçamento (simulação)\n\nServiços de produção: ${money(values.services)}\nEquipamentos e locação: ${money(values.rental)}\nCustos do projeto: ${money(result.cost)}\nImpostos (${percent(values.tax)}): ${money(result.taxes)}\nResultado estimado (${percent(values.margin)}): ${money(result.profit)}\n\nPreço sugerido: ${money(result.total)}`;
    try {
      await navigator.clipboard.writeText(summary);
      if (root.isConnected)
        copy.querySelector("span").textContent = "Resumo copiado";
      toast("Resumo copiado.");
    } catch {
      toast(
        "Não foi possível copiar. Permita o acesso à área de transferência e tente novamente.",
      );
    }
  });
  update();
}
