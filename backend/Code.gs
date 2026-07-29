const CONFIG = {
  spreadsheetId: "1Q4MBvBZMmUTlg-LX2ePXqU47eqp7l0c8GfZfaFSxS1U",
  driveRootFolderId: "1WOnLft-_IUXGHGRdl_sruLFLIZfwXDrm",
  sheets: { products: "Produk", orders: "Pesanan", orderItems: "Detail Pesanan", settings: "Pengaturan", visitors: "Pengunjung", admins: "Admin" }
};

const HEADERS = {
  Produk: ["SKU", "Nama", "Kategori", "Harga", "Harga Coret", "Warna", "Ukuran", "Stok", "Foto Utama", "Foto Kedua", "Deskripsi", "Badge", "Aktif", "Diperbarui"],
  Pesanan: ["Nomor Pesanan", "Tanggal", "Nama Pembeli", "WhatsApp", "Email", "Alamat", "Kota", "Kode Pos", "Kurir", "Subtotal", "Ongkir", "Total", "Status", "Link Bukti Transfer", "Ekspedisi", "Nomor Resi", "Diperbarui", "ID Klien", "Sumber Pesanan", "Metode Pembayaran", "Link Invoice PDF", "Biteship Order ID", "Biteship Tracking ID", "Biteship Courier", "Biteship Service", "Biteship Shipping Status", "Biteship Last Event Key", "Biteship Updated"],
  "Detail Pesanan": ["Nomor Pesanan", "SKU", "Nama Produk", "Warna", "Ukuran", "Jumlah", "Harga Satuan", "Total"],
  Pengaturan: ["Kunci", "Nilai"],
  Pengunjung: ["ID Sesi", "Nama Panggilan", "Status", "Mulai", "Terakhir Aktif", "Nomor Pesanan"],
  Admin: ["Email", "Peran", "Password Hash", "Aktif", "Diperbarui"]
};

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || "health");
    if (action === "track") return json_(trackOrder_(e.parameter.orderId, e.parameter.phone));
    if (action === "products") return json_({ ok: true, products: getProducts_() });
    if (action === "catalog-images") return json_({ ok: true, images: getCatalogImages_() });
    if (action === "admin-dashboard") return json_(adminDashboard_(e.parameter.token));
    return json_({ ok: true, service: "Yashbi Store API", time: new Date().toISOString() });
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}

function doPost(e) {
  try {
    if (e && e.parameter && e.parameter.webhook === "biteship") {
      return json_(receiveBiteshipWebhook_(JSON.parse((e.postData && e.postData.contents) || "{}"), e));
    }
    const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (payload.action === "createOrder" || payload.action === "syncOrder") return json_(createOrder_(payload));
    if (payload.action === "upsertVisitor") return json_(upsertVisitor_(payload));
    if (payload.action === "adminLogin") return json_(adminLogin_(payload));
    if (payload.action === "updateOrder") return json_(updateOrder_(payload));
    if (payload.action === "sendInvoiceEmail") return json_(sendInvoiceLinkEmail_(payload));
    if (payload.action === "generateInvoice") return json_(generateInvoice_(payload));
    if (payload.action === "createBiteshipShipment") return json_(createBiteshipShipment_(payload));
    if (payload.action === "biteshipSandboxStatus") return json_(biteshipSandboxStatus_(payload));
    if (payload.action === "biteshipWebhook") return json_(receiveBiteshipWebhook_(payload, e));
    throw new Error("Aksi tidak dikenal.");
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}

function setupYashbiStore() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  Object.keys(HEADERS).forEach(name => {
    let sheet = spreadsheet.getSheetByName(name);
    if (!sheet) sheet = spreadsheet.insertSheet(name);
    const headers = HEADERS[name];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground("#22352f").setFontColor("#ffffff").setFontWeight("bold");
    sheet.autoResizeColumns(1, headers.length);
  });
  const settings = spreadsheet.getSheetByName(CONFIG.sheets.settings);
  if (settings.getLastRow() < 2) {
    settings.getRange(2, 1, 5, 2).setValues([
      ["Nama Toko", "Yashbi Store"],
      ["Nomor WhatsApp", "6281234567890"],
      ["Bank", "BCA"],
      ["Nomor Rekening", "1234567890"],
      ["Nama Rekening", "Yashbi Store"]
    ]);
  }
  const adminSheet = spreadsheet.getSheetByName(CONFIG.sheets.admins);
  if (adminSheet.getLastRow() < 2) {
    adminSheet.getRange(2, 1, 2, 5).setValues([
      ["owner@yashbi.local", "OWNER", "c13f1f7f55150eed727f5f04adea416e95364a8c0a5e3122093fe222337120f2", true, new Date()],
      ["staff@yashbi.local", "STAFF", "a608f3b7d7f7a5fcb06f096adfc32564e125062e8dae6dc30d893b967cfd01bb", true, new Date()]
    ]);
  }
  const root = DriveApp.getFolderById(CONFIG.driveRootFolderId);
  getOrCreateFolder_(root, "Katalog Produk");
  getOrCreateFolder_(root, "Bukti Transfer");
  getOrCreateFolder_(root, "Invoice");
  return "Setup Yashbi Store selesai.";
}

function setDemoAdminCredentials() {
  const sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.sheets.admins);
  if (!sheet) throw new Error("Sheet Admin belum tersedia.");
  const passwordHash = hash_("admin");
  const desired = [
    ["owner@yashbi.local", "OWNER", passwordHash, true, new Date()],
    ["staff@yashbi.local", "STAFF", passwordHash, true, new Date()],
    ["admin@yashbi.local", "STAFF", passwordHash, true, new Date()]
  ];
  const current = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.Admin.length).getValues() : [];
  desired.forEach(account => {
    const index = current.findIndex(row => String(row[0]).toLowerCase() === account[0]);
    if (index >= 0) sheet.getRange(index + 2, 1, 1, HEADERS.Admin.length).setValues([account]);
    else sheet.appendRow(account);
  });
  return "Akun demo owner dan staff diperbarui.";
}

