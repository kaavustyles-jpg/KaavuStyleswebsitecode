const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/inventory.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: exportsObject });
const inv = exportsObject;
const product = { id: 'top', name: 'Peplum top', stock: 3, sizes: ['Free Size'], colors: ['Wine Maroon', 'Blush Pink', 'Mocha Brown'], sizeStock: { 'Free Size': 3 }, variantStock: { 'Free Size': { 'Wine Maroon': 2, 'Blush Pink': 1, 'Mocha Brown': 0 } } };
const item = (color, quantity = 1) => ({ productId: 'top', size: 'Free Size', color, quantity });
test('same size has independent stock for every color', () => {
  assert.equal(inv.stockForVariant(product, 'Free Size', 'Wine Maroon'), 2);
  assert.equal(inv.stockForVariant(product, 'Free Size', 'Mocha Brown'), 0);
  assert.equal(inv.stockForSize(product, 'Free Size'), 3);
  const updated = inv.reduceInventory([product], [item('Wine Maroon')])[0];
  assert.equal(updated.variantStock['Free Size']['Wine Maroon'], 1);
  assert.equal(updated.variantStock['Free Size']['Blush Pink'], 1);
  assert.equal(updated.variantStock['Free Size']['Mocha Brown'], 0);
  assert.equal(updated.stock, 2);
  assert.equal(updated.sizeStock['Free Size'], 2);
  assert.equal(product.variantStock['Free Size']['Wine Maroon'], 2);
});
test('checkout cannot borrow stock from a different color', () => {
  assert.throws(() => inv.reduceInventory([product], [item('Mocha Brown')]), /insufficient stock/);
  assert.throws(() => inv.reduceInventory([product], [item('Wine Maroon', 2), item('Wine Maroon')]), /insufficient stock/);
  assert.doesNotThrow(() => inv.reduceInventory([product], [item('Wine Maroon', 2), item('Blush Pink')]));
});
test('stock totals include only selected sizes and colors', () => {
  const result = inv.variantInventory(['Free Size'], ['Wine Maroon', 'Blush Pink'], product.variantStock);
  assert.equal(result.stock, 3);
  assert.equal(result.variantStock['Free Size']['Mocha Brown'], undefined);
  assert.throws(() => inv.variantInventory(['S'], ['Blue'], { S: { Blue: 1.5 } }), /whole numbers/);
  assert.equal(inv.variantInventory([], [], { Standard: { Standard: 4 } }).stock, 4);
});
test('stock pools and quick add respect color-specific availability', () => {
  assert.equal(inv.sameStockPool(product, 'Free Size', 'Wine Maroon', 'Free Size', 'Blush Pink'), false);
  const available = inv.availableVariant({ ...product, variantStock: { 'Free Size': { 'Wine Maroon': 0, 'Blush Pink': 1 } } });
  assert.equal(available.color, 'Blush Pink');
});
test('legacy products retain shared stock without duplicating it across colors', () => {
  const legacy = { ...product, variantStock: undefined };
  assert.equal(inv.sameStockPool(legacy, 'Free Size', 'Wine Maroon', 'Free Size', 'Blush Pink'), true);
  assert.throws(() => inv.reduceInventory([legacy], [item('Wine Maroon', 2), item('Blush Pink', 2)]), /insufficient stock/);
});
