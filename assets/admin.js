const A = id => document.getElementById(id);
const API = String(window.YASHBI_CONFIG?.apiUrl || "").trim();
const TOKEN_KEY = "yashbi_admin_session_v1";
let session = JSON.parse(sessionStorage.getItem(TOKEN_KEY) || "null");
let dashboard = null;
let selectedOrder = null;

const toast = message => { const el=A("toast"); el.textContent=message;el.classList.add("show");clearTimeout(window.__adminToast);window.__adminToast=setTimeout(()=>el.classList.remove("show"),2600); };
async function api(payload) { if(!API) throw new Error("Alamat backend belum dipasang."); const response=await fetch(API,{method:"POST",redirect:"follow",body:JSON.stringify(payload)}); if(!response.ok)throw new Error("Backend tidak merespons.");const result=await response.json();if(!result.ok)throw new Error(result.error||"Permintaan ditolak.");return result; }
async function getDashboard(){const url=new URL(API);url.searchParams.set("action","admin-dashboard");url.searchParams.set("token",session.token);const response=await fetch(url);const data=await response.json();if(!data.ok)throw new Error(data.error||"Gagal memuat panel.");return data;}
const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));
const money=value=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(value||0));
function statusClass(status){return /shipping/i.test(status)?"shipping":/verifikasi/i.test(status)?"verify":"";}
const waPhone=value=>String(value||"").replace(/\D/g,"").replace(/^0/,"62");
function invoiceItemText(item){
  const total=Number(item.total || item.price*item.qty || 0);
  const original=Number(item.original||0);
  const discount=original>Number(item.price||0) ? (original-Number(item.price||0))*Number(item.qty||1) : 0;
  const priceLine=discount?`Harga: ${money(original)} → ${money(item.price)}\n  Diskon: ${money(discount)}`:`Harga: ${money(item.price)}`;
  return `• ${item.name}\n  Warna/ukuran: ${item.color} / ${item.size}\n  Jumlah: ${item.qty}\n  ${priceLine}\n  Total barang: ${money(total)}`;
}
function invoiceMessage(order){
  const items=(order.items||[]).map(invoiceItemText).join("\n\n") || "• Rincian produk tercatat pada pesanan";
  const shipping=/shipping/i.test(order.status) ? `\nEkspedisi: ${order.expedition||order.courier||"-"}\nResi: ${order.trackingNumber||"-"}` : "";
  return `Halo Kak ${order.name},\n\nTerima kasih sudah berbelanja di Yashbi Store. Berikut detail pesanan Kakak:\n\nInvoice: ${order.id}\n${items}\n\nSubtotal: ${money(order.subtotal)}\nOngkir: ${money(order.shipping)}\nTotal: ${money(order.total)}\nStatus: ${order.status}${shipping}\n\nTerima kasih.`;
}
function renderInvoiceButton(order){
  const form=A("orderUpdateForm");
  let button=A("sendInvoiceWhatsApp");
  if(!button){button=document.createElement("a");button.id="sendInvoiceWhatsApp";button.className="button button-outline button-block invoice-whatsapp";button.target="_blank";button.rel="noopener";form.before(button);}
  const phone=waPhone(order.phone);
  button.hidden=!phone;
  if(!phone)return;
  button.href=`https://wa.me/${phone}?text=${encodeURIComponent(invoiceMessage(order))}`;
  button.textContent=/shipping/i.test(order.status)?"Kirim invoice & resi via WhatsApp":"Kirim invoice via WhatsApp";
}
function renderInvoiceEmailButton(order){
  let button=A("sendInvoiceEmail");
  if(!button){button=document.createElement("a");button.id="sendInvoiceEmail";button.className="button button-outline button-block invoice-whatsapp";button.textContent="Kirim invoice via Email";A("sendInvoiceWhatsApp").after(button);}
  const email=String(order.email||"").trim();
  button.hidden=!email;
  if(!email)return;
  button.href=`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Invoice Yashbi Store ${order.id}`)}&body=${encodeURIComponent(invoiceMessage(order))}`;
}
function render(){
  A("roleBadge").textContent=session.role==="OWNER"?"Owner":"Staff";
  A("metricOnline").textContent=dashboard.counts.online;A("metricTanya").textContent=dashboard.counts.tanya;A("metricVerify").textContent=dashboard.counts.verify;A("metricShipping").textContent=dashboard.counts.shipping;
  A("syncLabel").textContent=`Diperbarui ${new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})} · data dari backend toko`;
  A("visitorCount").textContent=`${dashboard.visitors.length} tercatat`;
  A("orderCount").textContent=`${dashboard.orders.length} pesanan`;
  A("visitorList").innerHTML=dashboard.visitors.length?dashboard.visitors.map(item=>`<button class="simple-row visitor-row" type="button" data-visitor="${esc(item.sessionId)}"><span><strong>${esc(item.name)}</strong><small>${item.online?"Online sekarang":"Terakhir aktif"}</small></span><span class="status-pill">${esc(item.status)}</span></button>`).join(""):`<p class="empty-admin">Belum ada pengunjung tercatat.</p>`;
  A("orderList").innerHTML=dashboard.orders.length?dashboard.orders.map(item=>`<button class="simple-row order-row" type="button" data-order="${esc(item.id)}"><span><strong>${esc(item.name)}</strong><small>${esc(item.id)} · ${money(item.total)}</small></span><span class="status-pill ${statusClass(item.status)}">${esc(item.status)}</span></button>`).join(""):`<p class="empty-admin">Belum ada pesanan masuk.</p>`;
}
function openOrder(id){selectedOrder=dashboard.orders.find(item=>item.id===id);if(!selectedOrder)return;A("detailTitle").textContent=selectedOrder.name;A("detailContent").innerHTML=`<div class="detail-block"><strong>${esc(selectedOrder.status)}</strong>${esc(selectedOrder.id)} · ${money(selectedOrder.total)}</div><div class="detail-block"><strong>Kontak</strong>${esc(selectedOrder.phone)}${selectedOrder.email?` · ${esc(selectedOrder.email)}`:""}</div><div class="detail-block"><strong>Pengiriman</strong>${esc(selectedOrder.address)}, ${esc(selectedOrder.city)} ${esc(selectedOrder.postal)}<br>${esc(selectedOrder.courier)}</div><div class="detail-block"><strong>Bukti pembayaran</strong>${selectedOrder.proofUrl?`<a class="detail-link" target="_blank" rel="noopener" href="${esc(selectedOrder.proofUrl)}">Buka bukti transfer</a>`:"Belum ada"}</div>`;const form=A("orderUpdateForm");form.status.value=selectedOrder.status;form.expedition.value=selectedOrder.expedition||"";form.trackingNumber.value=selectedOrder.trackingNumber||"";A("detailPanel").hidden=false;}
const baseOpenOrder=openOrder;
openOrder=function(id){baseOpenOrder(id);if(!selectedOrder)return;const detail=A("detailContent");detail.insertAdjacentHTML("afterbegin",`<div class="detail-block"><strong>Sumber pesanan</strong>${esc(selectedOrder.source||"Website")}</div><div class="detail-block"><strong>Metode pembayaran</strong>${esc(selectedOrder.paymentMethod||"Transfer manual")}</div>`);};
const invoiceOpenOrder=openOrder;
openOrder=function(id){invoiceOpenOrder(id);if(!selectedOrder)return;const detail=A("detailContent");const items=(selectedOrder.items||[]).map(item=>`${esc(item.name)} · ${esc(item.color)} / ${esc(item.size)} · ${esc(item.qty)}×`).join("<br>");detail.insertAdjacentHTML("afterbegin",`<div class="detail-block"><strong>Rincian produk</strong>${items||"Belum ada rincian produk"}</div>`);renderInvoiceButton(selectedOrder);renderInvoiceEmailButton(selectedOrder);};
const courierOpenOrder=openOrder;
openOrder=function(id){courierOpenOrder(id);if(!selectedOrder)return;A("orderUpdateForm").expedition.value=selectedOrder.expedition||selectedOrder.courier||"";};
const baseRender=render;
render=function(){baseRender();A("orderList").querySelectorAll("[data-order]").forEach(row=>{const item=dashboard.orders.find(order=>order.id===row.dataset.order);if(item){const meta=row.querySelector("small");meta.textContent=`${item.id} · ${item.source||"Website"} · ${item.paymentMethod||"Transfer manual"} · ${money(item.total)}`;}});};
async function refresh(){try{dashboard=await getDashboard();render();}catch(error){if(/Sesi admin/i.test(error.message)){logout();return;}toast(error.message);}}
function logout(){session=null;sessionStorage.removeItem(TOKEN_KEY);A("appView").hidden=true;A("loginView").hidden=false;A("detailPanel").hidden=true;}
A("loginForm").addEventListener("submit",async e=>{e.preventDefault();A("loginError").hidden=true;const button=e.currentTarget.querySelector("button");button.disabled=true;button.textContent="Memeriksa akses...";try{const result=await api({action:"adminLogin",...Object.fromEntries(new FormData(e.currentTarget).entries())});session={token:result.token,role:result.role,name:result.name};sessionStorage.setItem(TOKEN_KEY,JSON.stringify(session));A("loginView").hidden=true;A("appView").hidden=false;await refresh();}catch(error){A("loginError").textContent=error.message;A("loginError").hidden=false;}finally{button.disabled=false;button.textContent="Masuk ke panel";}});
A("refreshButton").addEventListener("click",refresh);A("logoutButton").addEventListener("click",logout);A("detailClose").addEventListener("click",()=>A("detailPanel").hidden=true);
document.addEventListener("click",e=>{const row=e.target.closest("[data-order]");if(row)openOrder(row.dataset.order);});
A("orderUpdateForm").addEventListener("submit",async e=>{e.preventDefault();if(!selectedOrder)return;const button=e.currentTarget.querySelector("button");button.disabled=true;try{await api({action:"updateOrder",token:session.token,orderId:selectedOrder.id,...Object.fromEntries(new FormData(e.currentTarget).entries())});toast("Pembaruan pesanan disimpan.");await refresh();A("detailPanel").hidden=true;}catch(error){toast(error.message);}finally{button.disabled=false;}});
if(session){A("loginView").hidden=true;A("appView").hidden=false;refresh();}
