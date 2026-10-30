// Loopback-only rehearsal with disposable fixture state. No private backend or Stripe.
import { spawn } from 'node:child_process';
const env = { ...process.env, API_ORIGIN: 'http://127.0.0.1:4174', PUBLIC_API_URL: 'http://127.0.0.1:4174', PUBLIC_SHOP_ID: '11111111-1111-4111-8111-111111111111', PUBLIC_PAYMENT_MODE: 'stub', PUBLIC_STRIPE_PUBLISHABLE_KEY: '' };
const children = [
  spawn(process.execPath, ['e2e/security-upstream.ts'], { env, stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { env, stdio: 'inherit' })
];
let stopping = false;
function stop(code: number) {
  if (stopping) return; stopping = true;
  for (const child of children) child.kill('SIGTERM');
  process.exitCode = code;
}
for (const child of children) {
  child.on('error', () => stop(1));
  child.on('exit', code => stop(code ?? 1));
}
process.on('SIGINT', () => stop(0)); process.on('SIGTERM', () => stop(0));
console.log('Moth Milk rehearsal: http://127.0.0.1:4173 — synthetic local accounts/orders; no money moves.');
