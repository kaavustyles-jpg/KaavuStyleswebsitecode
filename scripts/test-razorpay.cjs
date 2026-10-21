const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { createHmac } = require('node:crypto');

function load(file, dependencies, extra = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require: name => dependencies[name] || require(name), Buffer, AbortSignal, process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'server-key', RAZORPAY_KEY_ID: 'test-key', RAZORPAY_KEY_SECRET: 'test-secret' } }, ...extra }, { filename: file });
  return exports;
}
const inventory = load('lib/inventory.ts', {});
const product = { id: 'product-1', name: 'Dress', price: 1599, stock: 2, sizes: ['M'], colors: ['Red'], images: ['photo'], sizeStock: { M: 2 } };
function server(db, fetch = async () => { throw new Error('Unexpected gateway call'); }) {
  return load('lib/razorpay-server.ts', { 'server-only': {}, '@supabase/supabase-js': { createClient: () => db }, './supabase': { mapDbProductToProduct: row => row }, './inventory': inventory, './order-image-storage': load('lib/order-image-storage.ts', { './order-images': load('lib/order-images.ts', {}), 'server-only': {} }) }, { fetch });
}
function input(quantity = 1) {
  return { customerName: 'Customer', customerEmail: 'customer@example.com', customerPhone: '9999999999', shippingAddress: 'Street', city: 'City', postalCode: '500001', totalAmount: 1, items: [{ productId: product.id, price: 1, quantity, size: 'M', color: 'Red' }] };
}
test('signature verification rejects modified receipts', () => {
  const { validSignature } = server({});
  const signature = createHmac('sha256', 'secret').update('order_1|pay_1').digest('hex');
  assert.equal(validSignature('order_1|pay_1', signature, 'secret'), true);
  assert.equal(validSignature('order_1|pay_2', signature, 'secret'), false);
  assert.equal(validSignature('order_1|pay_1', 'invalid', 'secret'), false);
});
test('color validation handles uncolored products and legacy single-color carts', () => {
  assert.equal(inventory.resolveProductColor({ ...product, colors: [] }, 'old color'), 'Standard');
  assert.equal(inventory.resolveProductColor(product, 'Standard'), 'Red');
  assert.equal(inventory.resolveProductColor(product, ' red '), 'Red');
  assert.throws(() => inventory.resolveProductColor({ ...product, colors: ['Red', 'Blue'] }, 'Standard'), /preferred color/);
  assert.throws(() => inventory.resolveProductColor(product, 'Blue'), /no longer available/);
});
test('server ignores client price and total; checks aggregate stock', async () => {
  const api = server({ from: () => ({ select: () => ({ in: async () => ({ data: [product] }) }) }) });
  assert.equal((await api.prepareOrder(input())).totalAmount, 1599);
  await assert.rejects(() => api.prepareOrder(input(3)), /insufficient stock/);
  const repeated = input(); repeated.items.push(...repeated.items, ...repeated.items);
  await assert.rejects(() => api.prepareOrder(repeated), /insufficient stock/);
});
test('checkout preparation does not reserve an order number or scan previous orders', async () => {
  const api = server({ from: table => {
    assert.equal(table, 'products');
    return { select: () => ({ in: async () => ({ data: [product] }) }) };
  } });
  const prepared = await api.prepareOrder(input());
  assert.equal(prepared.orderNumber, undefined);
  assert.equal(prepared.order_number, undefined);
});
test('captured payment must match order, currency and amount before saving', async () => {
  let saves = 0;
  const db = { from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { amount: 159900 } }) }) }) }), rpc: async () => { saves++; return { data: { id: 'saved' } }; } };
  const fetch = async () => ({ ok: true, json: async () => ({ status: 'captured', order_id: 'order_1', currency: 'INR', amount: 100 }) });
  await assert.rejects(() => server(db, fetch).finalizePayment('order_1', 'pay_1'), /do not match/);
  assert.equal(saves, 0);
  const validFetch = async () => ({ ok: true, json: async () => ({ status: 'captured', order_id: 'order_1', currency: 'INR', amount: 159900 }) });
  assert.equal((await server(db, validFetch).finalizePayment('order_1', 'pay_1')).id, 'saved');
  assert.equal(saves, 1);
});
test('authorized payments are captured before finalizing an order', async () => {
  const steps = [];
  const db = { from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { amount: 159900 } }) }) }) }), rpc: async () => { steps.push('save'); return { data: { id: 'saved' } }; } };
  const fetch = async (url, options) => {
    if (url.endsWith('/capture')) { steps.push('capture'); assert.equal(JSON.parse(options.body).amount, 159900); return { ok: true, json: async () => ({ status: 'captured' }) }; }
    return { ok: true, json: async () => ({ status: 'authorized', order_id: 'order_1', currency: 'INR', amount: 159900 }) };
  };
  await server(db, fetch).finalizePayment('order_1', 'pay_1');
  assert.deepEqual(steps, ['capture', 'save']);
});