// Maintenance helper for resetting only operational demo rows. It intentionally
// preserves products, store settings, admins, Drive proofs, and invoice archives.
function clearDemoOrderData() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const cleared = {};
  [CONFIG.sheets.orders, CONFIG.sheets.orderItems, CONFIG.sheets.visitors].forEach(name => {
    const sheet = spreadsheet.getSheetByName(name);
    if (!sheet || sheet.getLastRow() < 2) { cleared[name] = 0; return; }
    const rowCount = sheet.getLastRow() - 1;
    sheet.getRange(2, 1, rowCount, sheet.getMaxColumns()).clearContent();
    cleared[name] = rowCount;
  });
  return { ok: true, cleared: cleared, message: "Data operasional demo dibersihkan. Katalog dan arsip Drive tidak dihapus." };
}

function createOrder_(payload) {
  if (!payload.customer || !payload.items || !payload.items.length) throw new Error("Data pesanan tidak lengkap.");
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
    const orderSheet = spreadsheet.getSheetByName(CONFIG.sheets.orders);
    const itemSheet = spreadsheet.getSheetByName(CONFIG.sheets.orderItems);
    if (!orderSheet || !itemSheet) throw new Error("Jalankan setupYashbiStore terlebih dahulu.");
    ensureOrderPaymentHeaders_(orderSheet);
    const clientOrderId = safe_(payload.clientOrderId || "");
    const existing = clientOrderId && orderSheet.getLastRow() > 1
      ? orderSheet.getRange(2, 1, orderSheet.getLastRow() - 1, HEADERS.Pesanan.length).getValues()
          .find(row => String(row[17] || "") === clientOrderId)
      : null;
    if (existing) return { ok: true, order: { id: existing[0], status: existing[12], createdAt: new Date(existing[1]).toISOString(), duplicate: true } };
    const orderId = nextOrderId_(orderSheet);
    const now = new Date();
    const proofUrl = saveProof_(payload.proof, orderId);
    const customer = payload.customer;
    const subtotal = number_(payload.subtotal);
    const shipping = number_(payload.shipping);
    const total = subtotal + shipping;
    const status = "Menunggu Verifikasi Pembayaran";
    orderSheet.appendRow([
      orderId, now, safe_(customer.name), normalizePhone_(customer.phone), safe_(customer.email),
      safe_(customer.address), safe_(customer.city), safe_(customer.postal), safe_(customer.courier),
      subtotal, shipping, total, status, proofUrl, "", "", now, clientOrderId, orderSource_(payload.source), paymentMethod_(payload.paymentMethod || customer.paymentMethod)
    ]);
    const rows = payload.items.map(item => [
      orderId, safe_(item.productId), safe_(item.name), safe_(item.color), safe_(item.size),
      number_(item.qty), number_(item.price), number_(item.qty) * number_(item.price)
    ]);
    itemSheet.getRange(itemSheet.getLastRow() + 1, 1, rows.length, HEADERS["Detail Pesanan"].length).setValues(rows);
    let invoice = null;
    try {
      invoice = createInvoicePdf_(orderSheet, itemSheet, orderId);
      orderSheet.getRange(orderSheet.getLastRow(), 21).setValue(invoice.viewUrl);
      if (safe_(customer.email)) sendInvoiceNotice_(customer.email, orderId, invoice.downloadUrl, status);
    } catch (invoiceError) {
      console.warn("Invoice belum dapat dibuat untuk " + orderId + ": " + invoiceError.message);
    }
    return { ok: true, order: { id: orderId, status: status, createdAt: now.toISOString(), invoiceUrl: invoice ? invoice.downloadUrl : "", invoiceViewUrl: invoice ? invoice.viewUrl : "" } };
  } finally {
    lock.releaseLock();
  }
}

function trackOrder_(orderId, phone) {
  const sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.sheets.orders);
  if (!sheet || sheet.getLastRow() < 2) return { ok: false, error: "Pesanan tidak ditemukan." };
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.Pesanan.length).getValues();
  const normalizedPhone = normalizePhone_(phone);
  const row = values.find(value =>
    String(value[0]).toLowerCase() === String(orderId || "").trim().toLowerCase() &&
    normalizePhone_(value[3]) === normalizedPhone
  );
  if (!row) return { ok: false, error: "Pesanan tidak ditemukan." };
  return {
    ok: true,
    order: {
      id: row[0], createdAt: new Date(row[1]).toISOString(), status: row[12],
      expedition: row[14] || "", trackingNumber: row[15] || "", biteshipStatus: row[25] || "", biteshipCourier: row[23] || "", biteshipService: row[24] || ""
    }
  };
}

function upsertVisitor_(payload) {
  const sessionId = safe_(payload.sessionId);
  const name = safe_(payload.name).slice(0, 60);
  if (!sessionId || !name) throw new Error("Nama dan ID sesi wajib ada.");
  const sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.sheets.visitors);
  if (!sheet) throw new Error("Jalankan setupYashbiStore terlebih dahulu.");
  const now = new Date();
  const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.Pengunjung.length).getValues() : [];
  const index = rows.findIndex(row => String(row[0]) === sessionId);
  const status = safe_(payload.status || "Online / Tanya");
  if (index >= 0) {
    sheet.getRange(index + 2, 2, 1, 5).setValues([[name, status, rows[index][3] || now, now, safe_(payload.orderId || rows[index][5] || "")]]);
  } else {
    sheet.appendRow([sessionId, name, status, now, now, safe_(payload.orderId || "")]);
  }
  return { ok: true };
}

function adminLogin_(payload) {
  const email = safe_(payload.email).toLowerCase();
  const password = String(payload.password || "");
  if (!email || !password) throw new Error("Email dan kata sandi wajib diisi.");
  const sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.sheets.admins);
  if (!sheet || sheet.getLastRow() < 2) throw new Error("Akun admin belum disiapkan.");
  const row = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.Admin.length).getValues()
    .find(value => String(value[0]).toLowerCase() === email && String(value[3]).toLowerCase() !== "false");
  if (!row || hash_(password) !== String(row[2])) throw new Error("Email atau kata sandi salah.");
  const token = Utilities.getUuid() + Utilities.getUuid();
  CacheService.getScriptCache().put("admin:" + token, JSON.stringify({ email: email, role: String(row[1]).toUpperCase() }), 21600);
  return { ok: true, token: token, role: String(row[1]).toUpperCase(), name: email.split("@")[0] };
}

