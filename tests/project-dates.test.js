import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCaptureDates } from '../src/project-dates.js';

test('project capture dates accept Brazilian and ISO formats without duplicates', () => {
  assert.deepEqual(parseCaptureDates('23/09/2026\n2026-09-23; 1/10/2026'), ['2026-09-23', '2026-10-01']);
  assert.deepEqual(parseCaptureDates(''), []);
});
test('impossible dates receive an actionable error', () => {
  for (const date of ['31/02/2026', '2026-02-31', '23/13/2026', 'amanhã']) {
    assert.throws(() => parseCaptureDates(date), /Use DD\/MM\/AAAA/);
  }
});
