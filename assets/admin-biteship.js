/* Biteship sandbox controls. This file never receives an API key. */
(function () {
  const sandboxReady = order => !String(order.biteshipOrderId || "").trim();

  function renderBiteshipButton(order) {
    const form = A("orderUpdateForm");
    let button = A("sendBiteshipShipment");
    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.id = "sendBiteshipShipment";
      button.className = "button button-dark button-block";
      form.before(button);
    }
    const canCreate = sandboxReady(order);
    button.disabled = !canCreate;
    button.textContent = canCreate ? "Kirim Pesanan (Biteship Sandbox)" : "Shipment Sandbox Sudah Dibuat";
    button.title = canCreate ? "Membuat test shipment Biteship. Tidak ada pickup nyata." : "Pesanan ini sudah memiliki shipment Biteship.";
    button.onclick = async () => {
      if (!selectedOrder || !sandboxReady(selectedOrder)) return;
      if (!window.confirm("Buat shipment TEST di Biteship Sandbox untuk pesanan ini? Tidak ada pickup atau pengiriman sungguhan.")) return;
      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = "Membuat shipment sandbox...";
      try {
        const result = await api({
          action: "createBiteshipShipment", token: session.token, orderId: selectedOrder.id,
          courierCompany: "jne", courierType: "reg"
        });
        const shipment = result.shipment || {};
        toast(result.duplicate ? "Shipment sebelumnya dipakai. Tidak membuat shipment kedua." : `Sandbox berhasil: resi ${shipment.waybill || "diterima"}.`);
        await refresh();
        openOrder(selectedOrder.id);
      } catch (error) {
        toast(error.message);
      } finally {
        button.disabled = false;
        button.textContent = originalText;
      }
    };
  }

  const previousOpenOrder = openOrder;
  openOrder = function (id) {
    previousOpenOrder(id);
    if (!selectedOrder) return;
    const detail = A("detailContent");
    const hasShipment = String(selectedOrder.biteshipOrderId || "").trim();
    detail.insertAdjacentHTML("afterbegin", hasShipment
      ? `<div class="detail-block"><strong>Biteship Sandbox</strong>Order: ${esc(selectedOrder.biteshipOrderId)}<br>Kurir: ${esc(selectedOrder.biteshipCourier || "-")} · ${esc(selectedOrder.biteshipService || "-")}<br>Status: ${esc(selectedOrder.biteshipStatus || "-")}<br>Resi: ${esc(selectedOrder.trackingNumber || "-")}</div>`
      : `<div class="detail-block"><strong>Biteship Sandbox</strong>Belum ada shipment. Tombol kirim akan memakai JNE Reg di lingkungan test.</div>`);
    renderBiteshipButton(selectedOrder);
  };
}());