function requireAdmin_(token) {
  const raw = CacheService.getScriptCache().get("admin:" + String(token || ""));
  if (!raw) throw new Error("Sesi admin berakhir. Silakan login ulang.");
  return JSON.parse(raw);
}

function adminDashboard_(token) {
  const admin = requireAdmin_(token);
  const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const orderSheet = spreadsheet.getSheetByName(CONFIG.sheets.orders);
  const itemSheet = spreadsheet.getSheetByName(CONFIG.sheets.orderItems);
  const productSheet = spreadsheet.getSheetByName(CONFIG.sheets.products);
  const visitorSheet = spreadsheet.getSheetByName(CONFIG.sheets.visitors);
  if (orderSheet) ensureOrderPaymentHeaders_(orderSheet);
  const orderRows = orderSheet && orderSheet.getLastRow() > 1 ? orderSheet.getRange(2, 1, orderSheet.getLastRow() - 1, HEADERS.Pesanan.length).getValues() : [];
  const itemRows = itemSheet && itemSheet.getLastRow() > 1 ? itemSheet.getRange(2, 1, itemSheet.getLastRow() - 1, HEADERS["Detail Pesanan"].length).getValues() : [];
  const productRows = productSheet && productSheet.getLastRow() > 1 ? productSheet.getRange(2, 1, productSheet.getLastRow() - 1, HEADERS.Produk.length).getValues() : [];
  const visitorRows = visitorSheet && visitorSheet.getLastRow() > 1 ? visitorSheet.getRange(2, 1, visitorSheet.getLastRow() - 1, HEADERS.Pengunjung.length).getValues() : [];
  const productsBySku = {};
  productRows.forEach(row => { productsBySku[String(row[0] || "")] = { original: number_(row[4]) }; });
  const itemsByOrder = {};
  itemRows.forEach(row => {
    const orderId = String(row[0] || "");
    if (!orderId) return;
    if (!itemsByOrder[orderId]) itemsByOrder[orderId] = [];
    const product = productsBySku[String(row[1] || "")] || {};
    itemsByOrder[orderId].push({ productId: row[1], name: row[2], color: row[3], size: row[4], qty: number_(row[5]), price: number_(row[6]), total: number_(row[7]), original: product.original || 0 });
  });
  const now = Date.now();
  const visitors = visitorRows.slice(-60).reverse().map(row => ({
    sessionId: row[0], name: row[1], status: row[2], lastSeen: row[4] instanceof Date ? row[4].toISOString() : "", orderId: row[5] || "",
    online: row[4] instanceof Date && now - row[4].getTime() < 10 * 60 * 1000
  }));
  const orders = orderRows.slice(-100).reverse().map(row => ({
    id: row[0], createdAt: row[1] instanceof Date ? row[1].toISOString() : "", name: row[2], phone: row[3], email: row[4],
    address: row[5], city: row[6], postal: row[7], courier: row[8], subtotal: number_(row[9]), shipping: number_(row[10]), total: number_(row[11]),
    status: row[12], proofUrl: row[13], expedition: row[14], trackingNumber: row[15], clientOrderId: row[17] || "", source: row[18] || "Website", paymentMethod: row[19] || "Transfer manual", invoiceUrl: row[20] || "",
    biteshipOrderId: row[21] || "", biteshipTrackingId: row[22] || "", biteshipCourier: row[23] || "", biteshipService: row[24] || "", biteshipStatus: row[25] || "", biteshipUpdatedAt: row[27] instanceof Date ? row[27].toISOString() : "", items: itemsByOrder[String(row[0])] || []
  }));
  const counts = { online: visitors.filter(item => item.online).length, tanya: visitors.filter(item => item.status === "Online / Tanya").length,
    checkout: orders.filter(item => item.status === "Checkout — belum bayar").length,
    verify: orders.filter(item => item.status === "Menunggu Verifikasi Pembayaran").length,
    shipping: orders.filter(item => item.status === "Shipping").length };
  return { ok: true, admin: admin, visitors: visitors, orders: orders, counts: counts };
}

function updateOrder_(payload) {
  const admin = requireAdmin_(payload.token);
  const sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.sheets.orders);
  const values = sheet.getDataRange().getValues();
  const index = values.findIndex((row, i) => i > 0 && String(row[0]) === String(payload.orderId));
  if (index < 1) throw new Error("Pesanan tidak ditemukan.");
  const nextStatus = safe_(payload.status || values[index][12]);
  const nextExpedition = safe_(payload.expedition !== undefined ? payload.expedition : values[index][14]);
  const nextTracking = safe_(payload.trackingNumber !== undefined ? payload.trackingNumber : values[index][15]);
  if (/^(shipping|selesai)$/i.test(nextStatus) && (!nextExpedition || !nextTracking)) {
    throw new Error("Status Shipping/Selesai wajib memiliki ekspedisi dan nomor resi.");
  }
  if (payload.status) sheet.getRange(index + 1, 13).setValue(nextStatus);
  if (payload.email !== undefined) sheet.getRange(index + 1, 5).setValue(safe_(payload.email).toLowerCase());
  if (payload.expedition !== undefined) sheet.getRange(index + 1, 15).setValue(safe_(payload.expedition));
  if (payload.trackingNumber !== undefined) sheet.getRange(index + 1, 16).setValue(safe_(payload.trackingNumber));
  sheet.getRange(index + 1, 17).setValue(new Date());
  if (/^(shipping|selesai)$/i.test(nextStatus)) {
    const itemSheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.sheets.orderItems);
    const invoice = createInvoicePdf_(sheet, itemSheet, payload.orderId);
    sheet.getRange(index + 1, 21).setValue(invoice.viewUrl);
  }
  return { ok: true, by: admin.email };
}

// Biteship is deliberately sandbox-only in this store. The API key is kept in
// Apps Script Properties, never in the Sheet, static files, or Vercel build.
const BITESHIP_API_BASE = "https://api.biteship.com";
const BITESHIP_COLUMNS = {
  orderId: 22, trackingId: 23, courier: 24, service: 25, status: 26, eventKey: 27, updatedAt: 28
};

function biteshipSandboxStatus_(payload) {
  requireAdmin_(payload.token);
  const props = PropertiesService.getScriptProperties();
  const key = String(props.getProperty("BITESHIP_API_KEY") || "").trim();
  const environment = String(props.getProperty("BITESHIP_ENV") || "").trim().toLowerCase();
  return {
    ok: true,
    environment: environment || "belum diatur",
    keyConfigured: Boolean(key),
    sandboxKey: key.indexOf("biteship_test.") === 0,
    ready: environment === "sandbox" && key.indexOf("biteship_test.") === 0
  };
}

