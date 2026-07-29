const CONFIG = {
  spreadsheetId: "1Q4MBvBZMmUTlg-LX2ePXqU47eqp7l0c8GfZfaFSxS1U",
  driveRootFolderId: "1WOnLft-_IUXGHGRdl_sruLFLIZfwXDrm",
  sheets: { products: "Produk", orders: "Pesanan", orderItems: "Detail Pesanan", settings: "Pengaturan", visitors: "Pengunjung", admins: "Admin" }
};

const HEADERS = {
  Produk: ["SKU", "Nama", "Kategori", "Harga", "Harga Coret", "Warna", "Ukuran", "Stok", "Foto Utama", "Foto Kedua", "Deskripsi", "Badge", "Aktif", "Diperbarui"],
  Pesanan: ["Nomor Pesanan", "Tanggal", "Nama Pembeli", "WhatsApp", "Email", "Alamat", "Kota", "Kode Pos", "Kurir", "Subtotal", "Ongkir", "Total", "Status", "Link Bukti Transfer", "Ekspedisi", "Nomor Resi", "Diperbarui", "ID Klien", "Sumber Pesanan", "Metode Pembayaran", "Link Invoice PDF"],
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
    const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (payload.action === "createOrder" || payload.action === "syncOrder") return json_(createOrder_(payload));
    if (payload.action === "upsertVisitor") return json_(upsertVisitor_(payload));
    if (payload.action === "adminLogin") return json_(adminLogin_(payload));
    if (payload.action === "updateOrder") return json_(updateOrder_(payload));
    if (payload.action === "sendInvoiceEmail") return json_(sendInvoiceLinkEmail_(payload));
    if (payload.action === "generateInvoice") return json_(generateInvoice_(payload));
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
      expedition: row[14] || "", trackingNumber: row[15] || ""
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
    status: row[12], proofUrl: row[13], expedition: row[14], trackingNumber: row[15], clientOrderId: row[17] || "", source: row[18] || "Website", paymentMethod: row[19] || "Transfer manual", invoiceUrl: row[20] || "", items: itemsByOrder[String(row[0])] || []
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
  const statusRow = statusTable.appendTableRow();
  const statusLabel = statusRow.appendTableCell();
  const statusValue = statusRow.appendTableCell();
  [statusLabel, statusValue].forEach(cell => cell.setBackgroundColor(cream));
  statusLabel.appendParagraph("STATUS PESANAN").setFontSize(8).setBold(true).setForegroundColor(muted);
  statusValue.appendParagraph(safe_(order[12]).toUpperCase()).setAlignment(DocumentApp.HorizontalAlignment.RIGHT).setFontSize(9).setBold(true).setForegroundColor(brand);
  body.appendParagraph("");
  const info = body.appendTable();
  const infoRow = info.appendTableRow();
  const buyerCell = infoRow.appendTableCell();
  const deliveryCell = infoRow.appendTableCell();
  buyerCell.appendParagraph("DITAGIHKAN KEPADA").setFontSize(8).setBold(true).setForegroundColor(muted);
  buyerCell.appendParagraph(safe_(order[2])).setFontFamily("Georgia").setFontSize(14).setBold(true).setForegroundColor(ink);
  buyerCell.appendParagraph(safe_(order[5]) + "\n" + safe_(order[6]) + " " + safe_(order[7]) + "\nWhatsApp  " + safe_(order[3])).setFontSize(9).setForegroundColor(ink);
  deliveryCell.appendParagraph("PENGIRIMAN & PEMBAYARAN").setFontSize(8).setBold(true).setForegroundColor(muted);
  deliveryCell.appendParagraph(safe_(order[8] || "Belum dipilih")).setFontSize(11).setBold(true).setForegroundColor(ink);
  deliveryCell.appendParagraph("Metode  " + safe_(order[19] || "Transfer manual") + "\nBukti pembayaran telah diterima dan menunggu verifikasi staff.").setFontSize(9).setForegroundColor(ink);
  body.appendParagraph("");
  body.appendParagraph("RINCIAN PESANAN").setFontSize(10).setBold(true).setForegroundColor(brand);
  const table = body.appendTable();
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
  body.appendParagraph("SIMPAN DOKUMEN INI").setFontSize(8).setBold(true).setForegroundColor(rose);
  body.appendParagraph("Invoice ini merupakan bukti pesanan Yashbi Store. Simpan PDF ini untuk kebutuhan verifikasi, pengiriman, atau layanan purnajual.").setFontSize(9).setForegroundColor(muted);
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
  if (sheet.getRange(1, 19).getValue() !== "Sumber Pesanan") {
    sheet.getRange(1, 19).setValue("Sumber Pesanan");
  }
  if (sheet.getRange(1, 20).getValue() !== "Metode Pembayaran") {
    sheet.getRange(1, 20).setValue("Metode Pembayaran");
  }
  if (sheet.getRange(1, 21).getValue() !== "Link Invoice PDF") {
    sheet.getRange(1, 21).setValue("Link Invoice PDF");
  }
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
