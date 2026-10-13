const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, env = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(source, { exports, require: name => name === 'server-only' ? {} : require(name), Buffer, URL, process: { env } });
  return exports;
}
const payload = load('lib/shiprocket-payload.ts');
const parcel = { weight: 0.6, length: 30, width: 20, height: 5, pickupLocation: 'Warehouse', deliveryState: 'Karnataka' };
const order = { orderNumber: 'KS-001', paymentStatus: 'Paid', status: 'Pending', customerName: 'Test Customer', customerPhone: '+91 9999999999', customerEmail: 'customer@example.com', shippingAddress: 'Delivery street', city: 'Bengaluru', postalCode: '560060', createdAt: '2026-10-13T00:00:00Z', totalAmount: 1500, items: [{ name: 'Dress', productId: 'product-1', size: 'M', color: 'Blue', quantity: 1, price: 1599 }] };
test('shipment uses the saved paid order and admin-entered parcel details', () => {
  const result = payload.buildShiprocketOrder(order, parcel);
  assert.equal(result.order_id, 'KS-001');
  assert.equal(result.weight, 0.6);
  assert.equal(result.breadth, 20);
  assert.equal(result.payment_method, 'Prepaid');
  assert.equal(result.sub_total, 1500);
  assert.equal(result.total_discount, 99);
  assert.equal(result.billing_phone, '9999999999');
  assert.equal(result.order_date, '2026-10-13 05:30');
});
test('rejects invalid parcel measurements and missing pickup', () => {
  for (const value of [0, -1, NaN, Infinity, '1']) assert.throws(() => payload.validateParcel({ ...parcel, weight: value }), /weight/);
  assert.throws(() => payload.validateParcel({ ...parcel, pickupLocation: '' }), /pickup/);
  assert.throws(() => payload.validateParcel({ ...parcel, deliveryState: '' }), /state/);
});
test('rejects unpaid, cancelled and already shipped orders', () => {
  assert.throws(() => payload.buildShiprocketOrder({ ...order, paymentStatus: 'Pending' }, parcel), /paid/);
  for (const status of ['Cancelled', 'Shipped', 'Delivered']) assert.throws(() => payload.buildShiprocketOrder({ ...order, status }, parcel), /new shipment/);
});
test('rejects invalid delivery details and inconsistent totals', () => {
  assert.throws(() => payload.buildShiprocketOrder({ ...order, customerPhone: '123' }, parcel), /phone/);
  assert.throws(() => payload.buildShiprocketOrder({ ...order, postalCode: '123' }, parcel), /pincode/);
  assert.throws(() => payload.buildShiprocketOrder({ ...order, totalAmount: 9999 }, parcel), /prices/);
});
test('server admin guard rejects tampered, expired and cross-origin sessions', () => {
  const auth = load('lib/admin-session.ts', { ADMIN_SESSION_SECRET: 'test-secret' });
  const session = auth.signAdminSession(Date.now() + 10000);
  const request = value => ({ method: 'POST', cookies: { get: () => ({ value }) }, headers: { get: key => key === 'host' ? 'localhost:3000' : 'http://localhost:3000' } });
  assert.doesNotThrow(() => auth.requireAdmin(request(session)));
  assert.throws(() => auth.requireAdmin(request(session.slice(0, -1) + (session.endsWith('a') ? 'b' : 'a'))), /sign in/);
  assert.throws(() => auth.requireAdmin(request(auth.signAdminSession(Date.now() - 1))), /sign in/);
  const foreign = request(session); foreign.headers.get = key => key === 'host' ? 'localhost:3000' : 'https://other.example.com';
  assert.throws(() => auth.requireAdmin(foreign), /origin/);
});
