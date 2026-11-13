/* Commerce contract checks. Requires the isolated preview server on port 4173. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Module = require('node:module');
const { execFileSync } = require('node:child_process');
const esbuild = require('esbuild');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'http://127.0.0.1:4173';
const ORIGINAL_COMMIT = '519d00e4b2c6e89490acdbccb726502d4534a526';
const rawFetch = globalThis.fetch;
const checks = [];
const checked = (name, action) => { action(); checks.push(name); };
const plain = value => JSON.parse(JSON.stringify(value));

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { if (this.rejectKey === key) throw new Error('Intentional storage quota simulation'); this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

function loadESM(filename) {
  const result = esbuild.buildSync({
    entryPoints: [path.join(ROOT, filename)], bundle: true, write: false,
    format: 'cjs', platform: 'node', target: 'node20', logLevel: 'silent',
  });
  const bundled = new Module(path.join(ROOT, '__in_memory_commerce_test__.cjs'), module);
  bundled.filename = path.join(ROOT, '__in_memory_commerce_test__.cjs');
  bundled.paths = module.paths;
  bundled._compile(result.outputFiles[0].text, bundled.filename);
  return bundled.exports;
}

async function main() {
  // Read-only safety gate runs before constructing commerce or sending an order.
  const statusResponse = await rawFetch(`${BASE}/__preview/status`, { signal: AbortSignal.timeout(5000) });
  assert.equal(statusResponse.status, 200, 'Start npm run preview before commerce tests.');
  const status = await statusResponse.json();
  checked('localhost server explicitly confirms simulation and no external writes', () => {
    assert.equal(status.simulation, true);
    assert.equal(status.mode, 'local-preview');
    assert.equal(status.externalWrites, false);
  });

  const storage = new MemoryStorage();
  const savedGlobals = Object.fromEntries(['localStorage', 'YASHBI_CONFIG', 'YASHBI_LOCAL_PREVIEW', 'location', 'window'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  let externalRequests = 0;
  let orderRequests = 0;
  let failOrderCreation = false;
  globalThis.localStorage = storage;
  globalThis.window = globalThis;
  globalThis.YASHBI_CONFIG = { apiUrl: `${BASE}/__preview/api`, storeName: 'Yashbi Store' };
  globalThis.YASHBI_LOCAL_PREVIEW = true;
  globalThis.location = { href: `${BASE}/`, search: '?source=whatsapp' };
  const inFlight = new Set();
  globalThis.fetch = (input, options = {}) => {
    const target = new URL(String(input));
    if (target.origin !== BASE) {
      externalRequests += 1;
      return Promise.reject(new Error(`External request blocked: ${target.origin}`));
    }
    if (failOrderCreation && options.body && JSON.parse(options.body).action === 'createOrder') {
      return Promise.reject(new Error('Intentional offline simulation; no HTTP request sent.'));
    }
    if (options.body && ['createOrder', 'syncOrder'].includes(JSON.parse(options.body).action)) orderRequests += 1;
    const pending = rawFetch(input, options).then(response => {
      assert.ok(response.status < 400, `Unexpected local HTTP ${response.status}: ${target.pathname}`);
      return response;
    });
    inFlight.add(pending);
    pending.finally(() => inFlight.delete(pending)).catch(() => {});
    return pending;
  };

  try {
    const { products, money, imageForColor, imageSources } = loadESM('src/catalog.js');
    const { createCommerce, STORE_KEYS, shippingCost } = loadESM('src/commerce.js');
    const originalSource = execFileSync('git', ['show', `${ORIGINAL_COMMIT}:assets/app.js`], { cwd: ROOT, encoding: 'utf8' });
    const literal = originalSource.match(/const PRODUCTS = (\[[\s\S]*?\n\]);/);
    assert.ok(literal, 'Original product catalogue literal must be available.');
    const originalProducts = vm.runInNewContext(`(${literal[1]})`);
    checked('all 30 original commercial product records are unchanged', () => {
      assert.equal(products.length, 30);
      assert.equal(originalProducts.length, 30);
      for (let index = 0; index < originalProducts.length; index++) {
        for (const [field, value] of Object.entries(originalProducts[index])) {
          if (field === 'image' || field === 'alt') continue;
          assert.deepEqual(plain(products[index][field]), plain(value), `${products[index].id}.${field}`);
        }
      }
    });
    let variantReferences = 0;
    checked('58 active colour references point to existing local RGBA assets', () => {
      for (const product of products) {
        for (const color of product.colors) {
          const file = imageForColor(product, color);
          assert.match(file, /^assets\/images\/cutout\/[a-z0-9-]+\.png$/);
          assert.ok(fs.existsSync(path.join(ROOT, file)), `${product.id}: ${color}`);
          const png = fs.readFileSync(path.join(ROOT, file));
          assert.equal(png.subarray(1, 4).toString(), 'PNG');
          assert.equal(png[25], 6, `${file} must use RGBA PNG colour type.`);
          assert.equal(imageSources(product, color)[0], file);
          variantReferences += 1;
        }
      }
      assert.equal(variantReferences, 58);
    });

    const commerce = createCommerce(products);
    checked('fresh commerce has empty cart, orders and visitor', () => {
      assert.deepEqual(commerce.state.cart, []);
      assert.deepEqual(commerce.state.orders, []);
      assert.equal(commerce.state.visitor, null);
      assert.equal(commerce.state.simulation, true);
    });
    let notifications = 0;
    const unsubscribe = commerce.subscribe(() => { notifications += 1; });
    commerce.add('GW-001', 'Champagne', 'M');
    commerce.add('SW-001', 'Nude', '38');
    commerce.setQty('GW-001-Champagne-M', 1);
    checked('variant cart, quantity, subtotal and shipping retain IDR arithmetic', () => {
      assert.equal(commerce.state.cart.length, 2);
      assert.equal(commerce.state.cart[0].qty, 2);
      assert.equal(commerce.subtotal(), 2267000);
      assert.equal(shippingCost('J&T Regular - Rp18.000'), 18000);
      assert.equal(shippingCost('Ambil di toko - Gratis'), 0);
      assert.match(money(2285000), /2\.285\.000/);
      assert.throws(() => commerce.add('GW-001', 'Nonexistent', 'M'), /warna dan ukuran/);
      assert.throws(() => commerce.add('GW-001', 'Champagne', '99'), /warna dan ukuran/);
    });
    commerce.setVisitor('Local Contract QA');
    const restoredBeforeCheckout = createCommerce(products);
    checked('existing localStorage cart and visitor restore without changing variants', () => {
      assert.deepEqual(restoredBeforeCheckout.state.cart, commerce.state.cart);
      assert.equal(restoredBeforeCheckout.state.visitor.name, 'Local Contract QA');
      assert.ok(restoredBeforeCheckout.state.visitor.sessionId);
    });

    const customer = {
      name: 'Pembeli Simulasi Contract', phone: '081211111111', email: 'preview@example.test',
      address: 'Jalan Simulasi 1', city: 'Surabaya', postal: '60271',
      courier: 'J&T Regular - Rp18.000', paymentMethod: 'QRIS',
    };
    const proof = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+iLqQAAAAASUVORK5CYII=';
    const requestsBeforeStorageFailure = orderRequests;
    storage.rejectKey = STORE_KEYS.orders;
    await assert.rejects(commerce.checkout(customer, proof), /Penyimpanan perangkat/);
    storage.rejectKey = null;
    checked('unavailable order storage preserves cart and prevents a backend order request', () => {
      assert.equal(commerce.state.cart.length, 2);
      assert.equal(commerce.state.orders.length, 0);
      assert.equal(commerce.state.pending, false);
      assert.equal(orderRequests, requestsBeforeStorageFailure);
    });
    storage.rejectKey = STORE_KEYS.cart;
    checked('unavailable cart storage rejects quantity changes without mutating memory', () => {
      assert.throws(() => commerce.setQty('GW-001-Champagne-M', 1), /Penyimpanan perangkat/);
      assert.equal(commerce.state.cart[0].qty, 2);
    });
    storage.rejectKey = null;
    const checkoutPromise = commerce.checkout(customer, proof);
    assert.equal(commerce.checkout(customer, proof), checkoutPromise, 'Duplicate submit must reuse the pending checkout.');
    const order = await checkoutPromise;
    checked('local checkout persists complete variants and clears the cart after storage', () => {
      assert.match(order.id, /^PREVIEW-\d{6}-\d{3}$/);
      assert.equal(order.syncState, 'Tersinkron');
      assert.equal(order.simulation, true);
      assert.equal(order.subtotal, 2267000);
      assert.equal(order.shipping, 18000);
      assert.equal(order.total, 2285000);
      assert.equal(order.source, 'WhatsApp');
      assert.deepEqual(order.items.map(item => [item.productId, item.color, item.size, item.qty]), [
        ['GW-001', 'Champagne', 'M', 2], ['SW-001', 'Nude', '38', 1],
      ]);
      assert.equal(commerce.state.cart.length, 0);
      assert.equal(JSON.parse(storage.getItem(STORE_KEYS.orders))[0].id, order.id);
      assert.equal(new URL(order.invoiceUrl).origin, BASE);
      assert.equal(new URL(order.invoiceViewUrl).origin, BASE);
    });
    const invoiceResponse = await fetch(order.invoiceUrl);
    const pdf = Buffer.from(await invoiceResponse.arrayBuffer());
    checked('real invoice PDF bytes include order, customer, products and simulation warning', () => {
      assert.match(invoiceResponse.headers.get('content-type'), /application\/pdf/);
      assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
      assert.ok(pdf.length > 1000);
      const text = pdf.toString('latin1');
      for (const value of [order.id, customer.name, 'GW-001', 'SW-001', 'Champagne', 'Nude', '2.285.000', 'NOT PROOF OF PAYMENT']) assert.ok(text.includes(value), `PDF missing ${value}`);
    });
    assert.equal((await commerce.track(order.id, '6281211111111'))?.id, order.id);
    assert.equal(await commerce.track(order.id, '081299999999'), null);
    checks.push('tracking matches normalized WhatsApp and rejects mismatched WhatsApp');

    commerce.add('SP-001', 'Tan', '42');
    failOrderCreation = true;
    const queuedOrder = await commerce.checkout(customer, proof);
    checked('offline checkout durably queues the original idempotent payload', () => {
      assert.equal(queuedOrder.syncState, 'Antrean perangkat ini');
      assert.equal(commerce.state.queue.length, 1);
      const queued = JSON.parse(storage.getItem(STORE_KEYS.queue))[0].payload;
      assert.equal(queued.action, 'syncOrder');
      assert.equal(queued.clientOrderId, queuedOrder.clientOrderId);
      assert.equal(queued.proof, proof);
      assert.equal(queued.items[0].productId, 'SP-001');
    });
    const queuedPayload = plain(commerce.state.queue[0].payload);
    failOrderCreation = false;
    await commerce.syncQueue();
    const synced = commerce.state.orders.find(value => value.clientOrderId === queuedOrder.clientOrderId);
    checked('retry sync updates the saved order ID and invoice URLs and clears its queue', () => {
      assert.match(synced.id, /^PREVIEW-/);
      assert.equal(synced.syncState, 'Tersinkron');
      assert.ok(synced.invoiceUrl && synced.invoiceViewUrl);
      assert.equal(commerce.state.queue.length, 0);
      const stored = JSON.parse(storage.getItem(STORE_KEYS.orders)).find(value => value.clientOrderId === queuedOrder.clientOrderId);
      assert.equal(stored.id, synced.id);
      assert.equal(stored.invoiceUrl, synced.invoiceUrl);
    });
    const duplicate = await fetch(`${BASE}/__preview/api`, { method: 'POST', body: JSON.stringify(queuedPayload) }).then(response => response.json());
    checked('repeated clientOrderId reuses the same server order', () => {
      assert.equal(duplicate.ok, true);
      assert.equal(duplicate.order.id, synced.id);
      assert.equal(duplicate.order.duplicate, true);
    });
    const restored = createCommerce(products);
    checked('purchase records and invoice links survive commerce recreation', () => {
      assert.equal(restored.state.orders.length, 2);
      assert.equal(restored.state.cart.length, 0);
      assert.equal(restored.state.queue.length, 0);
      assert.equal(restored.state.visitor.name, 'Local Contract QA');
      assert.ok(restored.state.orders.every(value => value.invoiceUrl));
      assert.ok(notifications >= 7);
    });
    unsubscribe();
    await Promise.allSettled([...inFlight]);
    checked('all intercepted commerce requests stayed on the isolated localhost origin', () => assert.equal(externalRequests, 0));
    console.log(JSON.stringify({ ok: true, suite: 'commerce', passed: checks.length, products: products.length, variantReferences, invoiceBytes: pdf.length, externalRequests }));
  } finally {
    await Promise.allSettled([...inFlight]);
    globalThis.fetch = rawFetch;
    for (const [key, descriptor] of Object.entries(savedGlobals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
