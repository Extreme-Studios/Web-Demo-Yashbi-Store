/* Dependency-free local review server. No external writes, payment, email, or AI calls. */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const STATIC_ROOT = path.resolve(ROOT, 'dist');
const PORT = Number(process.env.PORT || 4173);
const MAX_BODY = 8 * 1024 * 1024;
const orders = new Map();
const clients = new Map();
let sequence = 0;
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".mp4": "video/mp4" };
const text = (value, max = 500) => String(value ?? "").trim().slice(0, max);
const phone = value => text(value).replace(/\D/g, "").replace(/^62/, "0").replace(/^8/, "08");
const amount = value => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
const rupiah = value => `Rp ${Math.round(amount(value)).toLocaleString("id-ID")}`;
const ascii = value => text(value, 10000).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7e]/g, " ").replace(/\s+/g, " ");
const escapePdf = value => ascii(value).replace(/([\\()])/g, "\\$1");

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  if (Number(req.headers["content-length"]) > MAX_BODY) {
    req.resume();
    throw Object.assign(new Error("Ukuran permintaan melebihi 8 MB."), { status: 413 });
  }
  let total = 0;
  const chunks = [];
  await new Promise((resolve, reject) => {
    req.on("data", chunk => { total += chunk.length; if (total <= MAX_BODY) chunks.push(chunk); });
    req.on("end", () => total > MAX_BODY ? reject(Object.assign(new Error("Ukuran permintaan melebihi 8 MB."), { status: 413 })) : resolve());
    req.on("error", reject);
  });
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); }
  catch { throw Object.assign(new Error("JSON tidak valid."), { status: 400 }); }
}

