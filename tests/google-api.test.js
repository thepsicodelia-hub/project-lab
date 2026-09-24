import test from "node:test";
import assert from "node:assert/strict";
import {
  createGoogleClient,
  GOOGLE_SCOPES,
  safeGoogleURL,
  calendarRange,
  normalizeGoogleEvent,
} from "../src/google-api.js";

function harness(
  fetcher = async () => ({ ok: true, json: async () => ({ items: [] }) }),
) {
  const prompts = [];
  let time = Date.now();
  const oauth = {
    initTokenClient(options) {
      prompts.push(options);
      return {
        requestAccessToken(args) {
          assert.equal(args.prompt, "select_account");
        },
      };
    },
    hasGrantedAllScopes(response, ...scopes) {
      return scopes.every((scope) => response.scope.split(" ").includes(scope));
    },
  };
  const client = createGoogleClient({
    clientId: "public-test-client",
    oauth: () => oauth,
    now: () => time,
    fetcher,
  });
  function answer(service, index = prompts.length - 1) {
    prompts[index].callback({
      access_token: "test-only-token",
      expires_in: 3600,
      scope: [
        ...GOOGLE_SCOPES[service],
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" "),
    });
  }
  async function connect(service) {
    const work = client.authorize(service);
    answer(service);
    await work;
  }
  return {
    client,
    prompts,
    answer,
    connect,
    advance: (value) => {
      time += value;
    },
  };
}

test("Google authorizations are service-specific, memory-only and expire without refresh", async () => {
  const h = harness();
  await h.connect("drive");
  assert.equal(h.client.connected("drive"), true);
  assert.equal(h.client.connected("calendar"), false);
  assert.equal(h.prompts[0].include_granted_scopes, false);
  assert.equal(h.prompts[0].scope.includes("calendar"), false);
  assert.equal(h.client.pickerToken(), "test-only-token");
  h.advance(3540001);
  assert.equal(h.client.pickerToken(), "");
  assert.equal(h.client.connected("drive"), false);
  await h.connect("calendar");
  assert.equal(h.prompts[1].scope.includes("drive"), false);
  h.client.reset();
  assert.equal(h.client.connected("calendar"), false);
});

test("late authorization callbacks cannot reopen a disconnected session or cancel a newer popup", async () => {
  const h = harness();
  const first = h.client.authorize("calendar");
  const rejected = assert.rejects(first, /cancelada/);
  h.client.reset();
  await rejected;
  const second = h.client.authorize("calendar");
  h.answer("calendar", 0);
  h.prompts[0].error_callback({ type: "popup_closed" });
  assert.equal(h.client.connected("calendar"), false);
  h.answer("calendar", 1);
  await second;
  assert.equal(h.client.connected("calendar"), true);
});

test("Google rejects missing scopes and concurrent popup requests", async () => {
  const h = harness();
  const work = h.client.authorize("calendar");
  await assert.rejects(h.client.authorize("drive"), /já está aberta/);
  h.prompts[0].callback({
    access_token: "test",
    scope: "https://www.googleapis.com/auth/userinfo.email",
  });
  await assert.rejects(work, /permissões/);
  assert.equal(h.client.connected("calendar"), false);
  const denied = h.client.authorize("drive");
  h.prompts[1].callback({ error: "access_denied" });
  await assert.rejects(denied, /não foi autorizada/);
});

test("Google client permits only scoped GET endpoints and caches without tokens in URLs", async () => {
  const calls = [];
  const h = harness(async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({ items: [{ id: "one" }] }) };
  });
  await h.connect("calendar");
  const endpoint = "calendar/v3/calendars/example%40gmail.com/events";
  const a = await h.client.get("calendar", endpoint, { maxResults: "100" });
  assert.deepEqual(
    await h.client.get("calendar", endpoint, { maxResults: "100" }),
    a,
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.method, "GET");
  assert.equal(calls[0].options.credentials, "omit");
  assert.equal(calls[0].url.includes("test-only-token"), false);
  assert.equal(
    calls[0].options.headers.Authorization,
    "Bearer test-only-token",
  );
  await assert.rejects(
    h.client.get("calendar", "https://attacker.example/events"),
    /não permitida/,
  );
  await assert.rejects(
    h.client.get("calendar", "drive/v3/files"),
    /não permitida/,
  );
  await h.connect("drive");
  await assert.rejects(h.client.get("drive", endpoint), /não permitida/);
  h.advance(60001);
  await h.client.get("calendar", endpoint, { maxResults: "100" });
  assert.equal(calls.length, 2);
});

test("disconnect discards an in-flight response and expiration requires a new user action", async () => {
  let reply;
  const h = harness(
    () =>
      new Promise((resolve) => {
        reply = resolve;
      }),
  );
  await h.connect("calendar");
  const work = h.client.get("calendar", "calendar/v3/users/me/calendarList");
  h.client.reset();
  reply({
    ok: true,
    json: async () => ({ items: [{ summary: "private-event" }] }),
  });
  await assert.rejects(work, /cancelada/);
  await assert.rejects(
    h.client.get("calendar", "calendar/v3/users/me/calendarList"),
    /expirou/,
  );
});

test("Google errors are actionable and queries are throttled, never upgraded to paid access", async () => {
  const h = harness(async () => ({
    ok: false,
    status: 401,
    json: async () => ({ error: {} }),
  }));
  await h.connect("calendar");
  await assert.rejects(
    h.client.get("calendar", "calendar/v3/users/me/calendarList"),
    /expirou/,
  );
  assert.equal(h.client.connected("calendar"), false);
  const limit = harness();
  await limit.connect("calendar");
  for (let i = 0; i < 20; i++)
    await limit.client.get("calendar", "calendar/v3/users/me/calendarList", {
      pageToken: String(i),
    });
  await assert.rejects(
    limit.client.get("calendar", "calendar/v3/users/me/calendarList", {
      pageToken: "21",
    }),
    /Aguarde um minuto/,
  );
  limit.advance(60001);
  await limit.client.get("calendar", "calendar/v3/users/me/calendarList", {
    pageToken: "21",
  });
});

test("Google dates retain local all-day dates and links cannot escape Google hosts", () => {
  const event = normalizeGoogleEvent({
    id: "a",
    start: { date: "2026-09-24" },
    end: { date: "2026-09-25" },
    htmlLink: "https://calendar.google.com/calendar/event?eid=test",
  });
  assert.equal(event.start.getDate(), 24);
  assert.equal(event.allDay, true);
  assert.equal(
    normalizeGoogleEvent({
      start: { date: "2026-09-25" },
      end: { date: "2026-09-24" },
    }),
    null,
  );
  assert.equal(normalizeGoogleEvent({ status: "cancelled" }), null);
  assert.equal(
    new Date(calendarRange(new Date(2026, 11, 1)).timeMax).getFullYear(),
    2027,
  );
  for (const url of [
    "javascript:alert(1)",
    "https://docs.google.com.evil.example/a",
    "https://user:secret@docs.google.com/a",
    "http://drive.google.com/a",
  ])
    assert.equal(safeGoogleURL(url), "");
  assert.equal(
    safeGoogleURL("https://www.google.com/url?q=evil", "calendar"),
    "",
  );
  assert.equal(
    safeGoogleURL("https://docs.google.com/document/d/test/edit"),
    "https://docs.google.com/document/d/test/edit",
  );
});
