const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, deps = {}, env = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(source, { exports, require: name => name === 'server-only' ? {} : deps[name] || require(name), Buffer, process: { env } });
  return exports;
}
const images = load('lib/order-images.ts');
const receipts = load('lib/customer-order-session.ts', {}, { ADMIN_SESSION_SECRET: 'test-only-secret' });
const next = { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } };
test('order images keep URLs and remove embedded data without changing prices', () => {
  const row = { id: 'order', total_amount: 1599, items: [{ name: 'Dress', price: 1599, quantity: 1, image: 'data:image/jpeg;base64,abc' }] };
  const clean = images.cleanOrderRow(row);
  assert.equal(clean.total_amount, 1599);
  assert.equal(clean.items[0].image, '/icon.jpeg');
  assert.equal(row.items[0].image, 'data:image/jpeg;base64,abc');
  assert.equal(images.orderImageUrl('https://example.com/image.webp'), 'https://example.com/image.webp');
  assert.equal(images.orderImageUrl('blob:old-image'), '/icon.jpeg');
});
test('receipt cookie authorizes only signed order IDs; tampering fails', () => {
  const id = '706278c7-431b-442f-a922-b7f00bf1ec6f';
  const cookie = receipts.addOrderReceipt(undefined, id);
  assert.equal(receipts.receiptOrderIds(cookie)[0], id);
  assert.equal(receipts.receiptOrderIds(cookie + '0').length, 0);
  assert.equal(receipts.receiptOrderIds('forged').length, 0);
});
test('admin order endpoint rejects requests before reading the database', async () => {
  let reads = 0;
  const route = load('app/api/admin/orders/route.ts', { 'next/server': next, '@/lib/admin-session': { requireAdmin: () => { throw new Error('Sign in'); } }, '@/lib/razorpay-server': { paymentDb: () => { reads++; } }, '@/lib/order-images': images });
  const response = await route.GET({});
  assert.equal(response.status, 401);
  assert.equal(reads, 0);
});
test('customer endpoint cannot use a supplied email to download other orders', async () => {
  let reads = 0;
  const route = load('app/api/orders/route.ts', { 'next/server': next, '@/lib/customer-order-session': receipts, '@/lib/razorpay-server': { paymentDb: () => { reads++; } }, '@/lib/order-images': images });
  const response = await route.GET({ url: 'https://example.com/api/orders?email=other@example.com', cookies: { get: () => undefined } });
  assert.equal(response.body.orders.length, 0);
  assert.equal(reads, 0);
});
