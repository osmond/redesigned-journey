import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('next.config.mjs defines expected security headers', async () => {
  const file = await fs.readFile('next.config.mjs', 'utf8');
  const headers = [
    'Content-Security-Policy',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Referrer-Policy',
    'Permissions-Policy',
  ];
  for (const header of headers) {
    assert.ok(file.includes(header), `${header} missing`);
  }
});

test('BACKUP_POLICY.md documents RPO and RTO', async () => {
  const policy = await fs.readFile('BACKUP_POLICY.md', 'utf8');
  const text = policy.replace(/\*/g, '');
  assert.ok(text.includes('Recovery Point Objective (RPO): 24 hours'), 'RPO missing');
  assert.ok(text.includes('Recovery Time Objective (RTO): 1 hour'), 'RTO missing');
});
