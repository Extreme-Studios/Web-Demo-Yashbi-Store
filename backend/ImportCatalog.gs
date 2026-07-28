/**
 * Menyalin aset katalog publik dari deployment Vercel ke Google Drive,
 * lalu menulis URL thumbnail Drive ke sheet Produk.
 */
function importCatalogAssetsFromGitHub() {
  var ids = [
    "gw-001", "gw-002", "gw-003", "gw-004", "gw-005", "gw-006", "gw-007", "gw-008",
    "sw-001", "sw-002", "sw-003", "sw-004", "sw-005", "sw-006", "sw-007", "sw-008",
    "jp-001", "jp-002", "jp-003", "jp-004", "jp-005", "jp-006", "jp-007", "jp-008",
    "sp-001", "sp-002", "sp-003", "sp-004", "sp-005", "sp-006", "sp-007", "sp-008"
  ];
  var root = DriveApp.getFolderById(CONFIG.driveRootFolderId);
  var folder = getOrCreateFolder_(root, "Katalog Produk");
  var sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.sheets.products);
  var existingRows = sheet.getDataRange().getValues();
  var rowBySku = {};

  for (var r = 1; r < existingRows.length; r++) {
    if (existingRows[r][0]) rowBySku[String(existingRows[r][0]).toLowerCase()] = r + 1;
  }

  ids.forEach(function (sku) {
    var filename = sku + ".webp";
    var files = folder.getFilesByName(filename);
    var file;

    if (files.hasNext()) {
      file = files.next();
    } else {
      var source = "https://yashbi-store.vercel.app/assets/images/products/" + filename;
      var response = UrlFetchApp.fetch(source);
      if (response.getResponseCode() !== 200) throw new Error("Gagal mengunduh " + filename);
      file = folder.createFile(response.getBlob().setName(filename));
    }

    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (sharingError) {
      // Kebijakan Drive pemilik dapat melarang perubahan sharing per-file.
      // Proses katalog tetap dilanjutkan; storefront punya gambar fallback Vercel.
    }
    var imageUrl = "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1200";
    if (rowBySku[sku]) {
      sheet.getRange(rowBySku[sku], 9, 1, 2).setValues([[imageUrl, imageUrl]]);
      sheet.getRange(rowBySku[sku], 13, 1, 2).setValues([[true, new Date()]]);
    } else {
      sheet.appendRow([sku, "", "", "", "", "", "", "", imageUrl, imageUrl, "", "", true, new Date()]);
    }
  });

  return "32 gambar katalog tersimpan di Google Drive.";
}
