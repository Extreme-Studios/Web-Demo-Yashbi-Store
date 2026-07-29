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
  let button = A("sendInvoiceWhatsApp");
  if (!button) return;

  // An anchor with its href removed can still look and feel clickable. Replace it
  // with a real button so notification is impossible before shipment is saved.
  if (button.tagName !== "BUTTON") {
    const replacement = document.createElement("button");
    replacement.type = "button";
    replacement.id = button.id;
    replacement.className = button.className;
    replacement.hidden = button.hidden;
    button.replaceWith(replacement);
    button = replacement;
  }

  const ready = Boolean(invoiceReadyToSend(order));
  button.disabled = !ready;
  button.classList.toggle("is-disabled", !ready);
  button.setAttribute("aria-disabled", String(!ready));
  button.textContent = ready ? "Kirim invoice & resi via WhatsApp" : "WhatsApp aktif setelah status Shipping dan resi tersimpan";
  button.onclick = ready
    ? () => window.open(`https://wa.me/${waPhone(order.phone)}?text=${encodeURIComponent(invoiceMessage(order))}`, "_blank", "noopener")
    : () => toast("Isi ekspedisi dan nomor resi, pilih status Shipping, lalu Simpan pembaruan terlebih dahulu.");
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