function readBiteshipSandboxConfig_() {
  const props = PropertiesService.getScriptProperties();
  const environment = String(props.getProperty("BITESHIP_ENV") || "").trim().toLowerCase();
  const apiKey = String(props.getProperty("BITESHIP_API_KEY") || "").trim();
  if (environment !== "sandbox") throw new Error("Biteship ditolak: BITESHIP_ENV harus bernilai sandbox.");
  if (!apiKey || apiKey.indexOf("biteship_test.") !== 0) {
    throw new Error("Biteship sandbox belum siap. Isi BITESHIP_API_KEY dengan test key berawalan biteship_test. di Script Properties.");
  }
  return {
    apiKey: apiKey,
    origin: {
      name: String(props.getProperty("BITESHIP_SANDBOX_ORIGIN_NAME") || "Yashbi Sandbox Store").trim(),
      phone: String(props.getProperty("BITESHIP_SANDBOX_ORIGIN_PHONE") || "081234567890").trim(),
      email: String(props.getProperty("BITESHIP_SANDBOX_ORIGIN_EMAIL") || "sandbox@yashbi.test").trim(),
      organization: String(props.getProperty("BITESHIP_SANDBOX_ORGANIZATION") || "Yashbi Store Sandbox").trim(),
      address: String(props.getProperty("BITESHIP_SANDBOX_ORIGIN_ADDRESS") || "Jl. Jenderal Sudirman No. 1, Jakarta Selatan").trim(),
      postalCode: number_(props.getProperty("BITESHIP_SANDBOX_ORIGIN_POSTAL") || 12190)
    }
  };
}

function createBiteshipShipment_(payload) {
  const admin = requireAdmin_(payload.token);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const config = readBiteshipSandboxConfig_();
    const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
    const orderSheet = spreadsheet.getSheetByName(CONFIG.sheets.orders);
    const itemSheet = spreadsheet.getSheetByName(CONFIG.sheets.orderItems);
    ensureOrderPaymentHeaders_(orderSheet);
    const rows = orderSheet.getDataRange().getValues();
    const index = rows.findIndex((row, rowIndex) => rowIndex > 0 && String(row[0]) === String(payload.orderId));
    if (index < 1) throw new Error("Pesanan tidak ditemukan.");
    const order = rows[index];
    if (String(order[21] || "").trim()) {
      return { ok: true, duplicate: true, message: "Shipment sandbox sudah pernah dibuat untuk pesanan ini.", shipment: biteshipOrderFromRow_(order) };
    }
    if (!safe_(order[2]) || !safe_(order[3]) || !safe_(order[5]) || !number_(order[7])) {
      throw new Error("Data tujuan belum lengkap. Nama, WhatsApp, alamat, dan kode pos pembeli wajib ada.");
    }
    const itemRows = itemSheet && itemSheet.getLastRow() > 1
      ? itemSheet.getRange(2, 1, itemSheet.getLastRow() - 1, HEADERS["Detail Pesanan"].length).getValues().filter(row => String(row[0]) === String(order[0]))
      : [];
    if (!itemRows.length) throw new Error("Rincian produk pesanan tidak ditemukan.");
    const courierCompany = String(payload.courierCompany || "jne").trim().toLowerCase();
    const courierType = String(payload.courierType || "reg").trim().toLowerCase();
    const requestBody = {
      shipper_contact_name: config.origin.name,
      shipper_contact_phone: config.origin.phone,
      shipper_contact_email: config.origin.email,
      shipper_organization: config.origin.organization,
      origin_contact_name: config.origin.name,
      origin_contact_phone: config.origin.phone,
      origin_contact_email: config.origin.email,
      origin_address: config.origin.address,
      origin_note: "SANDBOX ONLY — tidak ada pickup sungguhan.",
      origin_postal_code: config.origin.postalCode,
      destination_contact_name: safe_(order[2]),
      destination_contact_phone: normalizePhone_(order[3]),
      destination_contact_email: safe_(order[4]),
      destination_address: safe_(order[5]) + (safe_(order[6]) ? ", " + safe_(order[6]) : ""),
      destination_postal_code: number_(order[7]),
      courier_company: courierCompany,
      courier_type: courierType,
      delivery_type: "now",
      order_note: "Yashbi Store sandbox test. Tidak ada pengiriman atau pickup nyata.",
      reference_id: String(order[0]) + "-sandbox",
      metadata: { yashbi_order_id: String(order[0]), environment: "sandbox" },
      items: itemRows.map(item => ({
        name: safe_(item[2]), description: "Warna " + safe_(item[3]) + ", ukuran " + safe_(item[4]), category: "fashion", sku: safe_(item[1]),
        value: number_(item[6]), quantity: number_(item[5]), weight: Math.max(1, 250 * Math.max(1, number_(item[5]))), height: 10, length: 30, width: 20
      }))
    };
    const response = UrlFetchApp.fetch(BITESHIP_API_BASE + "/v1/orders", {
      method: "post",
      contentType: "application/json",
      headers: { Authorization: "Bearer " + config.apiKey },
      payload: JSON.stringify(requestBody),
      muteHttpExceptions: true
    });
    const httpStatus = response.getResponseCode();
    let body;
    try { body = JSON.parse(response.getContentText()); } catch (parseError) { throw new Error("Respons Biteship bukan JSON (HTTP " + httpStatus + ")."); }
    if (httpStatus < 200 || httpStatus >= 300 || body.success !== true) {
      throw new Error("Biteship Sandbox menolak shipment: " + safe_(body.error || body.message || "HTTP " + httpStatus));
    }
    const courier = body.courier || {};
    if (!body.id || !courier.waybill_id) throw new Error("Biteship tidak mengembalikan order ID atau waybill_id. Data tidak disimpan agar tidak ada resi palsu.");
    saveBiteshipShipment_(orderSheet, itemSheet, index + 1, order, body, "api:" + body.id, admin.email);
    return { ok: true, duplicate: false, shipment: {
      biteshipOrderId: body.id, trackingId: courier.tracking_id || "", waybill: courier.waybill_id,
      courier: courier.company || courierCompany, service: courier.type || courierType, status: body.status || "confirmed"
    }};
  } finally {
    lock.releaseLock();
  }
}

