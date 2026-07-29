/* Email invoice helper. Loaded after the main operations script. */
(function(){
  const previousOpenOrder = openOrder;
  openOrder = function(id){
    previousOpenOrder(id);
    if(!selectedOrder) return;
    const form = A("orderUpdateForm");
    let field = form.querySelector('[name="email"]');
    if(!field){
      const label = document.createElement("label");
      label.className = "field";
      label.innerHTML = '<span>Email pembeli <small>(untuk kirim invoice)</small></span><input type="email" name="email" placeholder="nama@email.com">';
      form.querySelector('[name="expedition"]').closest("label").before(label);
      field = label.querySelector("input");
    }
    field.value = selectedOrder.email || "";
    const button = A("sendInvoiceEmail");
    if(!button) return;
    button.hidden = false;
    const email = String(selectedOrder.email || "").trim();
    if(!email){
      button.href = "#email-pembeli";
      button.textContent = "Isi email pembeli";
      button.removeAttribute("aria-disabled");
      button.onclick = event => {
        event.preventDefault();
        const value = window.prompt("Masukkan email pembeli untuk menerima invoice:", field.value || "");
        if(value === null) return;
        const entered = String(value).trim();
        if(!/^\S+@\S+\.\S+$/.test(entered)){
          toast("Format email belum benar.");
          field.focus();
          return;
        }
        field.value = entered;
        field.scrollIntoView({behavior:"smooth",block:"center"});
        field.focus();
        selectedOrder.email = entered;
        button.onclick = null;
        button.textContent = "Kirim invoice via Email";
        button.href = `mailto:${encodeURIComponent(entered)}?subject=${encodeURIComponent(`Invoice Yashbi Store ${selectedOrder.id}`)}&body=${encodeURIComponent(invoiceMessage(selectedOrder))}`;
        toast("Email siap dipakai. Tekan Simpan pembaruan agar tersimpan di pesanan.");
      };
      return;
    }
    button.onclick = null;
    button.removeAttribute("aria-disabled");
    button.textContent = "Kirim invoice via Email";
    button.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Invoice Yashbi Store ${selectedOrder.id}`)}&body=${encodeURIComponent(invoiceMessage(selectedOrder))}`;
  };
})();