function wrap(value, max) {
  const words = ascii(value).split(" ");
  const lines = [];
  let line = "";
  for (const original of words) {
    const pieces = original.length > max ? original.match(new RegExp(`.{1,${max}}`, "g")) : [original];
    for (const word of pieces || []) {
      if (line && line.length + word.length + 1 > max) { lines.push(line); line = word; }
      else line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : ["-"];
}

function invoicePdf(order) {
  const pages = [];
  let commands = [];
  let y = 0;
  const ink = "0.094 0.094 0.094";
  const muted = "0.36 0.345 0.32";
  const gold = "0.55 0.45 0.33";
  function draw(value, x, top, size = 10, font = "F1", color = ink) {
    commands.push(`BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x} ${top} Tm (${escapePdf(value)}) Tj ET`);
  }
  function rule(top) { commands.push(`0.84 0.82 0.78 RG 0.5 w 42 ${top} m 553 ${top} l S`); }
  function newPage() {
    if (commands.length) pages.push(commands.join("\n"));
    commands = [];
    commands.push("0.973 0.969 0.957 rg 0 0 595 842 re f");
    draw("YASHBI STORE", 42, 785, 25, "F3");
    draw("LOCAL PREVIEW", 437, 791, 10, "F2", gold);
    draw("SIMULATED INVOICE", 42, 756, 9, "F2", gold);
    draw("PREVIEW SIMULATION - NOT PROOF OF PAYMENT", 42, 737, 9, "F2");
    rule(719);
    draw(`${order.id}  |  Page ${pages.length + 1}`, 42, 30, 8, "F1", muted);
    draw("No order, payment, email or shipment sent to the store.", 42, 44, 8, "F1", muted);
    y = 694;
  }
  function ensure(height) { if (y - height < 77) newPage(); }
  function paragraph(value, { size = 10, font = "F1", color = ink, max = 86, gap = 6 } = {}) {
    for (const line of wrap(value, max)) { ensure(size + 5); draw(line, 42, y, size, font, color); y -= size + 5; }
    y -= gap;
  }
  newPage();
  paragraph(`ORDER  ${order.id}`, { size: 15, font: "F2" });
  paragraph(`Created ${new Date(order.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB`, { size: 9, color: muted });
  paragraph(`Status: ${order.status}`, { size: 10, font: "F2" });
  paragraph("BUYER & DELIVERY", { size: 8, font: "F2", color: gold });
  paragraph(order.customer.name, { size: 13, font: "F3" });
  paragraph(`${order.customer.address}, ${order.customer.city} ${order.customer.postal}`, { size: 10 });
  paragraph(`WhatsApp: ${order.customer.phone} | Email: ${order.customer.email || "-"}`, { size: 9, color: muted });
  paragraph(`Courier: ${order.customer.courier || "-"} | Selected method: ${order.paymentMethod}`, { size: 9, color: muted });
  ensure(60);
  rule(y + 4);
  y -= 16;
  function itemHeader() {
    draw("PRODUCT / VARIANT", 42, y, 8, "F2", gold);
    draw("QTY", 338, y, 8, "F2", gold);
    draw("UNIT PRICE", 381, y, 8, "F2", gold);
    draw("AMOUNT", 478, y, 8, "F2", gold);
    y -= 24;
  }
  itemHeader();
  for (const item of order.items) {
    const name = wrap(`${item.productId}  ${item.name}`, 46);
    const variant = wrap(`${item.color} / ${item.size}`, 48);
    const height = name.length * 14 + variant.length * 12 + 20;
    if (y - height < 77) { newPage(); itemHeader(); }
    name.forEach((line, index) => draw(line, 42, y - index * 14, 10, "F2"));
    variant.forEach((line, index) => draw(line, 42, y - name.length * 14 - index * 12, 9, "F1", muted));
    draw(String(item.qty), 342, y, 10);
    draw(rupiah(item.price), 381, y, 9);
    draw(rupiah(item.qty * item.price), 478, y, 9, "F2");
    y -= height;
    rule(y + 8);
    y -= 10;
  }
  ensure(148);
  y -= 12;
  draw("SUBTOTAL", 327, y, 9, "F1", muted); draw(rupiah(order.subtotal), 465, y, 10);
  y -= 25;
  draw("SHIPPING", 327, y, 9, "F1", muted); draw(rupiah(order.shipping), 465, y, 10);
  y -= 36;
  commands.push(`0.094 0.094 0.094 rg 320 ${y - 13} 233 36 re f`);
  draw("SIMULATED TOTAL", 331, y, 9, "F2", "1 1 1"); draw(rupiah(order.total), 459, y, 12, "F2", "1 1 1");
  y -= 53;
  paragraph("This PDF is a local preview simulation. Do not transfer money. It does not confirm payment or create a real purchase.", { size: 9, color: muted, max: 95 });
  pages.push(commands.join("\n"));

  const objects = [null, "<< /Type /Catalog /Pages 2 0 R >>", "", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>"];
  const kids = [];
  for (const content of pages) {
    const pageId = objects.length;
    const streamId = pageId + 1;
    kids.push(`${pageId} 0 R`);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${streamId} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(content, "ascii")} >>\nstream\n${content}\nendstream`);
  }
  objects[2] = `<< /Type /Pages /Count ${pages.length} /Kids [${kids.join(" ")}] >>`;
  let pdf = "%PDF-1.4\n%YashbiLocalPreview\n";
  const offsets = [0];
  for (let index = 1; index < objects.length; index++) { offsets[index] = Buffer.byteLength(pdf, "ascii"); pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`; }
  const xref = Buffer.byteLength(pdf, "ascii");
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let index = 1; index < objects.length; index++) pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "ascii");
}

function createOrder(payload, origin) {
  if (!payload.customer || !Array.isArray(payload.items) || !payload.items.length || payload.items.length > 200) throw Object.assign(new Error("Data pesanan simulasi tidak lengkap."), { status: 400 });
  const clientId = text(payload.clientOrderId, 100);
  if (clientId && clients.has(clientId)) return { ...orders.get(clients.get(clientId)), duplicate: true };
  const customer = Object.fromEntries(["name", "phone", "email", "address", "city", "postal", "courier"].map(key => [key, text(payload.customer[key])]));
  if (!customer.name || !phone(customer.phone)) throw Object.assign(new Error("Nama dan WhatsApp diperlukan untuk simulasi."), { status: 400 });
  const items = payload.items.map(item => ({ productId: text(item.productId, 32), name: text(item.name, 160), color: text(item.color, 100), size: text(item.size, 40), qty: Math.max(1, Math.min(999, Math.floor(amount(item.qty) || 1))), price: amount(item.price) }));
  const createdAt = new Date().toISOString();
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "2-digit", month: "2-digit", day: "2-digit" }).format(new Date()).replace(/\D/g, "");
  const id = `PREVIEW-${date}-${String(++sequence).padStart(3, "0")}`;
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const shipping = amount(payload.shipping);
  const invoiceUrl = `${origin}/__preview/invoice/${id}.pdf`;
  const order = { id, clientOrderId: clientId, createdAt, customer, items, subtotal, shipping, total: subtotal + shipping, paymentMethod: text(payload.paymentMethod || payload.customer.paymentMethod || "QRIS", 40), status: "Simulasi - Menunggu Verifikasi Pembayaran", simulation: true, invoiceUrl, invoiceViewUrl: `${invoiceUrl}?view=1` };
  orders.set(id, order);
  if (clientId) clients.set(clientId, id);
  return order;
}

