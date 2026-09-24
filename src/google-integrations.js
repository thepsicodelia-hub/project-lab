import {
  createGoogleClient,
  loadGoogleScript,
  calendarRange,
  normalizeGoogleEvent,
  safeGoogleURL,
} from "./google-api.js";

// State intentionally belongs to this tab/session, not to a shared studio.
export function createGoogleIntegrations(ctx, dependencies = {}) {
  const {
    esc,
    icon,
    render,
    toast,
    getState,
    canEdit,
    save,
    openModal,
    closeModal,
  } = ctx;
  const fetchConfig =
    dependencies.fetchConfig ||
    (() =>
      fetch("/google-integrations.json", {
        cache: "no-store",
        credentials: "omit",
      }));
  const makeClient = dependencies.createClient || createGoogleClient;
  const loadScript = dependencies.loadScript || loadGoogleScript;
  let config = null,
    configPromise = null,
    client = null,
    prepared = false,
    epoch = 0,
    prepareAttempted = false;
  let calendars = [],
    selectedCalendar = "",
    events = [],
    nextPage = "",
    files = [];
  let month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let lastRefresh = 0,
    busy = "",
    error = "",
    email = {},
    pendingProject = "",
    pendingFiles = [];
  let picker = null;
  const button = (text, action, primary = false, disabled = false) =>
    `<button type="button" class="btn ${primary ? "primary" : ""}" data-action="google:${action}" ${disabled ? "disabled" : ""}>${text}</button>`;
  const link = (url, label) =>
    `<a class="btn" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label} ${icon("arrow")}</a>`;
  const isConnected = (service) => Boolean(client?.connected(service));
  const available = (service) =>
    config?.enabled &&
    config[service + "Enabled"] &&
    (service !== "drive" || config.pickerKey);
  const status = (service) =>
    isConnected(service)
      ? "Conectado nesta sessão"
      : !config
        ? "Preparando integração"
        : available(service)
          ? "Não conectado"
          : "Em preparação";

  async function prepare() {
    prepareAttempted = true;
    if (!configPromise)
      configPromise = fetchConfig()
        .then((response) => {
          if (!response.ok) throw new Error();
          return response.json();
        })
        .then((value) => {
          // Isolated review URL only: normal users remain gated until Google approval.
          config = { ...value, calendarEnabled: value.calendarEnabled || ['/google-calendar-review', '/google-calendar-review.html'].includes(location.pathname) };
          client = makeClient(config);
        })
        .catch(() => {
          configPromise = null;
          throw new Error(
            "Não foi possível carregar as integrações. Recarregue a página.",
          );
        });
    await configPromise;
    if (!config.enabled) return;
    await loadScript("https://accounts.google.com/gsi/client", () =>
      Boolean(window.google?.accounts?.oauth2),
    );
    prepared = true;
  }
  function message() {
    return error
      ? `<p class="google-message" role="alert">${esc(error)}</p>`
      : "";
  }
  function serviceControls(service) {
    if (!available(service))
      return `<p class="google-muted">${service === 'calendar' ? 'Em preparação: a leitura de eventos exige uma verificação adicional do Google. Por enquanto, use a Agenda do estúdio.' : 'Conexão em preparação. Seu acesso normal ao Project Lab continua funcionando.'}</p>`;
    if (isConnected(service))
      return `<div class="google-actions">${button("Desconectar desta sessão", "disconnect:" + service)}${service === "calendar" ? '<a class="btn primary" href="#calendar/google">Ver minha agenda</a>' : button("Selecionar arquivos do Drive", "pick", true, Boolean(busy))}</div>`;
    return button(
      busy === "connect:" + service
        ? "Aguardando autorização…"
        : "Conectar Google " + (service === "calendar" ? "Agenda" : "Drive"),
      "connect:" + service,
      true,
      Boolean(busy) || !prepared,
    );
  }
  function settingsEntry() {
    return `<div class="settings-section"><h2>Google Agenda e Drive</h2><p>Consulte sua agenda pessoal e selecione arquivos do seu Drive, sem copiá-los para o Project Lab.</p><a class="btn" href="#integrations">Gerenciar minhas integrações ${icon("arrow")}</a></div>`;
  }
  function page() {
    clearExpired();
    return `<div class="page-heading"><div><h1>Suas integrações</h1><p class="google-muted">Sua conta Google, perto da sua produção.</p></div></div><div class="google-integration-page">${message()}<p class="google-privacy-note">${icon("users")} Conexões individuais. Sua agenda e seu Drive não ficam visíveis para os outros integrantes do estúdio.</p><div class="google-services"><section class="panel google-service"><div class="google-service-heading"><span class="google-service-icon">${icon("calendar")}</span><div><h2>Google Agenda</h2><p>${esc(status("calendar"))}${email.calendar ? " · " + esc(email.calendar) : ""}</p></div></div><p>Veja os compromissos dos seus calendários. Esta conexão é somente de leitura: não cria, altera nem exclui eventos no Google.</p>${serviceControls("calendar")}</section><section class="panel google-service"><div class="google-service-heading"><span class="google-service-icon">${icon("file")}</span><div><h2>Google Drive</h2><p>${esc(status("drive"))}${email.drive ? " · " + esc(email.drive) : ""}</p></div></div><p>Escolha arquivos e pastas na janela do Google. Eles continuam no seu Drive e usam o espaço da sua conta. Não fazemos upload, cópia ou download do conteúdo.</p>${serviceControls("drive")}${files.length ? `<div class="google-files"><h3>Selecionados nesta sessão</h3><p class="google-muted">Esta lista é só sua e desaparece ao recarregar ou desconectar.</p>${files.map((file) => `<div class="google-file">${icon("file")}<span>${esc(file.name)}</span>${link(file.url, "Abrir no Drive")}</div>`).join("")}</div>` : ""}</section></div><div class="google-footnote"><h3>Você mantém o controle</h3><p>Consultas apenas enquanto você usa a integração, sem sincronização contínua. Ao recarregar ou sair da conta, conecte novamente. Nenhuma assinatura ou expansão paga é ativada pelo Project Lab.</p><p>O Google pode pedir nova autorização quando a sessão expirar. Para remover também a permissão concedida no Google, use suas <a href="https://myaccount.google.com/connections" target="_blank" rel="noopener noreferrer">conexões da conta Google</a>. Isso pode afetar o login com Google.</p><a href="/privacidade.html" target="_blank" rel="noopener noreferrer">Como tratamos seus dados</a></div></div>`;
  }
  function calendarTabs(google = false) {
    return `<nav class="google-calendar-tabs" aria-label="Origem da agenda"><a class="${!google ? "active" : ""}" href="#calendar" ${!google ? 'aria-current="page"' : ""}>Agenda do estúdio</a><a class="${google ? "active" : ""}" href="#calendar/google" ${google ? 'aria-current="page"' : ""}>Minha agenda Google</a></nav>`;
  }
  function calendarPage() {
    clearExpired();
    let content;
    if (!isConnected("calendar"))
      content = `<section class="panel google-service"><h2>Seus compromissos, só para você</h2><p>Conecte sua conta para consultar a agenda Google aqui. Seus eventos pessoais não são copiados para o estúdio.</p>${serviceControls("calendar")}</section>`;
    else
      content = `<section class="panel google-calendar-panel"><div class="google-calendar-toolbar"><label class="field">Calendário<select data-google-calendar ${busy ? "disabled" : ""}>${calendars.map((item) => `<option value="${esc(item.id)}" ${item.id === selectedCalendar ? "selected" : ""}>${esc(item.summaryOverride || item.summary || "Calendário")}</option>`).join("")}</select></label><div class="google-month"><button type="button" class="icon-button" data-action="google:month:-1" aria-label="Mês anterior" ${busy ? "disabled" : ""}>←</button><strong>${new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(month)}</strong><button type="button" class="icon-button" data-action="google:month:1" aria-label="Próximo mês" ${busy ? "disabled" : ""}>→</button></div>${button("Atualizar", "refresh", false, Boolean(busy))}</div><p class="google-muted">${esc(email.calendar || "Conta Google conectada")} · Somente leitura · Horários no fuso deste dispositivo</p>${busy ? '<div class="google-loading" role="status">Consultando sua agenda…</div>' : error && !events.length ? '<div class="google-empty"><h3>Consulta não concluída</h3><p>Confira a mensagem acima e tente atualizar novamente.</p></div>' : calendars.length ? calendarGrid() : `<div class="google-empty">${icon("calendar")}<h3>${calendars.length ? "Nenhum compromisso neste mês" : "Nenhum calendário disponível"}</h3><p>${calendars.length ? "Escolha outro mês ou calendário para consultar." : "Confira as permissões da conta conectada."}</p></div>`}${nextPage ? button("Mostrar mais compromissos", "more", false, Boolean(busy)) : ""}</section>`;
    return `<div class="page-heading"><div><h1>Agenda</h1><p class="google-muted">Seu estúdio e seus compromissos, sem misturar as permissões.</p></div></div>${calendarTabs(true)}<div class="google-integration-page">${message()}${content}<p class="google-footnote">Mudanças devem ser feitas no Google Agenda. A agenda pessoal não altera o Radar nem os compromissos compartilhados do Project Lab. <a href="#integrations">Gerenciar conexão</a></p></div>`;
  }
  function calendarGrid() {
    const year = month.getFullYear(), m = month.getMonth();
    const offset = new Date(year, m, 1).getDay();
    const days = new Date(year, m + 1, 0).getDate();
    const today = new Date();
    const fullDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' });
    const clock = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `<div class="google-month-scroller" role="region" aria-label="Calendário mensal Google" tabindex="0"><div class="calendar-weekdays">${['DOM','SEG','TER','QUA','QUI','SEX','SÁB'].map(day => `<span>${day}</span>`).join('')}</div><div class="calendar">${Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, i) => {
      const d = i - offset + 1;
      if (d < 1 || d > days) return '<div class="calendar-day empty" aria-hidden="true"></div>';
      const start = new Date(year, m, d), end = new Date(year, m, d + 1);
      const isToday = start.toDateString() === today.toDateString();
      const items = events.filter(event => event.start < end && event.end > start);
      return `<section class="calendar-day ${isToday ? 'today' : ''}" aria-label="${esc(fullDate.format(start))}"><span class="day-number" ${isToday ? 'aria-current="date"' : ''}>${d}</span>${items.map(event => {
        const time = event.allDay ? 'Dia inteiro' : event.start < start ? 'Continuação' : clock.format(event.start);
        const label = `${event.name}, ${time}${event.location ? ', ' + event.location : ''}`;
        const body = `<strong>${esc(time)}</strong><span>${esc(event.name)}</span>${event.location ? `<small>${esc(event.location)}</small>` : ''}`;
        return event.url ? `<a class="google-day-event" href="${esc(event.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(label)} — abrir no Google">${body}</a>` : `<div class="google-day-event">${body}</div>`;
      }).join('')}</section>`;
    }).join('')}</div></div>${!events.length ? '<p class="google-muted">Nenhum compromisso neste mês.</p>' : ''}`;
  }
  function reset(service) {
    epoch++;
    client?.reset(service);
    busy = "";
    error = "";
    picker?.dispose();
    picker = null;
    pendingFiles = [];
    pendingProject = "";
    if (!service || service === "calendar") {
      calendars = [];
      events = [];
      selectedCalendar = "";
      nextPage = "";
      lastRefresh = 0;
      delete email.calendar;
    }
    if (!service || service === "drive") {
      files = [];
      delete email.drive;
    }
  }
  function clearExpired() {
    if (!isConnected("calendar")) {
      events = [];
      calendars = [];
      selectedCalendar = "";
      nextPage = "";
      delete email.calendar;
    }
    if (!isConnected("drive")) {
      files = [];
      delete email.drive;
    }
  }
  async function loadEvents(more = false) {
    if (!selectedCalendar) return;
    const version = epoch;
    const result = await client.get(
      "calendar",
      "calendar/v3/calendars/" +
        encodeURIComponent(selectedCalendar) +
        "/events",
      {
        ...calendarRange(month),
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "100",
        fields:
          "items(id,summary,start,end,htmlLink,location,status),nextPageToken",
        ...(more && nextPage ? { pageToken: nextPage } : {}),
      },
    );
    if (version !== epoch) return;
    const normalized = (result.items || [])
      .map(normalizeGoogleEvent)
      .filter(Boolean);
    events = more
      ? [
          ...new Map(
            [...events, ...normalized].map((item) => [item.id, item]),
          ).values(),
        ]
      : normalized;
    nextPage = result.nextPageToken || "";
  }
  async function connect(service) {
    if (!available(service) || !prepared)
      throw new Error("Esta conexão ainda está em preparação.");
    const version = epoch;
    try {
      await client.authorize(service);
      if (version !== epoch) return;
      const profile = await client.get(service, "oauth2/v3/userinfo");
      if (version !== epoch) return;
      email[service] = profile.email || "";
      if (service === "calendar") {
        const result = await client.get(
          service,
          "calendar/v3/users/me/calendarList",
          {
            maxResults: "250",
            minAccessRole: "reader",
            fields: "items(id,summary,summaryOverride,primary),nextPageToken",
          },
        );
        if (version !== epoch) return;
        calendars = result.items || [];
        selectedCalendar =
          (calendars.find((item) => item.primary) || calendars[0])?.id || "";
        await loadEvents();
        if (result.nextPageToken)
          toast("Exibindo os primeiros 250 calendários disponíveis.");
      }
    } catch (failure) {
      if (version === epoch) {
        client.reset(service);
        delete email[service];
        if (service === "calendar") {
          calendars = [];
          events = [];
          selectedCalendar = "";
          nextPage = "";
        } else files = [];
      }
      throw failure;
    }
  }
  async function pick(projectId = "") {
    if (!available("drive"))
      throw new Error("O seletor do Drive ainda está em preparação.");
    if (
      projectId &&
      (!canEdit() ||
        !getState().projects.some((project) => project.id === projectId))
    )
      throw new Error(
        "Seu acesso não permite adicionar materiais a esta produção.",
      );
    const version = epoch;
    if (!isConnected("drive")) await connect("drive");
    if (version !== epoch) return;
    await loadScript("https://apis.google.com/js/api.js", () =>
      Boolean(window.gapi),
    );
    if (!window.google?.picker)
      await new Promise((resolve, reject) =>
        window.gapi.load("picker", {
          callback: resolve,
          onerror: () =>
            reject(new Error("Não foi possível abrir o seletor do Drive.")),
          timeout: 15000,
          ontimeout: () =>
            reject(
              new Error(
                "O seletor do Drive demorou para responder. Tente novamente.",
              ),
            ),
        }),
      );
    if (version !== epoch) return;
    const api = window.google.picker;
    picker = new api.PickerBuilder()
      .setAppId(config.appId)
      .setDeveloperKey(config.pickerKey)
      .setOAuthToken(client.pickerToken())
      .setOrigin(location.origin)
      .setLocale("pt-BR")
      .addView(
        new api.DocsView(api.ViewId.DOCS)
          .setIncludeFolders(true)
          .setSelectFolderEnabled(true),
      )
      .enableFeature(api.Feature.MULTISELECT_ENABLED)
      .setTitle(
        projectId
          ? "Selecionar materiais para a produção"
          : "Selecionar arquivos do seu Drive",
      )
      .setCallback((data) => {
        if (version !== epoch) return;
        if (
          data.action === api.Action.CANCEL ||
          data.action === api.Action.PICKED
        ) {
          picker?.dispose();
          picker = null;
        }
        if (data.action === api.Action.PICKED) {
          const chosen = (data.docs || [])
            .map((file) => ({
              name: String(file.name || "Arquivo").slice(0, 150),
              url: safeGoogleURL(file.url),
              id: String(file.id || ""),
              kind:
                file.mimeType === "application/vnd.google-apps.folder"
                  ? "Pasta do Drive"
                  : "Google Drive",
            }))
            .filter((file) => file.url)
            .slice(0, 50);
          files = [
            ...new Map(
              [...files, ...chosen].map((file) => [file.id, file]),
            ).values(),
          ].slice(-100);
          render();
          if (projectId && chosen.length) confirmMaterials(projectId, chosen);
        }
      })
      .build();
    picker.setVisible(true);
  }
  function confirmMaterials(projectId, chosen) {
    const project = getState().projects.find((item) => item.id === projectId);
    if (!project || !canEdit()) return;
    pendingProject = projectId;
    pendingFiles = chosen;
    openModal(
      "Adicionar links à produção?",
      `<p>Os nomes e links destes ${chosen.length} itens ficarão visíveis para os membros do estúdio em <strong>${esc(project.name)}</strong>.</p><ul>${chosen.map((file) => `<li>${esc(file.name)}</li>`).join("")}</ul><p class="form-hint">O conteúdo não será copiado. As permissões do Drive não serão alteradas: quem não tiver acesso precisará solicitá-lo ao proprietário.</p><div class="form-actions">${button("Cancelar", "cancel-materials")}${button("Adicionar links à produção", "save-materials", true)}</div>`,
    );
  }
  async function handle(action) {
    if (!action.startsWith("google:")) return false;
    const [type, argument] = action.slice(7).split(":");
    if (type === "disconnect") {
      reset(argument);
      render();
      return true;
    }
    if (type === "cancel-materials") {
      pendingProject = "";
      pendingFiles = [];
      closeModal();
      return true;
    }
    if (busy) return true;
    error = "";
    busy = type === "connect" ? "connect:" + argument : type;
    const version = epoch;
    try {
      // Call authorize synchronously while the click retains user activation.
      const work =
        type === "connect"
          ? connect(argument)
          : type === "pick"
            ? pick(argument || "")
            : null;
      render();
      if (work) await work;
      else if (type === "month" && ["-1", "1"].includes(argument)) {
        month = new Date(
          month.getFullYear(),
          month.getMonth() + Number(argument),
          1,
        );
        events = [];
        nextPage = "";
        await loadEvents();
      } else if (type === "refresh") {
        if (Date.now() - lastRefresh < 60000)
          throw new Error(
            "A agenda foi consultada há pouco. Aguarde um minuto para atualizar novamente.",
          );
        lastRefresh = Date.now();
        client.clearCache();
        await loadEvents();
      } else if (type === "more") await loadEvents(true);
      else if (type === "save-materials") {
        const state = getState();
        if (
          !canEdit() ||
          !pendingProject ||
          !state.projects.some((project) => project.id === pendingProject)
        )
          throw new Error("A produção não está mais disponível para edição.");
        for (const file of pendingFiles)
          if (
            !state.projectMaterials.some(
              (item) =>
                item.projectId === pendingProject && item.url === file.url,
            )
          )
            state.projectMaterials.push({
              id: crypto.randomUUID(),
              projectId: pendingProject,
              name: file.name,
              kind: file.kind,
              url: file.url,
              note: "Arquivo no Google Drive. Acesso conforme as permissões do proprietário.",
            });
        if (await save()) {
          pendingFiles = [];
          pendingProject = "";
          closeModal();
          toast("Links adicionados. Nenhum arquivo foi copiado.");
        }
      }
    } catch (failure) {
      if (version === epoch) {
        error = failure.message;
        toast(error);
      }
    } finally {
      if (version === epoch) {
        busy = "";
        render();
      }
    }
    return true;
  }
  function bind(root) {
    const control = root.querySelector("[data-google-calendar]");
    if (control)
      control.onchange = async () => {
        selectedCalendar = control.value;
        events = [];
        nextPage = "";
        busy = "calendar";
        error = "";
        const version = epoch;
        render();
        try {
          await loadEvents();
        } catch (failure) {
          if (version === epoch) error = failure.message;
        } finally {
          if (version === epoch) {
            busy = "";
            render();
          }
        }
      };
    if (
      (location.hash === "#integrations" ||
        location.hash === "#calendar/google" ||
        /\/materials$/.test(location.hash)) &&
      !prepareAttempted
    ) {
      const version = epoch;
      prepare()
        .then(() => {
          if (version === epoch) render();
        })
        .catch((failure) => {
          if (version === epoch) {
            error = failure.message;
            render();
          }
        });
    }
    // No recurring polling, no hidden-tab/background synchronization.
  }
  return {
    page,
    settingsEntry,
    calendarTabs,
    calendarPage,
    handle,
    bind,
    reset,
  };
}
