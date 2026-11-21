const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const read = file => fs.readFileSync(path.join(__dirname, '../backend', file), 'utf8');
function backend() {
  const writes = [];
  const orders = [];
  const lines = [];
  const products = [
    ['jp-001', 'Sheet Suit', '', 1000000, '', 'Sand, Navy', 'M, L', 3],
    ['SW-001', 'Import placeholder', '', 0, '', '', '', 10],
    ['GW-002', 'Inactive', '', 0, '', '', '', 5, '', '', '', '', false],
    ['GW-004', 'Incomplete', '', 300000, '', '', '', 10],
  ];
  const sheet = (name, data) => ({
    getLastRow: () => data.length + 1,
    getRange: (row, col) => ({
      getValues: () => data,
      getDisplayValues: () => data.map(r => [String(r[0])]),
      getValue: () => null,
      setValue(value) {
        writes.push(name);
        if (row > 1) data[row - 2][col - 1] = value;
      },
      setValues(values) { writes.push(name); data.push(...values); },
    }),
    appendRow(row) { writes.push(name); data.push(row); },
  });
  const spreadsheet = { getSheetByName: name => ({
    Produk: sheet('products', products), Pesanan: sheet('orders', orders),
    'Detail Pesanan': sheet('lines', lines),
  })[name] };
  const context = vm.createContext({
    SpreadsheetApp: { openById: () => spreadsheet },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Utilities: { formatDate: () => '261121' },
    Session: { getScriptTimeZone: () => 'Asia/Jakarta' },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: value => ({ setMimeType: () => JSON.parse(value) }) },
    console,
  });
  vm.runInContext(read('OrderCatalog.gs') + '\n' + read('Code.gs'), context);
  context.saveProof_ = () => { writes.push('proof'); return 'fixture-proof'; };
  context.createInvoicePdf_ = () => {
    writes.push('invoice');
    return { viewUrl: 'https://drive.google.com/file/d/1234567890123456789012345/view', downloadUrl: 'fixture-download' };
  };
  context.sendInvoiceNotice_ = () => writes.push('email');
  return {
    writes, orders, lines, products,
    invoke: payload => context.doPost({ postData: { contents: JSON.stringify(payload) } }),
  };
}

const customer = { name: 'Test', phone: '081234567890', city: 'Surabaya', address: 'Fixture address', postal: '60231', email: 'test@example.invalid', courier: 'J&T Regular - Rp18.000' };
const proof = 'data:image/png;base64,aW1hZ2U=';
const order = (items, extra = {}) => ({ action: 'createOrder', customer, proof, items, ...extra });
const suit = { productId: 'JP-001', color: 'Sand', size: 'M', qty: 2 };

test('createOrder writes authoritative catalog and shipping amounts before producing an invoice', () => {
  const b = backend();
  const response = b.invoke(order([{ ...suit, name: 'Wrong name', unitPrice: 1, lineTotal: 1, price: 1 }], {
    subtotal: 1, shipping: 1, shippingCost: 1, grandTotal: 1, total: 1,
  }));
  assert.equal(response.ok, true);
  assert.deepEqual([response.order.subtotal, response.order.shipping, response.order.total], [2000000, 18000, 2018000]);
  assert.deepEqual(Array.from(b.lines[0]).slice(1), ['JP-001', 'Sheet Suit', 'Sand', 'M', 2, 1000000, 2000000]);
  assert.deepEqual(Array.from(b.orders[0]).slice(8, 12), ['J&T Regular', 2000000, 18000, 2018000]);
  assert.ok(b.writes.indexOf('lines') < b.writes.indexOf('invoice'));
  assert.ok(b.writes.includes('email'));
});

test('syncOrder uses the approved server snapshot for known active placeholders', () => {
  const b = backend();
  const response = b.invoke(order([{ productId: 'sw-001', color: 'Pearl', size: '38', qty: 1 }], {
    action: 'syncOrder', customer: { ...customer, courier: 'Ambil di toko — Gratis' },
  }));
  assert.equal(response.ok, true);
  assert.equal(response.order.total, 469000);
  assert.equal(response.order.shipping, 0);
  assert.equal(response.order.items[0].name, 'Odette Pearl Heels');
});

test('input errors are structured, permanent, and have no Sheets, proof, invoice or email writes', () => {
  for (const [item, extras, code] of [
    [{ ...suit, productId: 'GW-999' }, {}, 'INVALID_SKU'],
    [{ ...suit, productId: 'GW-002' }, {}, 'INVALID_SKU'],
    [{ ...suit, productId: 'GW-004' }, {}, 'UNCONFIGURED_SKU'],
    [{ ...suit, color: 'Purple' }, {}, 'INVALID_VARIANT'],
    [{ ...suit, size: 'XXL' }, {}, 'INVALID_VARIANT'],
    [{ ...suit, qty: '2' }, {}, 'INVALID_QUANTITY'],
    [{ ...suit, qty: 0 }, {}, 'INVALID_QUANTITY'],
    [{ ...suit, qty: 1.3 }, {}, 'INVALID_QUANTITY'],
    [{ ...suit, qty: 101 }, {}, 'INVALID_QUANTITY'],
    [suit, { items: [suit, { ...suit, color: 'Navy' }] }, 'INSUFFICIENT_STOCK'],
    [suit, { customer: { ...customer, courier: 'Unknown courier' } }, 'INVALID_SHIPPING'],
    [suit, { proof: '' }, 'INVALID_PROOF'],
  ]) {
    const b = backend();
    const result = b.invoke(order([item], extras));
    assert.equal(result.code, code, JSON.stringify(result));
    assert.equal(result.ok, false);
    assert.equal(result.retryable, false);
    assert.deepEqual(b.writes, [], code);
  }
});

test('idempotent retry returns recorded pricing and invoice without writes', () => {
  const b = backend();
  const first = b.invoke(order([suit], { clientOrderId: 'fixture-id' }));
  b.writes.length = 0;
  b.products[0][3] = 900000;
  const repeat = b.invoke(order([suit], { action: 'syncOrder', clientOrderId: 'fixture-id' }));
  assert.equal(repeat.order.id, first.order.id);
  assert.equal(repeat.order.total, first.order.total);
  assert.equal(repeat.order.items[0].price, 1000000);
  assert.match(repeat.order.invoiceUrl, /export=download/);
  assert.deepEqual(b.writes, []);
});
