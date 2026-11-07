import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const guide = readFileSync(new URL('../src/pages/guides/louvred-pergolas-australia/index.astro', import.meta.url), 'utf8');

test('Pergolux warranty is a concise current-policy reference without disputed detail', () => {
  const section = guide.split('<h3 id="pergolux-warranty">')[1]?.split('<h2>')[0];
  assert.ok(section);
  assert.match(section, /https:\/\/pergolux\.au\/pages\/10-year-warranty/);
  assert.match(section, /confirm the terms that apply to your chosen model and installation/);
  assert.doesNotMatch(section, /<table|\b\d+\s+(?:years?|months?|days?)\b|\.pdf|pergoluxshop/);
  assert.match(guide, /href="#pergolux-warranty"/);
  assert.match(guide, /voluntary warranties are additional to Australian Consumer Law guarantees/);
});

test('warranty simplification preserves research limits and installation safeguards', () => {
  assert.match(guide, /AHC has not installed or tested/);
  assert.match(guide, /AHC has an affiliate relationship with Pergolux/);
  assert.match(guide, /not yet approved for affiliate shopping placements/);
  assert.match(guide, /foundations, anchors, drainage and any electrical work assessed for your property/);
  assert.match(guide, /Ask who assesses the supporting structure, designs the footings and specifies the anchors/);
  assert.match(guide, /No unverified wind-speed comparison/);
  assert.doesNotMatch(guide, /t\.cfjump\.com|<CommercialProductBlock/);
});
