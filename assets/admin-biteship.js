/* Sandbox pickup state. API keys remain server-side in Apps Script Properties. */
(function () {
  const originalOpenOrder = openOrder;
  openOrder = function (id) {
    originalOpenOrder(id);
    if (!selectedOrder) return;
    const detail = A("detailContent");
    const hasShipment = String(selectedOrder.biteshipOrderId || "").trim();
    detail.insertAdjacentHTML("afterbegin", hasShipment
      ? `<div class="detail-block"><strong>Biteship Sandbox</strong>Pickup: ${esc(selectedOrder.status)}<br>Order: ${esc(selectedOrder.biteshipOrderId)}<br>Kurir: ${esc(selectedOrder.biteshipCourier || "-")} · ${esc(selectedOrder.biteshipService || "-")}<br>Status Biteship: ${esc(selectedOrder.biteshipStatus || "-")}<br>Resi: ${esc(selectedOrder.trackingNumber || "menunggu Biteship")}</div>`
      : `<div class="detail-block"><strong>Pickup otomatis</strong>Setelah barang dipacking, pilih <em>Ready — Pickup Otomatis</em> lalu Simpan. Sistem akan membuat shipment Sandbox dari toko; tidak ada drop-off atau pickup nyata.</div>`);

    const form = A("orderUpdateForm");
    const submit = form.querySelector('button[type="submit"]');
    const syncReadyLabel = () => {
      const ready = form.status.value === "Ready — Pickup Otomatis";
      submit.textContent = ready ? "Ready & Proses Pickup Otomatis" : "Simpan pembaruan";
      form.expedition.closest("label").hidden = ready;
      form.trackingNumber.closest("label").hidden = ready;
    };
    form.status.onchange = syncReadyLabel;
    syncReadyLabel();
  };
}());
