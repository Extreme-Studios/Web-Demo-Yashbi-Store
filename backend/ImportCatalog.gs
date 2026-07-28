/**
 * Menyalin aset katalog publik dari deployment Vercel ke Google Drive,
 * lalu menulis URL thumbnail Drive ke sheet Produk.
 */
function importCatalogAssetsFromGitHub() {
  var ids = [
    "gw-001", "gw-002", "gw-003", "gw-004", "gw-005", "gw-006", "gw-007", "gw-008",
    "gw-009", "gw-010", "gw-011", "gw-012", "gw-013", "gw-014", "gw-015", "gw-016",
    "gw-017", "gw-018", "gw-019", "gw-020", "gw-021", "gw-022", "gw-023", "gw-024",
    "gw-025", "gw-026", "gw-027", "gw-028", "gw-029", "gw-030", "gw-031", "gw-032"
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

    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
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
