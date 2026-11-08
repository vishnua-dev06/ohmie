import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const serverUrl = 'http://127.0.0.1:4173';
const server = spawn(process.execPath, [
  'node_modules/vite/bin/vite.js', 'preview', 'apps/web',
  '--config', 'apps/web/vite.config.ts', '--configLoader', 'runner',
  '--host', '127.0.0.1', '--port', '4173',
], { stdio: 'inherit' });

let exited = false;
let serverExitCode = null;
server.once('exit', (code) => { exited = true; serverExitCode = code; });

try {
  const deadline = Date.now() + 30_000;
  let ready = false;
  while (Date.now() < deadline && !exited) {
    try { const response = await fetch(serverUrl); if (response.ok) { ready = true; break; } } catch { /* server is still starting */ }
    await delay(250);
  }
  if (!ready) throw new Error(exited ? `Preview server exited with code ${serverExitCode}.` : 'Timed out waiting for the preview server.');

  const tests = spawn(process.execPath, ['node_modules/playwright/cli.js', 'test', '--reporter=line'], { stdio: 'inherit', env: process.env });
  const testExitCode = await new Promise((resolve, reject) => {
    tests.once('error', reject);
    tests.once('exit', (code) => resolve(code ?? 1));
  });
  process.exitCode = Number(testExitCode);
} finally {
  if (!exited) {
    server.kill();
    await Promise.race([new Promise((resolve) => server.once('exit', resolve)), delay(2_000)]);
  }
}
