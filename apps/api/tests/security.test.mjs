import test from 'node:test';
import assert from 'node:assert/strict';
import { createInviteCode, sha256 } from '../dist/security.js';

test('invitation codes are high entropy, uppercase, and fixed length', () => {
  const code = createInviteCode();
  assert.match(code, /^[A-F0-9]{10}$/);
  assert.equal(code.length, 10);
});

test('invitation storage uses a deterministic SHA-256 digest, not the plain code', () => {
  const digest = sha256('ABCDEF0123');
  assert.equal(digest, '3419d586bcb059c424e7d67eca7ecca2b1e94bc920e97d8d86551a0c661579df');
  assert.notEqual(digest, 'ABCDEF0123');
});

test('generated invitation codes do not repeat in a short sample', () => {
  const codes = new Set(Array.from({ length: 100 }, () => createInviteCode()));
  assert.equal(codes.size, 100);
});
