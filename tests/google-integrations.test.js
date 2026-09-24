import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createGoogleIntegrations } from '../src/google-integrations.js';

const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
async function harness({ enabled = true, failure = '', editable = true } = {}) {
  const dom = new JSDOM('<main></main>', { url: 'https://projectlab.test/#integrations' });
  globalThis.window = dom.window; globalThis.location = dom.window.location;
  const state = { projects: [{ id: 'p1', name: 'Produção teste' }], projectMaterials: [] };
  const sessions = new Set(), requests = [], toasts = [];
  let dialog = '', saved = 0, pickerCallback, disposed = 0, fail = failure;
  const client = {
    connected: service => sessions.has(service),
    authorize: async service => { sessions.add(service); },
    reset: service => service ? sessions.delete(service) : sessions.clear(),
    pickerToken: () => 'test-only-token', clearCache() {},
    get: async (service, path, params) => {
      requests.push({ service, path, params });
      if (fail) throw new Error(fail);
      if (path.includes('userinfo')) return { email: 'test@example.com' };
      if (path.includes('calendarList')) return { items: [{ id: 'one@example.com', summary: '<script>calendar</script>', primary: true }, { id: 'second', summary: 'Outro' }] };
      return { items: [{ id: 'evt1', summary: '<img src=x onerror=alert(1)>', location: '<b>Local</b>', start: { date: '2026-09-24' }, end: { date: '2026-09-25' }, htmlLink: 'https://calendar.google.com/calendar/event?eid=test' }] };
    },
  };
  class PickerBuilder {
    setAppId() { return this; } setDeveloperKey() { return this; } setOAuthToken() { return this; } setOrigin() { return this; } setLocale() { return this; } addView() { return this; } enableFeature() { return this; } setTitle() { return this; }
    setCallback(cb) { pickerCallback = cb; return this; }
    build() { return { setVisible() {}, dispose() { disposed++; } }; }
  }
  class DocsView { setIncludeFolders() { return this; } setSelectFolderEnabled() { return this; } }
  window.google = { picker: { PickerBuilder, DocsView, ViewId: { DOCS: 'docs' }, Feature: { MULTISELECT_ENABLED: 'multi' }, Action: { PICKED: 'picked', CANCEL: 'cancel' } } };
  const root = dom.window.document.querySelector('main');
  let integration;
  const render = () => { root.innerHTML = location.hash === '#calendar/google' ? integration.calendarPage() : integration.page(); };
  integration = createGoogleIntegrations({ esc, icon: () => '<svg aria-hidden="true"></svg>', render, toast: value => toasts.push(value), getState: () => state, canEdit: () => editable, save: async () => { saved++; return true; }, openModal: (title, html) => { dialog = html; }, closeModal: () => { dialog = ''; } }, {
    fetchConfig: async () => ({ ok: true, json: async () => ({ enabled, clientId: 'test', appId: 'test', pickerKey: 'restricted-test-key', driveEnabled: enabled, calendarEnabled: enabled }) }),
    createClient: () => client, loadScript: async () => {},
  });
  render(); integration.bind(root);
  await new Promise(resolve => setImmediate(resolve));
  return { integration, client, root, requests, state, toasts, dom, render, expire: () => sessions.clear(), fail: value => { fail = value; }, pick: docs => pickerCallback({ action: 'picked', docs }), get dialog() { return dialog; }, get saved() { return saved; }, get disposed() { return disposed; } };
}

test('unconfigured integrations remain disabled and never authorize', async () => {
  const h = await harness({ enabled: false });
  assert.match(h.root.textContent, /em preparação/);
  await h.integration.handle('google:connect:calendar');
  assert.equal(h.requests.length, 0);
  assert.equal(h.client.connected('calendar'), false);
  h.dom.window.close();
});

test('personal calendar is escaped, read-only and never saved to studio state', async () => {
  const h = await harness();
  location.hash = '#calendar/google';
  await h.integration.handle('google:connect:calendar');
  assert.equal(h.root.querySelectorAll('.google-event').length, 1);
  assert.match(h.root.textContent, /<img src=x/);
  assert.equal(h.root.querySelector('script, img'), null);
  assert.equal(h.saved, 0);
  assert.deepEqual(Object.keys(h.state), ['projects', 'projectMaterials']);
  await h.integration.handle('google:month:1');
  assert.equal(h.requests.at(-1).params.singleEvents, 'true');
  await h.integration.handle('google:disconnect:calendar');
  assert.equal(h.root.querySelector('.google-event'), null);
  assert.doesNotMatch(h.root.textContent, /test@example.com/);
  h.dom.window.close();
});

test('calendar failure does not masquerade as connected or as an empty successful consultation', async () => {
  const h = await harness({ failure: 'Permissão negada pelo Google.' });
  location.hash = '#calendar/google';
  await h.integration.handle('google:connect:calendar');
  assert.match(h.root.querySelector('[role=alert]').textContent, /Permissão negada/);
  assert.equal(h.client.connected('calendar'), false);
  h.fail(''); await h.integration.handle('google:connect:calendar');
  h.fail('Sem conexão.'); await h.integration.handle('google:month:1');
  assert.match(h.root.textContent, /Consulta não concluída/);
  assert.doesNotMatch(h.root.textContent, /Nenhum compromisso neste mês/);
  h.dom.window.close();
});

test('Drive link sharing needs explicit confirmation, avoids duplicates and rejects unsafe URLs', async () => {
  const h = await harness();
  await h.integration.handle('google:pick:p1');
  const chosen = [{ id: 'one', name: '<img>Teste', url: 'https://docs.google.com/document/d/demo/edit' }, { id: 'bad', name: 'Bad', url: 'javascript:alert(1)' }];
  h.pick(chosen);
  assert.equal(h.disposed, 1);
  assert.equal(h.state.projectMaterials.length, 0);
  assert.match(h.dialog, /permissões do Drive não serão alteradas/);
  assert.doesNotMatch(h.dialog, /<img>/);
  await h.integration.handle('google:save-materials');
  assert.equal(h.saved, 1);
  assert.equal(h.state.projectMaterials.length, 1);
  assert.equal(h.state.projectMaterials[0].name, '<img>Teste');
  assert.equal(JSON.stringify(h.state).includes('test-only-token'), false);
  await h.integration.handle('google:pick:p1'); h.pick(chosen);
  await h.integration.handle('google:save-materials');
  assert.equal(h.state.projectMaterials.length, 1);
  await h.integration.handle('google:disconnect:drive');
  assert.doesNotMatch(h.root.textContent, /<img>Teste/);
  h.dom.window.close();
});

test('Drive respects read-only workspace access and clears private lists on expiration', async () => {
  const h = await harness({ editable: false });
  await h.integration.handle('google:pick:p1');
  assert.match(h.toasts.at(-1), /não permite/);
  assert.equal(h.client.connected('drive'), false);
  await h.integration.handle('google:pick');
  h.pick([{ id: 'one', name: 'Pessoal', url: 'https://drive.google.com/file/d/demo/view' }]);
  assert.match(h.root.textContent, /Pessoal/);
  assert.equal(h.saved, 0);
  h.expire(); h.render();
  assert.doesNotMatch(h.root.textContent, /Pessoal|test@example.com/);
  h.dom.window.close();
});
