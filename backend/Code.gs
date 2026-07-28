const CONFIG = {
  spreadsheetId: "1Q4MBvBZMmUTlg-LX2ePXqU47eqp7l0c8GfZfaFSxS1U",
  driveRootFolderId: "1WOnLft-_IUXGHGRdl_sruLFLIZfwXDrm",
  sheets: { products: "Produk", orders: "Pesanan", orderItems: "Detail Pesanan", settings: "Pengaturan" }
};

const HEADERS = {
  Produk: ["SKU", "Nama", "Kategori", "Harga", "Harga Coret", "Warna", "Ukuran", "Stok", "Foto Utama", "Foto Kedua", "Deskripsi", "Badge", "Aktif", "Diperbarui"],
  Pesanan: ["Nomor Pesanan", "Tanggal", "Nama Pembeli", "WhatsApp", "Email", "Alamat", "Kota", "Kode Pos", "Kurir", "Subtotal", "Ongkir", "Total", "Status", "Link Bukti Transfer", "Ekspedisi", "Nomor Resi", "Diperbarui"],
  "Detail Pesanan": ["Nomor Pesanan", "SKU", "Nama Produk", "Warna", "Ukuran", "Jumlah", "Harga Satuan", "Total"],
  Pengaturan: ["Kunci", "Nilai"]
};

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || "health");
    if (action === "track") return json_(trackOrder_(e.parameter.orderId, e.parameter.phone));
    if (action === "products") return json_({ ok: true, products: getProducts_() });
    if (action === "catalog-images") return json_({ ok: true, images: getCatalogImages_() });
    return json_({ ok: true, service: "Yashbi Store API", time: new Date().toISOString() });
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (payload.action === "createOrder") return json_(createOrder_(payload));
    if (payload.action === "updateOrder") return json_(updateOrder_(payload));
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
  const root = DriveApp.getFolderById(CONFIG.driveRootFolderId);
  getOrCreateFolder_(root, "Katalog Produk");
  getOrCreateFolder_(root, "Bukti Transfer");
  getOrCreateFolder_(root, "Invoice");
  return "Setup Yashbi Store selesai.";
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
      subtotal, shipping, total, status, proofUrl, "", "", now
    ]);
    const rows = payload.items.map(item => [
      orderId, safe_(item.productId), safe_(item.name), safe_(item.color), safe_(item.size),
      number_(item.qty), number_(item.price), number_(item.qty) * number_(item.price)
    ]);
    itemSheet.getRange(itemSheet.getLastRow() + 1, 1, rows.length, HEADERS["Detail Pesanan"].length).setValues(rows);
    return { ok: true, order: { id: orderId, status: status, createdAt: now.toISOString() } };
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

function updateOrder_(payload) {
  const sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.sheets.orders);
  const values = sheet.getDataRange().getValues();
  const index = values.findIndex((row, i) => i > 0 && String(row[0]) === String(payload.orderId));
  if (index < 1) throw new Error("Pesanan tidak ditemukan.");
  if (payload.status) sheet.getRange(index + 1, 13).setValue(safe_(payload.status));
  if (payload.expedition !== undefined) sheet.getRange(index + 1, 15).setValue(safe_(payload.expedition));
  if (payload.trackingNumber !== undefined) sheet.getRange(index + 1, 16).setValue(safe_(payload.trackingNumber));
  sheet.getRange(index + 1, 17).setValue(new Date());
  return { ok: true };
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

function importCatalogAssetsFromGitHub() {
  const baseUrl = "https://raw.githubusercontent.com/Extreme-Studios/Web-Demo-Yashbi-Store/main/assets/images/products/";
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
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
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

function safe_(value) {
  const text = String(value == null ? "" : value).trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function number_(value) {
  const number = Number(value || 0);
  return isFinite(number) ? number : 0;
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
