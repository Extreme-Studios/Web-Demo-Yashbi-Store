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
async function refresh(){try{dashboard=await getDashboard();render();}catch(error){if(/Sesi admin/i.test(error.message)){logout();return;}toast(error.message);}}
function logout(){session=null;sessionStorage.removeItem(TOKEN_KEY);A("appView").hidden=true;A("loginView").hidden=false;A("detailPanel").hidden=true;}
A("loginForm").addEventListener("submit",async e=>{e.preventDefault();A("loginError").hidden=true;const button=e.currentTarget.querySelector("button");button.disabled=true;button.textContent="Memeriksa akses...";try{const result=await api({action:"adminLogin",...Object.fromEntries(new FormData(e.currentTarget).entries())});session={token:result.token,role:result.role,name:result.name};sessionStorage.setItem(TOKEN_KEY,JSON.stringify(session));A("loginView").hidden=true;A("appView").hidden=false;await refresh();}catch(error){A("loginError").textContent=error.message;A("loginError").hidden=false;}finally{button.disabled=false;button.textContent="Masuk ke panel";}});
A("refreshButton").addEventListener("click",refresh);A("logoutButton").addEventListener("click",logout);A("detailClose").addEventListener("click",()=>A("detailPanel").hidden=true);
document.addEventListener("click",e=>{const row=e.target.closest("[data-order]");if(row)openOrder(row.dataset.order);});
A("orderUpdateForm").addEventListener("submit",async e=>{e.preventDefault();if(!selectedOrder)return;const button=e.currentTarget.querySelector("button");button.disabled=true;try{await api({action:"updateOrder",token:session.token,orderId:selectedOrder.id,...Object.fromEntries(new FormData(e.currentTarget).entries())});toast("Pembaruan pesanan disimpan.");await refresh();A("detailPanel").hidden=true;}catch(error){toast(error.message);}finally{button.disabled=false;}});
if(session){A("loginView").hidden=true;A("appView").hidden=false;refresh();}
