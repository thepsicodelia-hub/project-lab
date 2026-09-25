// Personal, browser-only access. Never write Google tokens or calendar data to
// workspace state, localStorage, URLs, logs, Supabase or our hosting provider.
export const GOOGLE_SCOPES = Object.freeze({
  calendar: [
    "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
    "https://www.googleapis.com/auth/calendar.events.readonly",
  ],
  drive: ["https://www.googleapis.com/auth/drive.file"],
});
const scripts = new Map();
export function loadGoogleScript(src, ready) {
  if (ready()) return Promise.resolve();
  if (scripts.has(src)) return scripts.get(src);
  const promise = new Promise((resolve, reject) => {
    const node = document.createElement("script");
    const fail = () => {
      clearTimeout(timer);
      node.remove();
      scripts.delete(src);
      reject(
        new Error(
          "Não foi possível carregar o Google. Verifique sua conexão ou bloqueador de conteúdo e tente novamente.",
        ),
      );
    };
    const timer = setTimeout(fail, 20000);
    node.src = src;
    node.async = true;
    node.onload = () => {
      if (!ready()) return fail();
      clearTimeout(timer);
      resolve();
    };
    node.onerror = fail;
    document.head.append(node);
  });
  scripts.set(src, promise);
  return promise;
}

export function safeGoogleURL(value, kind = "drive") {
  try {
    const url = new URL(value);
    const hosts =
      kind === "calendar"
        ? ["calendar.google.com", "www.google.com"]
        : ["drive.google.com", "docs.google.com"];
    const calendarPath =
      kind !== "calendar" ||
      url.hostname !== "www.google.com" ||
      url.pathname.startsWith("/calendar/");
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      hosts.includes(url.hostname) &&
      calendarPath
      ? url.href
      : "";
  } catch {
    return "";
  }
}

export function calendarRange(month) {
  return {
    timeMin: new Date(month.getFullYear(), month.getMonth(), 1).toISOString(),
    timeMax: new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      1,
    ).toISOString(),
  };
}

export function normalizeGoogleEvent(event) {
  if (event.status === "cancelled" || !event.start || !event.end) return null;
  const allDay = Boolean(event.start.date);
  const start = allDay
    ? new Date(event.start.date + "T00:00:00")
    : new Date(event.start.dateTime);
  const end = allDay
    ? new Date(event.end.date + "T00:00:00")
    : new Date(event.end.dateTime);
  if (!Number.isFinite(+start) || !Number.isFinite(+end) || end <= start)
    return null;
  return {
    id: String(event.id || ""),
    name: String(event.summary || "Compromisso sem título").slice(0, 500),
    start,
    end,
    allDay,
    url: safeGoogleURL(event.htmlLink, "calendar"),
    location: String(event.location || "").slice(0, 500),
  };
}

export function googleError(status, reason = "") {
  if (status === 401)
    return "Sua conexão com o Google expirou. Conecte novamente para continuar.";
  if (
    status === 429 ||
    /quota|rateLimit|dailyLimit|userRateLimit/i.test(reason)
  )
    return "O limite de consultas do Google foi atingido. Aguarde alguns minutos antes de tentar novamente. Nenhum serviço pago será ativado.";
  if (status === 403)
    return "O Google não liberou esta consulta. Verifique as permissões da conta ou tente reconectar. Contas de empresa podem exigir autorização do administrador.";
  if (status === 404)
    return "Este calendário ou arquivo não está mais disponível para esta conta.";
  return "Não foi possível consultar o Google agora. Tente novamente em alguns instantes.";
}