function biteshipOrderFromRow_(row) {
  return { biteshipOrderId: row[21] || "", trackingId: row[22] || "", courier: row[23] || "", service: row[24] || "", status: row[25] || "", waybill: row[15] || "" };
}

function saveBiteshipShipment_(orderSheet, itemSheet, sheetRow, order, response, eventKey, actor) {
  const courier = response.courier || {};
  const shipmentStatus = String(response.status || "confirmed").toLowerCase();
  const company = safe_(courier.company || "");
  const service = safe_(courier.type || "");
  const waybill = safe_(courier.waybill_id || "");
  const storefrontStatus = biteshipStorefrontStatus_(shipmentStatus, order[12]);
  const expedition = [company.toUpperCase(), service.toUpperCase()].filter(Boolean).join(" ");
  orderSheet.getRange(sheetRow, 13).setValue(storefrontStatus);
  orderSheet.getRange(sheetRow, 15).setValue(expedition);
  orderSheet.getRange(sheetRow, 16).setValue(waybill);
  orderSheet.getRange(sheetRow, 17).setValue(new Date());
  orderSheet.getRange(sheetRow, BITESHIP_COLUMNS.orderId).setValue(safe_(response.id));
  orderSheet.getRange(sheetRow, BITESHIP_COLUMNS.trackingId).setValue(safe_(courier.tracking_id || ""));
  orderSheet.getRange(sheetRow, BITESHIP_COLUMNS.courier).setValue(company);
  orderSheet.getRange(sheetRow, BITESHIP_COLUMNS.service).setValue(service);
  orderSheet.getRange(sheetRow, BITESHIP_COLUMNS.status).setValue(shipmentStatus);
  orderSheet.getRange(sheetRow, BITESHIP_COLUMNS.eventKey).setValue(safe_(eventKey));
  orderSheet.getRange(sheetRow, BITESHIP_COLUMNS.updatedAt).setValue(new Date());
  const invoice = createInvoicePdf_(orderSheet, itemSheet, order[0]);
  orderSheet.getRange(sheetRow, 21).setValue(invoice.viewUrl);
}

function biteshipStorefrontStatus_(status, current) {
  if (status === "delivered") return "Selesai";
  if (status === "cancelled") return "Batal";
  return "Shipping";
}

function receiveBiteshipWebhook_(payload, e) {
  const expectedToken = String(PropertiesService.getScriptProperties().getProperty("BITESHIP_WEBHOOK_TOKEN") || "");
  const providedToken = String((e && e.parameter && e.parameter.token) || payload.webhookToken || "");
  if (!expectedToken || providedToken !== expectedToken) throw new Error("Webhook Biteship ditolak.");
  const orderId = safe_(payload.order_id);
  if (!orderId || !safe_(payload.event)) throw new Error("Webhook Biteship tidak memiliki order_id atau event.");
  const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const orderSheet = spreadsheet.getSheetByName(CONFIG.sheets.orders);
  const itemSheet = spreadsheet.getSheetByName(CONFIG.sheets.orderItems);
  ensureOrderPaymentHeaders_(orderSheet);
  const rows = orderSheet.getDataRange().getValues();
  const index = rows.findIndex((row, rowIndex) => rowIndex > 0 && String(row[21]) === orderId);
  if (index < 1) throw new Error("Webhook tidak cocok dengan shipment Yashbi.");
  const eventKey = [payload.event, orderId, payload.status || "", payload.courier_waybill_id || "", payload.courier_tracking_id || ""].join(":");
  if (String(rows[index][26] || "") === eventKey) return { ok: true, duplicate: true };
  const response = {
    id: orderId, status: safe_(payload.status || rows[index][25] || "confirmed"),
    courier: { tracking_id: payload.courier_tracking_id || rows[index][22] || "", waybill_id: payload.courier_waybill_id || rows[index][15] || "", company: payload.courier_company || rows[index][23] || "", type: payload.courier_type || rows[index][24] || "" }
  };
  saveBiteshipShipment_(orderSheet, itemSheet, index + 1, rows[index], response, eventKey, "biteship-webhook");
  return { ok: true, duplicate: false, orderId: rows[index][0], status: response.status };
}

function sendInvoiceEmail_(payload) {
  requireAdmin_(payload.token);
  const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const orderSheet = spreadsheet.getSheetByName(CONFIG.sheets.orders);
  const itemSheet = spreadsheet.getSheetByName(CONFIG.sheets.orderItems);
  const rows = orderSheet.getDataRange().getValues();
  const orderIndex = rows.findIndex((row, index) => index > 0 && String(row[0]) === String(payload.orderId));
  if (orderIndex < 1) throw new Error("Pesanan tidak ditemukan.");
  const order = rows[orderIndex];
  const requestedEmail = safe_(payload.email).trim().toLowerCase();
  if (requestedEmail) {
    orderSheet.getRange(orderIndex + 1, 5).setValue(requestedEmail);
    order[4] = requestedEmail;
  }
  const email = safe_(order[4]).trim();
  if (!email) throw new Error("Email pembeli belum diisi.");
  const items = itemSheet && itemSheet.getLastRow() > 1
    ? itemSheet.getRange(2, 1, itemSheet.getLastRow() - 1, HEADERS["Detail Pesanan"].length).getValues().filter(row => String(row[0]) === String(order[0]))
    : [];
  const itemText = items.map(row => `• ${safe_(row[2])}\n  Warna/ukuran: ${safe_(row[3])} / ${safe_(row[4])}\n  Jumlah: ${number_(row[5])}\n  Harga: ${rupiah_(row[6])}\n  Total barang: ${rupiah_(row[7])}`).join("\n\n") || "• Rincian produk tercatat pada pesanan";
  const shipping = /shipping/i.test(String(order[12])) ? `\nEkspedisi: ${safe_(order[14] || order[8] || "-")}\nResi: ${safe_(order[15] || "-")}` : "";
  const body = `Halo Kak ${safe_(order[2])},\n\nTerima kasih sudah berbelanja di Yashbi Store. Berikut detail pesanan Kakak:\n\nInvoice: ${safe_(order[0])}\n${itemText}\n\nSubtotal: ${rupiah_(order[9])}\nOngkir: ${rupiah_(order[10])}\nTotal: ${rupiah_(order[11])}\nStatus: ${safe_(order[12])}${shipping}\n\nTerima kasih.`;
  GmailApp.sendEmail(email, `Invoice Yashbi Store ${safe_(order[0])}`, body, { name: "Yashbi Store" });
  return { ok: true, sentTo: email };
}