function chatReply(payload) {
  const message = text(payload.message, 801);
  if (!message || message.length > 800) throw Object.assign(new Error("Pesan harus diisi dan maksimal 800 karakter."), { status: 400 });
  const catalog = Array.isArray(payload.catalog) ? payload.catalog.slice(0, 50) : [];
  const query = message.toLowerCase();
  if (/pesanan|resi|pembayaran|transfer|bayar|order/.test(query)) return "[Local Preview · Respons simulasi] Pesanan pada preview ini hanya simulasi lokal. Gunakan Cek Pesanan dengan nomor PREVIEW dan WhatsApp yang sama. Jangan melakukan pembayaran; tidak ada pesanan atau email yang dikirim ke toko.";
  const category = /sepatu/.test(query) ? (/pria/.test(query) ? "sepatu pria" : /wanita/.test(query) ? "sepatu wanita" : "sepatu") : /gaun/.test(query) ? "gaun wanita" : /jas/.test(query) ? "jas pria" : "";
  const tokens = query.split(/[^a-z0-9]+/).filter(token => token.length >= 3);
  const selected = catalog.filter(product => !category || String(product.category).toLowerCase().includes(category)).map(product => ({ product, score: tokens.reduce((score, token) => score + (`${product.name} ${product.category} ${(product.colors || []).join(" ")} ${(product.sizes || []).join(" ")}`.toLowerCase().includes(token) ? 1 : 0), 0) })).sort((a, b) => b.score - a.score).slice(0, 3).map(({ product }) => `${text(product.name, 100)} (${text(product.id, 32)}) - ${rupiah(product.price)}`);
  return selected.length ? `[Local Preview · Respons simulasi] Dari katalog di halaman ini, coba ${selected.join("; ")}. Buka produk untuk memilih warna dan ukuran. Respons ini contoh lokal; layanan AI live belum diuji.` : "[Local Preview · Respons simulasi] Coba jelaskan gaun, jas, atau sepatu yang kamu cari. Katalog yang cocok belum ditemukan. Layanan AI live belum diuji.";
}

