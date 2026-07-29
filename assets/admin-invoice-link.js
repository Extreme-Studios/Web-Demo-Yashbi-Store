/* Compact professional invoice link for WhatsApp handoff. */
invoiceMessage = function(order) {
  const shipping = /shipping/i.test(order.status)
    ? `\nEkspedisi: ${order.expedition || order.courier || "-"}\nResi: ${order.trackingNumber || "-"}`
    : "";
  const invoiceLink = String(order.invoiceUrl || "");
  return `Halo Kak ${order.name},\n\nInvoice profesional pesanan ${order.id} sudah tersedia.${shipping}\n\nSilakan unduh dan simpan sebagai bukti pembelian:\n${invoiceLink || "Invoice sedang diproses oleh sistem."}\n\nTerima kasih telah berbelanja di Yashbi Store.`;
};