function sendInvoiceLinkEmail_(payload) {
  requireAdmin_(payload.token);
  const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const orderSheet = spreadsheet.getSheetByName(CONFIG.sheets.orders);
  const itemSheet = spreadsheet.getSheetByName(CONFIG.sheets.orderItems);
  ensureOrderPaymentHeaders_(orderSheet);
  const rows = orderSheet.getDataRange().getValues();
  const orderIndex = rows.findIndex((row, index) => index > 0 && String(row[0]) === String(payload.orderId));
  if (orderIndex < 1) throw new Error("Pesanan tidak ditemukan.");
  const order = rows[orderIndex];
  const requestedEmail = safe_(payload.email).toLowerCase();
  if (requestedEmail) {
    orderSheet.getRange(orderIndex + 1, 5).setValue(requestedEmail);
    order[4] = requestedEmail;
  }
  const email = safe_(order[4]);
  if (!email) throw new Error("Email pembeli belum diisi.");
  if (!/^(shipping|selesai)$/i.test(String(order[12])) || !safe_(order[14]) || !safe_(order[15])) {
    throw new Error("Invoice WA/email aktif setelah status Shipping/Selesai, ekspedisi, dan nomor resi lengkap.");
  }
  const invoice = createInvoicePdf_(orderSheet, itemSheet, order[0]);
  orderSheet.getRange(orderIndex + 1, 21).setValue(invoice.viewUrl);
  sendInvoiceNotice_(email, order[0], invoice.downloadUrl, order[12]);
  return { ok: true, sentTo: email, invoiceUrl: invoice.downloadUrl };
}

function generateInvoice_(payload) {
  requireAdmin_(payload.token);
  const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const orderSheet = spreadsheet.getSheetByName(CONFIG.sheets.orders);
  const itemSheet = spreadsheet.getSheetByName(CONFIG.sheets.orderItems);
  ensureOrderPaymentHeaders_(orderSheet);
  const rows = orderSheet.getDataRange().getValues();
  const orderIndex = rows.findIndex((row, index) => index > 0 && String(row[0]) === String(payload.orderId));
  if (orderIndex < 1) throw new Error("Pesanan tidak ditemukan.");
  const invoice = createInvoicePdf_(orderSheet, itemSheet, payload.orderId);
  orderSheet.getRange(orderIndex + 1, 21).setValue(invoice.viewUrl);
  return { ok: true, invoiceUrl: invoice.downloadUrl, invoiceViewUrl: invoice.viewUrl };
}

