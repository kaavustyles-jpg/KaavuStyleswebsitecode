const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, deps, env = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, require: name => name === 'server-only' ? {} : deps[name] || require(name), process: { env }, Buffer, Date, Error, console });
  return exports;
}
const defaults = { paymentDb: () => ({}), razorpay: () => {}, finalizePayment: () => {} };
function worker() { return load('lib/payment-reconciliation.ts', { './razorpay-server': defaults }).reconcilePayments; }
function database(ids) {
  let claimed = false;
  const updates = [];
  return { updates, rpc: async () => { const result = claimed ? [] : ids.map(id => ({ razorpay_order_id: id, created_at: '2026-10-21T00:00:00Z' })); claimed = true; return { data: result }; }, from: () => ({ update: values => ({ eq: () => ({ is: async () => { updates.push(values); return {}; } }) }) }) };
}
test('reconciliation finalizes captured payments and leaves authorized/refunded payments alone', async () => {
  const db = database(['captured', 'authorized', 'refunded']);
  const finalized = [];
  const result = await worker()({ db, gateway: async path => ({ items: [{ id: 'pay', status: path.includes('authorized') ? 'authorized' : 'captured', amount_refunded: path.includes('refunded') ? 100 : 0 }] }), finalize: async (order, payment) => finalized.push([order, payment]) });
  assert.equal(result.recovered, 1);
  assert.equal(result.waiting, 2);
  assert.deepEqual(finalized, [['captured', 'pay']]);
});
test('a stock/database failure is retained for review while other payments continue', async () => {
  const db = database(['fails', 'passes']);
  const result = await worker()({ db, gateway: async () => ({ items: [{ id: 'pay', status: 'captured' }] }), finalize: async order => { if (order === 'fails') throw new Error('Stock check failed'); return {}; } });
  assert.equal(result.failed, 1);
  assert.equal(result.recovered, 1);
  assert.equal(result.issues[0].gatewayOrderId, 'fails');
  assert.equal(db.updates.some(update => update.reconcile_error === 'Stock check failed'), true);
});
test('reconciliation fails clearly when the migration is missing', async () => {
  await assert.rejects(() => worker()({ db: { rpc: async () => ({ error: { code: 'PGRST202' } }) } }), /Apply reliable-order-confirmation.sql/);
});
test('cron endpoint rejects missing or incorrect credentials without running recovery', async () => {
  let calls = 0;
  const route = load('app/api/payments/reconcile/route.ts', { 'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } }, '@/lib/admin-session': { requireAdmin: () => { throw new Error('Sign in'); } }, '@/lib/payment-reconciliation': { reconcilePayments: async () => { calls++; return {}; } } }, { CRON_SECRET: 'correct-secret' });
  assert.equal((await route.GET({ headers: { get: () => 'Bearer wrong' } })).status, 401);
  assert.equal((await route.POST({})).status, 401);
  assert.equal(calls, 0);
  assert.equal((await route.GET({ headers: { get: () => 'Bearer correct-secret' } })).status, 200);
  assert.equal(calls, 1);
});
