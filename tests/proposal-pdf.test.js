import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { pdfDocumentHTML, withPDFTimeout } from '../src/proposal-pdf.js';
import { proposalDocument } from '../src/proposal-document.js';
import { createProposal } from '../src/proposal-data.js';

test('PDF render document preserves content and blocks active content without WebKit sandbox inheritance', () => {
  const proposal = createProposal('Estúdio', 'BRL', '#ffffff');
  proposal.headline = '<script>alert(1)</script>';
  const doc = new JSDOM(pdfDocumentHTML(proposalDocument(proposal))).window.document;
  assert.equal(doc.querySelectorAll('script,[onerror]').length, 0);
  const policy = doc.querySelector('meta[http-equiv="Content-Security-Policy"]');
  assert.match(policy.content, /script-src 'none'/);
  assert.match(policy.content, /object-src 'none'/);
  assert.ok(doc.querySelector('main'));
  const source = readFileSync(new URL('../src/proposal-pdf.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /setAttribute\(['"]sandbox/);
  assert.doesNotMatch(source, /window\.print/);
  assert.throws(() => pdfDocumentHTML('invalid'), /inválido/);
});

test('PDF waits finish, propagate errors, and reject stalled generation instead of locking forever', async () => {
  assert.equal(await withPDFTimeout(Promise.resolve(42), 'timeout', 50), 42);
  await assert.rejects(withPDFTimeout(Promise.reject(new Error('image')), 'timeout', 50), /image/);
  await assert.rejects(withPDFTimeout(new Promise(() => {}), 'render timeout', 10), /render timeout/);
});