function createInvoicePdf_(orderSheet, itemSheet, orderId) {
  const rows = orderSheet.getDataRange().getValues();
  const order = rows.find((row, index) => index > 0 && String(row[0]) === String(orderId));
  if (!order) throw new Error("Pesanan tidak ditemukan.");
  const items = itemSheet && itemSheet.getLastRow() > 1
    ? itemSheet.getRange(2, 1, itemSheet.getLastRow() - 1, HEADERS["Detail Pesanan"].length).getValues().filter(row => String(row[0]) === String(orderId))
    : [];
  const root = DriveApp.getFolderById(CONFIG.driveRootFolderId);
  const invoiceFolder = getOrCreateFolder_(root, "Invoice");
  const sourceFolder = getOrCreateFolder_(invoiceFolder, "Arsip Sumber");
  const document = DocumentApp.create("Invoice " + orderId);
  const body = document.getBody();
  body.clear();
  const brand = "#1f2730", ink = "#20262d", muted = "#737980", cream = "#f4f0eb", rose = "#c89fa0";
  const header = body.appendTable();
  header.setBorderWidth(0);
  const brandHeaderRow = header.appendTableRow();
  const brandCell = brandHeaderRow.appendTableCell();
  const invoiceCell = brandHeaderRow.appendTableCell();
  [brandCell, invoiceCell].forEach(cell => cell.setBackgroundColor(brand));
  brandCell.appendParagraph("YASHBI").setFontFamily("Georgia").setFontSize(25).setBold(true).setForegroundColor("#ffffff");
  brandCell.appendParagraph("STORE  /  CURATED FASHION").setFontSize(8).setForegroundColor("#d9c8b9");
  invoiceCell.appendParagraph("INVOICE").setAlignment(DocumentApp.HorizontalAlignment.RIGHT).setFontSize(9).setBold(true).setForegroundColor("#d9c8b9");
  invoiceCell.appendParagraph(orderId).setAlignment(DocumentApp.HorizontalAlignment.RIGHT).setFontSize(15).setBold(true).setForegroundColor("#ffffff");
  invoiceCell.appendParagraph(Utilities.formatDate(new Date(order[1]), Session.getScriptTimeZone(), "dd MMM yyyy - HH:mm") + " WIB").setAlignment(DocumentApp.HorizontalAlignment.RIGHT).setFontSize(8).setForegroundColor("#ffffff");
  body.appendParagraph("");
  const statusTable = body.appendTable();
  statusTable.setBorderWidth(0);
  const statusRow = statusTable.appendTableRow();
  const statusLabel = statusRow.appendTableCell();
  const statusValue = statusRow.appendTableCell();
  [statusLabel, statusValue].forEach(cell => cell.setBackgroundColor(cream));
  statusLabel.appendParagraph("STATUS PESANAN").setFontSize(8).setBold(true).setForegroundColor(muted);
  statusValue.appendParagraph(safe_(order[12]).toUpperCase()).setAlignment(DocumentApp.HorizontalAlignment.RIGHT).setFontSize(9).setBold(true).setForegroundColor(brand);
  body.appendParagraph("");
  const info = body.appendTable();
  info.setBorderWidth(0);
  const infoRow = info.appendTableRow();
  const buyerCell = infoRow.appendTableCell();
  const deliveryCell = infoRow.appendTableCell();
  buyerCell.appendParagraph("DITAGIHKAN KEPADA").setFontSize(8).setBold(true).setForegroundColor(muted);
  buyerCell.appendParagraph(safe_(order[2])).setFontFamily("Georgia").setFontSize(14).setBold(true).setForegroundColor(ink);
  buyerCell.appendParagraph(safe_(order[5]) + "\n" + safe_(order[6]) + " " + safe_(order[7]) + "\nWhatsApp  " + safe_(order[3])).setFontSize(9).setForegroundColor(ink);
  deliveryCell.appendParagraph("PENGIRIMAN & PEMBAYARAN").setFontSize(8).setBold(true).setForegroundColor(muted);
  deliveryCell.appendParagraph(safe_(order[8] || "Belum dipilih")).setFontSize(11).setBold(true).setForegroundColor(ink);
  const courierInfo = [safe_(order[23] || order[14] || ""), safe_(order[24] || "")].filter(Boolean).join(" · ");
  const shippingInfo = order[15]
    ? "Kurir: " + safe_(courierInfo || order[14] || "-") + "\nNo. Resi: " + safe_(order[15]) + "\nStatus Pengiriman: " + safe_(order[25] || order[12])
    : "Pengiriman sedang diproses";
  deliveryCell.appendParagraph(shippingInfo + "\nMetode: " + safe_(order[19] || "Transfer manual")).setFontSize(9).setForegroundColor(ink);
  body.appendParagraph("");
  body.appendParagraph("RINCIAN PESANAN").setFontSize(10).setBold(true).setForegroundColor(brand);
  const table = body.appendTable();
  table.setBorderWidth(0);
  const headerRow = table.appendTableRow();
  ["Produk", "Varian", "Qty", "Harga", "Total"].forEach(value => headerRow.appendTableCell(value));
  headerRow.editAsText().setBold(true).setForegroundColor("#ffffff");
  for (let i = 0; i < headerRow.getNumCells(); i++) headerRow.getCell(i).setBackgroundColor(brand);
  items.forEach((item, index) => {
    const itemRow = table.appendTableRow();
    [safe_(item[2]), safe_(item[3]) + " / " + safe_(item[4]), String(number_(item[5])), rupiah_(item[6]), rupiah_(item[7])].forEach(value => itemRow.appendTableCell(value));
    if (index % 2 === 0) for (let i = 0; i < itemRow.getNumCells(); i++) itemRow.getCell(i).setBackgroundColor("#faf8f5");
  });
  body.appendParagraph("");
  const totals = body.appendTable();
  totals.setBorderWidth(0);
  [["SUBTOTAL", rupiah_(order[9])], ["ONGKIR", rupiah_(order[10])], ["TOTAL PEMBAYARAN", rupiah_(order[11])]].forEach((value, index) => {
    const row = totals.appendTableRow();
    const label = row.appendTableCell(value[0]);
    const amount = row.appendTableCell(value[1]);
    if (index === 2) {
      [label, amount].forEach(cell => cell.setBackgroundColor(brand));
      row.editAsText().setBold(true).setForegroundColor("#ffffff").setFontSize(12);
    } else {
      [label, amount].forEach(cell => cell.setBackgroundColor(cream));
      row.editAsText().setForegroundColor(ink).setFontSize(9);
    }
    amount.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  });
  body.appendParagraph("");
  body.appendParagraph("CATATAN PESANAN").setFontSize(8).setBold(true).setForegroundColor(rose);
  body.appendParagraph("Terima kasih telah berbelanja di Yashbi Store. Simpan invoice ini sebagai bukti pembelian untuk kebutuhan verifikasi, pengiriman, atau layanan purnajual.").setFontSize(9).setForegroundColor(muted);
  document.saveAndClose();
  const sourceFile = DriveApp.getFileById(document.getId());
  sourceFile.moveTo(sourceFolder);
  const pdf = invoiceFolder.createFile(sourceFile.getAs(MimeType.PDF).setName("Invoice-" + orderId + ".pdf"));
  try { pdf.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (sharingError) { console.warn("Akses invoice mengikuti folder: " + sharingError.message); }
  return { viewUrl: pdf.getUrl(), downloadUrl: "https://drive.google.com/uc?export=download&id=" + pdf.getId() };
}

function driveDownloadUrl_(viewUrl) {
  const id = String(viewUrl || "").match(/[-\w]{25,}/);
  return id ? "https://drive.google.com/uc?export=download&id=" + id[0] : viewUrl;
}

function sendInvoiceNotice_(email, orderId, downloadUrl, status) {
  GmailApp.sendEmail(email, "Invoice Yashbi Store " + orderId, "Halo Kak,\n\nInvoice profesional pesanan " + orderId + " sudah dibuat. Status saat ini: " + safe_(status) + ".\n\nSilakan unduh dan simpan invoice sebagai bukti pembelian:\n" + downloadUrl + "\n\nTerima kasih telah berbelanja di Yashbi Store.", { name: "Yashbi Store" });
}

function authorizeInvoicePdf() {
  const root = DriveApp.getFolderById(CONFIG.driveRootFolderId);
  const sourceFolder = getOrCreateFolder_(getOrCreateFolder_(root, "Invoice"), "Arsip Sumber");
  const document = DocumentApp.create("Yashbi Invoice Permission Check");
  document.getBody().appendParagraph("Dokumen ini dibuat sekali untuk mengaktifkan izin pembuatan invoice PDF.");
  document.saveAndClose();
  DriveApp.getFileById(document.getId()).moveTo(sourceFolder);
  return "Izin PDF invoice aktif.";
}

function authorizeInvoiceEmail() {
  return MailApp.getRemainingDailyQuota();
}

function getProducts_() {
  const sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.sheets.products);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.Produk.length).getValues()
    .filter(row => row[0] && String(row[12]).toLowerCase() !== "false")
    .map(row => ({
      id: row[0], name: row[1], category: row[2], price: number_(row[3]), original: number_(row[4]) || null,
      colors: String(row[5] || "").split(",").map(value => value.trim()).filter(Boolean),
      sizes: String(row[6] || "").split(",").map(value => value.trim()).filter(Boolean),
      stock: number_(row[7]), image: row[8], alt: row[9], desc: row[10], badge: row[11]
    }));
}