export function createGoogleClient({
  clientId,
  fetcher = (...args) => fetch(...args),
  now = () => Date.now(),
  oauth = () => window.google.accounts.oauth2,
}) {
  let generation = 0;
  const sessions = new Map(),
    pending = new Map(),
    controllers = new Set(),
    cache = new Map();
  let requestTimes = [];
  function reset(service) {
    generation++;
    if (service) sessions.delete(service);
    else sessions.clear();
    for (const reject of pending.values())
      reject(new Error("Conexão cancelada."));
    pending.clear();
    for (const controller of controllers) controller.abort();
    controllers.clear();
    cache.clear();
  }
  function connected(service) {
    const session = sessions.get(service);
    if (session && session.expires <= now()) {
      sessions.delete(service);
      cache.clear();
    }
    return Boolean(session && session.expires > now());
  }
  function authorize(service) {
    if (!GOOGLE_SCOPES[service])
      return Promise.reject(new Error("Integração inválida."));
    if (pending.size)
      return Promise.reject(
        new Error(
          "Conclua a janela de autorização do Google que já está aberta.",
        ),
      );
    const version = generation;
    return new Promise((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(
        () =>
          finish(
            new Error(
              "A autorização não foi concluída. Tente conectar novamente.",
            ),
          ),
        120000,
      );
      const finish = (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        pending.delete(service);
        error ? reject(error) : resolve();
      };
      pending.set(service, (error) => finish(error));
      try {
        oauth()
          .initTokenClient({
            client_id: clientId,
            scope: [
              ...GOOGLE_SCOPES[service],
              "https://www.googleapis.com/auth/userinfo.email",
            ].join(" "),
            include_granted_scopes: false,
            callback(response) {
              if (settled || version !== generation || !pending.has(service))
                return;
              if (response.error || !response.access_token)
                return finish(
                  new Error(
                    "A conexão não foi autorizada. Seus dados continuam intactos.",
                  ),
                );
              if (
                !oauth().hasGrantedAllScopes(
                  response,
                  ...GOOGLE_SCOPES[service],
                  "https://www.googleapis.com/auth/userinfo.email",
                )
              )
                return finish(
                  new Error(
                    "Autorize as permissões solicitadas para usar esta integração.",
                  ),
                );
              sessions.set(service, {
                token: response.access_token,
                expires:
                  now() +
                  Math.max(0, Number(response.expires_in || 3600) - 60) * 1000,
              });
              cache.clear();
              finish();
            },
            error_callback(error) {
              finish(
                new Error(
                  error.type === "popup_failed_to_open"
                    ? "Permita a janela pop-up do Google e tente novamente."
                    : "A janela do Google foi fechada. Você pode conectar quando quiser.",
                ),
              );
            },
          })
          .requestAccessToken({
            prompt: /^\/google-calendar-review(?:\.html)?$/.test(globalThis.location?.pathname || "")
              ? "consent select_account"
              : "select_account",
          });
      } catch {
        finish(
          new Error(
            "Não foi possível iniciar a conexão com o Google. Recarregue a página e tente novamente.",
          ),
        );
      }
    });
  }
  async function get(service, path, params = {}) {
    if (!connected(service)) throw new Error(googleError(401));
    // Only these read endpoints are allowed. No arbitrary URL or write method.
    if (!(
      (service === "calendar" &&
        /^calendar\/v3\/(users\/me\/calendarList|calendars\/[^/]+\/events)$/.test(
          path,
        )) ||
      path === "oauth2/v3/userinfo"
    ))
      throw new Error("Consulta não permitida.");
    const url =
      "https://www.googleapis.com/" + path + "?" + new URLSearchParams(params);
    const key = service + ":" + url,
      stored = cache.get(key);
    if (stored && stored.expires > now()) return stored.data;
    requestTimes = requestTimes.filter((time) => time > now() - 60000);
    if (requestTimes.length >= 20)
      throw new Error(
        "Muitas consultas seguidas. Aguarde um minuto para continuar.",
      );
    requestTimes.push(now());
    const version = generation,
      controller = new AbortController();
    controllers.add(controller);
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetcher(url, {
        method: "GET",
        headers: { Authorization: "Bearer " + sessions.get(service).token },
        signal: controller.signal,
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
      const data = await response.json();
      if (version !== generation) throw new Error("Conexão cancelada.");
      if (!response.ok) {
        if (response.status === 401) {
          sessions.delete(service);
          cache.clear();
        }
        throw new Error(
          googleError(response.status, data?.error?.errors?.[0]?.reason),
        );
      }
      cache.set(key, { data, expires: now() + 60000 });
      return data;
    } catch (error) {
      if (error.name === "AbortError")
        throw new Error("A consulta foi interrompida. Tente novamente.");
      if (error instanceof TypeError)
        throw new Error("Sem conexão com o Google. Verifique sua internet.");
      throw error;
    } finally {
      clearTimeout(timer);
      controllers.delete(controller);
    }
  }
  return {
    authorize,
    connected,
    reset,
    get,
    // Token is passed only to Google's Picker; never to our own API/storage.
    pickerToken: () => (connected("drive") ? sessions.get("drive").token : ""),
    clearCache: () => cache.clear(),
  };
}