const server = http.createServer(async (req, res) => {
  try {
    const host = String(req.headers.host || "");
    if (!new RegExp(`^(127\\.0\\.0\\.1|localhost):${PORT}$`, "i").test(host)) return json(res, 403, { ok: false, error: "Host preview tidak diizinkan." });
    const origin = `http://${host}`;
    if (req.headers.origin && req.headers.origin !== origin) return json(res, 403, { ok: false, error: "Origin preview tidak diizinkan." });
    const url = new URL(req.url, origin);
    if (url.pathname === "/__preview/status") return json(res, 200, { ok: true, simulation: true, mode: "local-preview", externalWrites: false, storedOrders: orders.size });
    if (url.pathname === "/__preview/api") {
      if (req.method === "GET") {
        if (url.searchParams.get("action") === "track") {
          const order = orders.get(text(url.searchParams.get("orderId"), 100).toUpperCase());
          return json(res, 200, order && phone(order.customer.phone) === phone(url.searchParams.get("phone")) ? { ok: true, order: { id: order.id, createdAt: order.createdAt, status: order.status, simulation: true } } : { ok: false, error: "Pesanan simulasi tidak ditemukan." });
        }
        return json(res, 200, { ok: true, products: [], images: [], simulation: true });
      }
      if (req.method !== "POST") return json(res, 405, { ok: false, error: "Method tidak didukung." });
      const payload = await readBody(req);
      if (["createOrder", "syncOrder"].includes(payload.action)) return json(res, 200, { ok: true, order: createOrder(payload, origin), simulation: true });
      if (payload.action === "upsertVisitor") return json(res, 200, { ok: true, simulation: true });
      return json(res, 400, { ok: false, error: "Aksi ini tidak tersedia di Local Preview. Tidak ada data toko yang diubah." });
    }
    if (url.pathname === "/api/chat") {
      if (req.method !== "POST") return json(res, 405, { error: "Method tidak didukung." });
      return json(res, 200, { reply: chatReply(await readBody(req)), simulation: true });
    }
    const invoiceMatch = url.pathname.match(/^\/__preview\/invoice\/(PREVIEW-[A-Z0-9-]+)\.pdf$/);
    if (invoiceMatch) {
      if (!["GET", "HEAD"].includes(req.method)) return json(res, 405, { ok: false, error: "Method tidak didukung." });
      const order = orders.get(invoiceMatch[1]);
      if (!order) return json(res, 404, { ok: false, error: "Invoice simulasi tidak ditemukan. Server mungkin baru dimulai ulang." });
      const pdf = invoicePdf(order);
      res.writeHead(200, { "Content-Type": "application/pdf", "Content-Length": pdf.length, "Content-Disposition": `${url.searchParams.has("view") ? "inline" : "attachment"}; filename="Invoice-${order.id}.pdf"`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
      return res.end(req.method === "HEAD" ? undefined : pdf);
    }
    if (!["GET", "HEAD"].includes(req.method)) return json(res, 405, { ok: false, error: "Method tidak didukung." });
    if (url.pathname === "/favicon.ico") { res.writeHead(204); return res.end(); }
    let requestPath;
    try { requestPath = decodeURIComponent(url.pathname); } catch { return json(res, 400, { ok: false, error: "Path tidak valid." }); }
    const segments = requestPath.split(/[\\/]+/).filter(Boolean);
    if (segments.some(segment => segment.startsWith(".") || segment.includes(":")) || requestPath.includes("\0")) return json(res, 403, { ok: false, error: "Path tidak diizinkan." });
    const relative = segments.length ? segments.join("/") : "index.html";
    const allowed = ["index.html", "admin.html", "admin"].includes(relative) || relative.startsWith("assets/");
    if (!allowed) return json(res, 404, { ok: false, error: "File tidak tersedia di preview." });
    const filename = path.resolve(STATIC_ROOT, relative === "admin" ? "admin.html" : relative);
    if (!filename.startsWith(`${STATIC_ROOT}${path.sep}`)) return json(res, 403, { ok: false, error: "Path tidak diizinkan." });
    let stat;
    try { stat = await fs.promises.stat(filename); } catch { return json(res, 404, { ok: false, error: "File tidak ditemukan." }); }
    if (!stat.isFile()) return json(res, 404, { ok: false, error: "File tidak ditemukan." });
    const actual = await fs.promises.realpath(filename);
    if (!actual.startsWith(`${STATIC_ROOT}${path.sep}`)) return json(res, 403, { ok: false, error: "Path tidak diizinkan." });
    res.writeHead(200, { "Content-Type": MIME[path.extname(filename).toLowerCase()] || "application/octet-stream", "Content-Length": stat.size, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(filename).on("error", () => res.destroy()).pipe(res);
  } catch (error) {
    if (!res.headersSent) json(res, error.status || 500, { ok: false, error: error.status ? error.message : "Local Preview gagal memproses permintaan." });
    else res.destroy();
    if (!error.status) console.error(error);
  }
});

server.on("error", error => { console.error(`Local Preview: ${error.message}`); process.exitCode = 1; });
server.listen(PORT, "127.0.0.1", () => {
  console.log(`Yashbi Store Local Preview: http://localhost:${PORT}`);
  console.log(`IPv4: http://127.0.0.1:${PORT} | Orders, invoices and chat are local simulations. No external writes.`);
});
