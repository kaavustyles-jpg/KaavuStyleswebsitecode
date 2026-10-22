const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/shiprocket-status.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: exportsObject });
const inspect = exportsObject.inspectShiprocketOrder;
const order = { orderNumber: 'KAAVU00001', totalAmount: 2250, customerEmail: 'customer@example.com', createdAt: '2026-10-21T08:00:00Z', status: 'Shipped', shiprocket: { orderId: 123 } };
const remote = { id: 123, channel_order_id: 'KAAVU00001', total: '2250.00', customer_email: 'customer@example.com', status: 'NEW', status_code: 1, shipments: [{ id: 456, awb: '' }] };
test('old test purchase with reused number is not accepted as the current shipment', () => {
  assert.equal(inspect(order, { ...remote, total: 1 }).status, 'Mismatch');
  assert.equal(inspect(order, { ...remote, customer_email: 'another@example.com' }).status, 'Mismatch');
  assert.equal(inspect(order, { ...remote, created_at: '2026-10-13T08:00:00Z' }).status, 'Mismatch');
});
test('cancelled shipment keeps the paid website order active for replacement', () => {
  const result = inspect(order, { ...remote, status: 'CANCELED', status_code: 5 });
  assert.equal(result.status, 'Cancelled');
  assert.equal(result.orderStatus, 'Processing');
});
test('new and ready-to-ship records are not reported as dispatched', () => {
  assert.equal(inspect(order, remote).orderStatus, 'Processing');
  assert.equal(inspect(order, { ...remote, status: 'READY TO SHIP', status_code: 3 }).orderStatus, 'Processing');
});
test('actual dispatch and delivery statuses are mapped correctly', () => {
  assert.equal(inspect(order, { ...remote, status: 'SHIPPED', status_code: 6 }).orderStatus, 'Shipped');
  assert.equal(inspect(order, { ...remote, status: 'DELIVERED', status_code: 7 }).orderStatus, 'Delivered');
});
test('insufficient identity data blocks automatic replacement', () => {
  assert.equal(inspect(order, { ...remote, customer_email: null }).status, 'NeedsReview');
  assert.equal(inspect(order, { ...remote, total: 'unknown' }).status, 'NeedsReview');
  assert.equal(inspect(order, { ...remote, shipments: [] }).status, 'NeedsReview');
});
test('new shipping references must match the full saved reference', () => {
  const replacement = { ...order, shiprocket: { reference: 'KAAVU00001-unique-S2' } };
  assert.equal(inspect(replacement, remote).status, 'Mismatch');
  assert.equal(inspect(replacement, { ...remote, channel_order_id: replacement.shiprocket.reference }).status, 'Created');
});
