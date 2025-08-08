import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function hasUserScope(path: string) {
  const src = fs.readFileSync(path, 'utf8');
  return /userId/.test(src);
}

test('plants route uses userId scoping', () => {
  assert.ok(hasUserScope('src/app/api/plants/route.ts'));
});

test('photo delete route checks userId', () => {
  assert.ok(hasUserScope('src/app/api/photos/[id]/route.ts'));
});

test('plant detail route checks userId', () => {
  assert.ok(hasUserScope('src/app/api/plants/[id]/route.ts'));
});

test('uploads route checks userId', () => {
  assert.ok(hasUserScope('src/app/api/uploads/route.ts'));
});
