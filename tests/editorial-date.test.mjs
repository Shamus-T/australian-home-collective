import test from 'node:test';
import assert from 'node:assert/strict';
import { editorialDate } from '../src/lib/editorial-date.mjs';
test('AHC review day follows Brisbane across the UTC date boundary', () => {
  assert.equal(editorialDate(new Date('2026-10-10T13:59:59Z')), '2026-10-10');
  assert.equal(editorialDate(new Date('2026-10-10T14:00:00Z')), '2026-10-11');
  assert.equal(editorialDate(new Date('2026-12-31T14:00:00Z')), '2027-01-01');
});