function importCatalogAssetsFromVercel() {
  const baseUrl = "https://yashbi-store.vercel.app/assets/images/products/";
  const ids = [
    "gw-001", "gw-002", "gw-003", "gw-004", "gw-005", "gw-006", "gw-007", "gw-008",
    "sw-001", "sw-002", "sw-003", "sw-004", "sw-005", "sw-006", "sw-007", "sw-008",
    "jp-001", "jp-002", "jp-003", "jp-004", "jp-005", "jp-006", "jp-007", "jp-008",
    "sp-001", "sp-002", "sp-003", "sp-004", "sp-005", "sp-006", "sp-007", "sp-008"
  ];
  const root = DriveApp.getFolderById(CONFIG.driveRootFolderId);
  const catalogFolder = getOrCreateFolder_(root, "Katalog Produk");
  const sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.sheets.products);
  if (!sheet) throw new Error("Jalankan setupYashbiStore terlebih dahulu.");
  const values = sheet.getDataRange().getValues();
  const rowsBySku = {};
  values.forEach((row, index) => { if (index > 0 && row[0]) rowsBySku[String(row[0]).toLowerCase()] = index + 1; });
  const imported = [];

  ids.forEach(id => {
    const filename = id + ".webp";
    const existing = catalogFolder.getFilesByName(filename);
    const file = existing.hasNext()
      ? existing.next()
      : catalogFolder.createFile(UrlFetchApp.fetch(baseUrl + filename).getBlob().setName(filename));
    // Folder induk sudah dibagikan. Beberapa akun Google menolak setSharing
    // per-file dari Apps Script; akses folder tetap diwariskan ke file baru.
    const imageUrl = "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1200";
    const row = rowsBySku[id];
    if (row) {
      sheet.getRange(row, 9).setValue(imageUrl);
      sheet.getRange(row, 10).setValue(imageUrl);
      sheet.getRange(row, 13).setValue(true);
      sheet.getRange(row, 14).setValue(new Date());
    } else {
      sheet.appendRow([id, "", "", "", "", "", "", "", imageUrl, imageUrl, "", "", true, new Date()]);
    }
    imported.push({ id: id, image: imageUrl });
  });
  return imported;
}

// Menyalin foto tiap varian warna dari deployment produksi ke folder katalog Drive.
// File varian tidak ditulis sebagai produk baru di Sheet karena SKU produknya tetap sama.
function syncColorVariantAssetsFromVercel() {
  const baseUrl = "https://yashbi-store.vercel.app/assets/images/products/";
  const filenames = [
    "gw-001-champagne.png", "gw-002-ivory.png", "gw-003-navy.png", "gw-004-rose.png",
    "gw-005-black.png", "gw-006-mocha.png", "gw-007-dusty-pink.png", "gw-008-burgundy.png",
    "sw-001-nude.png", "sw-002-black.png", "sw-003-cream.png", "sw-004-black.png",
    "sw-005-champagne.png", "sw-006-sage.png", "sw-007-caramel.png",
    "jp-001-charcoal.png", "jp-002-black.png", "jp-003-slate.png", "jp-005-ivory.png",
    "jp-006-brown.png", "jp-007-cream.png", "jp-008-navy.png",
    "sp-001-dark-brown.png", "sp-003-black.png", "sp-004-black.png", "sp-005-sand.png",
    "sp-006-white.png", "sp-007-tan.png"
  ];
  const root = DriveApp.getFolderById(CONFIG.driveRootFolderId);
  const catalogFolder = getOrCreateFolder_(root, "Katalog Produk");
  return filenames.map(filename => {
    const existing = catalogFolder.getFilesByName(filename);
    const file = existing.hasNext()
      ? existing.next()
      : catalogFolder.createFile(UrlFetchApp.fetch(baseUrl + filename).getBlob().setName(filename));
    return { filename: filename, image: "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1200" };
  });
}

function getCatalogImages_() {
  const sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.sheets.products);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.Produk.length).getValues()
    .filter(row => row[0] && row[8])
    .map(row => ({ id: String(row[0]).toUpperCase(), image: String(row[8]), alt: String(row[9] || row[8]) }));
}

function saveProof_(dataUrl, orderId) {
  if (!dataUrl) return "";
  const match = String(dataUrl).match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!match) throw new Error("Format bukti transfer tidak valid.");
  const extension = match[1].split("/")[1].replace("jpeg", "jpg");
  const blob = Utilities.newBlob(Utilities.base64Decode(match[2]), match[1], orderId + "." + extension);
  const root = DriveApp.getFolderById(CONFIG.driveRootFolderId);
  const proofFolder = getOrCreateFolder_(root, "Bukti Transfer");
  const monthly = getOrCreateFolder_(proofFolder, Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM"));
  return monthly.createFile(blob).getUrl();
}

function nextOrderId_(sheet) {
  const prefix = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyMMdd");
  const values = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues().flat() : [];
  const count = values.filter(value => String(value).indexOf("YS-" + prefix + "-") === 0).length + 1;
  return "YS-" + prefix + "-" + String(count).padStart(3, "0");
}

function getOrCreateFolder_(parent, name) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

function normalizePhone_(value) {
  let phone = String(value || "").replace(/\D/g, "");
  if (phone.indexOf("62") === 0) phone = "0" + phone.slice(2);
  if (phone.indexOf("8") === 0) phone = "0" + phone;
  return phone;
}

function orderSource_(value) {
  const source = String(value || "").trim().toLowerCase();
  if (source === "whatsapp" || source === "wa") return "WhatsApp";
  if (source === "chatbot" || source === "chat") return "Chatbot";
  return "Website";
}

function paymentMethod_(value) {
  return String(value || "").trim().toLowerCase() === "transfer bca" ? "Transfer BCA" : "QRIS";
}

function ensureOrderPaymentHeaders_(sheet) {
  HEADERS.Pesanan.forEach((header, index) => {
    const cell = sheet.getRange(1, index + 1);
    if (cell.getValue() !== header) cell.setValue(header);
  });
}

function safe_(value) {
  const text = String(value == null ? "" : value).trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function number_(value) {
  const number = Number(value || 0);
  return isFinite(number) ? number : 0;
}

function rupiah_(value) {
  return "Rp " + number_(value).toLocaleString("id-ID");
}

function hash_(value) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8);
  return bytes.map(byte => ((byte + 256) % 256).toString(16).padStart(2, "0")).join("");
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
