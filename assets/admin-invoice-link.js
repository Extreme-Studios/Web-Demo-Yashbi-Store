/* Invoice notification is only released after the parcel has a real tracking number. */
const invoiceReadyToSend = order => /^(shipping|selesai)$/i.test(String(order.status || "")) && String(order.expedition || order.courier || "").trim() && String(order.trackingNumber || "").trim();

invoiceMessage = function(order) {
  const shipping = /shipping/i.test(order.status)
    ? `\nEkspedisi: ${order.expedition || order.courier || "-"}\nResi: ${order.trackingNumber || "-"}`
    : "";
  const invoiceLink = String(order.invoiceUrl || "");
  return `Halo Kak ${order.name},\n\nInvoice profesional pesanan ${order.id} sudah tersedia.${shipping}\n\nSilakan unduh dan simpan sebagai bukti pembelian:\n${invoiceLink || "Invoice sedang diproses oleh sistem."}\n\nTerima kasih telah berbelanja di Yashbi Store.`;
};

const originalRenderInvoiceButton = renderInvoiceButton;
renderInvoiceButton = function(order) {
  originalRenderInvoiceButton(order);
  const button = A("sendInvoiceWhatsApp");
  if (!button) return;
  if (invoiceReadyToSend(order)) {
    button.classList.remove("is-disabled");
    button.removeAttribute("aria-disabled");
    button.onclick = null;
    return;
  }
  button.removeAttribute("href");
  button.removeAttribute("target");
  button.classList.add("is-disabled");
  button.setAttribute("aria-disabled", "true");
  button.textContent = "WhatsApp aktif setelah resi diisi";
  button.onclick = event => { event.preventDefault(); toast("Isi ekspedisi dan nomor resi, lalu simpan status Shipping terlebih dahulu."); };
};

const originalOpenOrderForInvoiceLock = openOrder;
openOrder = function(id) {
  originalOpenOrderForInvoiceLock(id);
  if (!selectedOrder) return;
  const form = A("orderUpdateForm");
  const emailButton = A("sendInvoiceEmail");
  if (!invoiceReadyToSend(selectedOrder) && emailButton) {
    emailButton.removeAttribute("href");
    emailButton.classList.add("is-disabled");
    emailButton.setAttribute("aria-disabled", "true");
    emailButton.textContent = "Email aktif setelah resi diisi";
    emailButton.onclick = event => { event.preventDefault(); toast("Email invoice aktif setelah status Shipping dan nomor resi tersimpan."); };
  }
  form.addEventListener("submit", event => {
    const status = String(form.status.value || "");
    if (/^(shipping|selesai)$/i.test(status) && (!String(form.expedition.value || "").trim() || !String(form.trackingNumber.value || "").trim())) {
      event.preventDefault();
      event.stopImmediatePropagation();
      toast("Status Shipping/Selesai wajib diisi ekspedisi dan nomor resi.");
    }
  }, true);
};
