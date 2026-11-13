/* Commerce state only. UI, modals, canvas and layout belong to their own modules. */
export const STORE_KEYS = {
  cart: 'yashbi_cart_v1', orders: 'yashbi_orders_v1',
  visitor: 'yashbi_visitor_v1', queue: 'yashbi_sync_queue_v1',
};

const newId = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
const normalizePhone = value => String(value || '').replace(/\D/g, '').replace(/^62/, '0').replace(/^8/, '08');
const apiUrl = () => String(globalThis.YASHBI_CONFIG?.apiUrl || '').trim();
export function shippingCost(courier) {
  const match = String(courier || '').match(/Rp([\d.]+)/);
  return match ? Number(match[1].replace(/\./g, '')) : 0;
}

export function readAndCompressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error('Gunakan gambar JPG, PNG, atau WEBP.'));
    if (file.size > 5 * 1024 * 1024) return reject(new Error('Ukuran bukti maksimal 5 MB.'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gambar gagal dibaca.'));
    reader.onload = event => {
      const image = new Image();
      image.onerror = () => reject(new Error('Format gambar tidak didukung.'));
      image.onload = () => {
        const scale = Math.min(1, 1200 / image.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        if (!context) return reject(new Error('Gambar gagal diproses.'));
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      image.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export function createCommerce(catalog) {
  const list = Array.isArray(catalog) ? catalog : catalog?.products;
  if (!Array.isArray(list) || !list.length) throw new Error('Katalog belum tersedia.');
  const byId = new Map(list.map(product => [product.id, product]));
  const listeners = new Set();
  let storageWarning = '';
  const load = (key, fallback) => {
    try {
      const value = JSON.parse(globalThis.localStorage?.getItem(key) || 'null');
      return value === null ? fallback : value;
    } catch { return fallback; }
  };
  const save = (key, value) => {
    try {
      if (!globalThis.localStorage) throw new Error('Storage unavailable');
      globalThis.localStorage.setItem(key, JSON.stringify(value));
    } catch { throw new Error('Penyimpanan perangkat penuh atau tidak tersedia. Kosongkan ruang lalu coba lagi.'); }
  };
  const loadedCart = load(STORE_KEYS.cart, []);
  let cart = Array.isArray(loadedCart) ? loadedCart.filter(item => {
    const product = byId.get(item?.productId);
    return product && product.colors.includes(item.color) && product.sizes.includes(String(item.size)) && Number.isInteger(item.qty) && item.qty > 0;
  }).map(item => ({ ...item, size: String(item.size) })) : [];
  const loadedOrders = load(STORE_KEYS.orders, []);
  let orders = Array.isArray(loadedOrders) ? loadedOrders : [];
  const loadedVisitor = load(STORE_KEYS.visitor, null);
  let visitor = loadedVisitor && typeof loadedVisitor.name === 'string' ? loadedVisitor : null;
  const loadedQueue = load(STORE_KEYS.queue, []);
  let queue = Array.isArray(loadedQueue) ? loadedQueue : [];
  let pending = false;
  let error = '';
  let queuePromise = null;
  let checkoutPromise = null;
  const params = new URLSearchParams(globalThis.location?.search || '');
  const source = String(params.get('source') || params.get('src') || '').trim().toLowerCase();
  const orderSource = ['wa', 'whatsapp'].includes(source) ? 'WhatsApp' : ['chat', 'chatbot'].includes(source) ? 'Chatbot' : 'Website';
  const state = () => ({ cart, orders, visitor, queue, pending, error, storageWarning, simulation: Boolean(globalThis.YASHBI_LOCAL_PREVIEW) });
  const emit = () => { const value = state(); for (const listener of listeners) listener(value); };
  const subtotal = () => cart.reduce((sum, item) => sum + byId.get(item.productId).price * item.qty, 0);
  const commitCart = next => { save(STORE_KEYS.cart, next); cart = next; error = ''; emit(); return cart; };
  const saveOrders = next => {
    try { save(STORE_KEYS.orders, next); }
    catch {
      // A proof was already uploaded remotely or is separately held in the durable
      // sync queue. Keep the useful purchase record when image data fills storage.
      const compact = next.map(order => ({ ...order, proof: order.proof ? 'Bukti tersimpan bersama pesanan.' : undefined }));
      save(STORE_KEYS.orders, compact);
      next = compact;
    }
    orders = next;
  };
  async function postApi(payload) {
    const endpoint = apiUrl();
    if (!endpoint) throw new Error('Backend belum dikonfigurasi.');
    const response = await fetch(endpoint, {
      method: 'POST', redirect: 'follow', body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error('Server tidak dapat menerima data.');
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || 'Permintaan ditolak server.');
    return result;
  }
  async function syncVisitor(status = 'Online / Tanya', orderId = '') {
    if (!visitor || !apiUrl()) return false;
    try {
      await postApi({ action: 'upsertVisitor', sessionId: visitor.sessionId, name: visitor.name, status, orderId });
      return true;
    } catch { return false; }
  }
  function setVisitor(name) {
    const trimmed = String(name || '').trim().slice(0, 60);
    if (!trimmed) throw new Error('Isi nama panggilan terlebih dahulu.');
    const next = { sessionId: visitor?.sessionId || newId('VIS'), name: trimmed, createdAt: visitor?.createdAt || new Date().toISOString() };
    save(STORE_KEYS.visitor, next);
    visitor = next;
    emit();
    void syncVisitor();
    return visitor;
  }
  function add(id, color, size) {
    const product = byId.get(id);
    const chosenSize = String(size || '');
    if (!product || !product.colors.includes(color) || !product.sizes.includes(chosenSize)) throw new Error('Pilih warna dan ukuran terlebih dahulu.');
    const selectedCount = cart.filter(item => item.productId === id).reduce((sum, item) => sum + item.qty, 0);
    if (selectedCount >= product.stock) throw new Error('Jumlah pilihan sudah mencapai stok produk.');
    const key = `${id}-${color}-${chosenSize}`;
    const next = cart.map(item => ({ ...item }));
    let line = next.find(item => item.key === key);
    if (line) line.qty += 1;
    else { line = { key, productId: id, color, size: chosenSize, qty: 1 }; next.push(line); }
    commitCart(next);
    return line;
  }
  function remove(key) { return commitCart(cart.filter(item => item.key !== key)); }
  function setQty(key, delta) {
    const item = cart.find(value => value.key === key);
    if (!item) return cart;
    const change = Math.trunc(Number(delta));
    if (!Number.isFinite(change)) return cart;
    const qty = item.qty + change;
    if (qty <= 0) return remove(key);
    const total = cart.filter(value => value.productId === item.productId).reduce((sum, value) => sum + value.qty, 0) + change;
    if (total > byId.get(item.productId).stock) throw new Error('Jumlah pilihan sudah mencapai stok produk.');
    return commitCart(cart.map(value => value.key === key ? { ...value, qty } : value));
  }
  const payloadFor = (order, action = 'createOrder') => ({
    action, clientOrderId: order.clientOrderId, sessionId: visitor?.sessionId || '',
    customer: order.customer,
    items: order.items.map(item => ({ ...item, name: item.name || byId.get(item.productId)?.name, price: Number(item.price ?? byId.get(item.productId)?.price) })),
    subtotal: order.subtotal, shipping: order.shipping, proof: order.proof,
    source: order.source, paymentMethod: order.customer.paymentMethod || 'QRIS',
  });
  function checkout(customer, proof) {
    if (checkoutPromise) return checkoutPromise;
    checkoutPromise = performCheckout(customer, proof).finally(() => { checkoutPromise = null; });
    return checkoutPromise;
  }
  async function performCheckout(customer, proof) {
    if (!cart.length) throw new Error('Keranjang masih kosong.');
    if (!proof || !/^data:image\/(jpeg|png|webp);base64,/.test(proof)) throw new Error('Unggah bukti pembayaran terlebih dahulu.');
    const data = Object.fromEntries(Object.entries(customer || {}).filter(([key]) => key !== 'proof').map(([key, value]) => [key, String(value ?? '').trim()]));
    if (!data.name || !normalizePhone(data.phone) || !data.address || !data.city || !data.postal || !data.courier) throw new Error('Lengkapi nama, WhatsApp dan alamat pengiriman.');
    const now = new Date();
    const localId = `TMP-${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(orders.length + 1).padStart(3, '0')}`;
    const items = cart.map(item => ({ ...item, name: byId.get(item.productId).name, price: byId.get(item.productId).price }));
    const shipping = shippingCost(data.courier);
    const order = { id: localId, clientOrderId: newId('YSH'), createdAt: now.toISOString(), customer: data, items, subtotal: subtotal(), shipping, total: subtotal() + shipping, status: 'Menunggu Verifikasi Pembayaran', proof, source: orderSource, syncState: 'Mencoba sinkron' };
    // Ensure a purchase record can be stored before sending any remote request.
    saveOrders([order, ...orders]);
    pending = true; error = ''; storageWarning = ''; emit();
    try {
      try {
        const result = await postApi(payloadFor(order));
        if (!result.order?.id) throw new Error('Server belum mengembalikan nomor pesanan.');
        Object.assign(order, result.order, { syncState: 'Tersinkron' });
      } catch (failure) {
        order.syncError = failure.message;
        order.status = 'Menunggu sinkronisasi';
        order.syncState = 'Antrean perangkat ini';
        const next = [...queue.filter(item => item.payload?.clientOrderId !== order.clientOrderId), { payload: payloadFor(order, 'syncOrder'), queuedAt: now.toISOString() }];
        save(STORE_KEYS.queue, next);
        queue = next;
      }
      saveOrders([order, ...orders.filter(item => item.clientOrderId !== order.clientOrderId)]);
      try { save(STORE_KEYS.cart, []); }
      catch (failure) { storageWarning = failure.message; }
      cart = [];
      void syncVisitor(order.status, order.id);
      return order;
    } catch (failure) {
      error = failure.message;
      // Keep the cart available when neither the backend nor the durable queue
      // can safely retain the order. The local record remains visible for review.
      throw Object.assign(failure, { order });
    } finally { pending = false; emit(); }
  }
  async function track(id, value) {
    const orderId = String(id || '').trim();
    const normalized = normalizePhone(value);
    if (!orderId || !normalized) return null;
    if (apiUrl()) {
      try {
        const endpoint = new URL(apiUrl(), globalThis.location?.href);
        endpoint.searchParams.set('action', 'track'); endpoint.searchParams.set('orderId', orderId); endpoint.searchParams.set('phone', value);
        const response = await fetch(endpoint, { signal: AbortSignal.timeout(15000) });
        const result = await response.json();
        if (response.ok && result.ok && result.order) return result.order;
      } catch { /* Existing saved records remain available when tracking is offline. */ }
    }
    return orders.find(order => String(order.id).toLowerCase() === orderId.toLowerCase() && normalizePhone(order.customer?.phone) === normalized) || null;
  }
  function syncQueue() {
    if (queuePromise) return queuePromise;
    queuePromise = performSync().finally(() => { queuePromise = null; });
    return queuePromise;
  }
  async function performSync() {
    if (!queue.length || globalThis.navigator?.onLine === false || !apiUrl()) return queue;
    for (const item of [...queue]) {
      try {
        const result = await postApi({ ...item.payload, action: 'syncOrder' });
        if (!result.order?.id) continue;
        const order = orders.find(value => value.clientOrderId === item.payload.clientOrderId);
        if (order) {
          const updated = { ...order, ...result.order, syncState: 'Tersinkron' };
          delete updated.syncError;
          saveOrders(orders.map(value => value === order ? updated : value));
        }
        const next = queue.filter(value => value !== item);
        save(STORE_KEYS.queue, next); queue = next;
        emit();
      } catch { /* Preserve failed or unstored payloads for an idempotent retry. */ }
    }
    return queue;
  }
  const api = {
    get state() { return state(); },
    subscribe(listener) { listeners.add(listener); listener(state()); return () => listeners.delete(listener); },
    add, setQty, remove, subtotal, setVisitor, checkout, track, syncQueue,
    syncVisitor, readAndCompressImage, shippingCost,
    getCart: () => cart, getOrders: () => orders, getSubtotal: subtotal,
    addItem: add, changeQty: setQty, removeItem: remove,
    createOrder: checkout, trackOrder: track, compressProof: readAndCompressImage,
    get simulation() { return Boolean(globalThis.YASHBI_LOCAL_PREVIEW); },
  };
  return api;
}
