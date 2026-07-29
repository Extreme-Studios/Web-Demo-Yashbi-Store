const PRODUCTS = [
  {id:"GW-001",name:"Serena Sage Gown",category:"Gaun Wanita",price:899000,original:1099000,badge:"Best Seller",rating:4.9,reviews:48,image:"https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=85",colors:["Sage","Champagne"],colorHex:["#9eaa91","#dbc8aa"],sizes:["S","M","L","XL"],stock:12,desc:"Gaun panjang berpotongan anggun dengan jatuh kain lembut dan detail pinggang yang membentuk siluet elegan."},
  {id:"GW-002",name:"Amara Blush Dress",category:"Gaun Wanita",price:749000,original:null,badge:"New",rating:4.8,reviews:21,image:"https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85",colors:["Blush","Ivory"],colorHex:["#d9aaa5","#eee7dc"],sizes:["S","M","L"],stock:8,desc:"Dress feminin dengan warna blush lembut, cocok untuk pesta siang, lamaran, atau makan malam spesial."},
  {id:"GW-003",name:"Celeste Evening Blue",category:"Gaun Wanita",price:979000,original:1199000,badge:"Limited",rating:4.9,reviews:17,image:"https://images.unsplash.com/photo-1562137369-1a1a0bc66744?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=85",colors:["Powder Blue","Navy"],colorHex:["#9baebd","#26344d"],sizes:["S","M","L","XL"],stock:6,desc:"Evening gown bernuansa biru dengan struktur ringan dan kilau halus untuk tampilan yang tenang namun berkelas."},
  {id:"GW-004",name:"Nadine Satin Ivory",category:"Gaun Wanita",price:829000,original:null,badge:null,rating:4.7,reviews:32,image:"https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=900&q=85",colors:["Ivory","Rose"],colorHex:["#ece4d7","#b98586"],sizes:["S","M","L"],stock:10,desc:"Gaun satin minimalis dengan kilau lembut, garis leher bersih, dan siluet modern yang mudah diaksesori."},
  {id:"GW-005",name:"Livia Emerald Flow",category:"Gaun Wanita",price:929000,original:1049000,badge:"Best Seller",rating:4.9,reviews:55,image:"https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85",colors:["Emerald","Black"],colorHex:["#365e4e","#242424"],sizes:["S","M","L","XL"],stock:14,desc:"Gaun flowy warna emerald dengan karakter kuat, nyaman bergerak, dan memberi kesan mewah tanpa berlebihan."},
  {id:"GW-006",name:"Aurelia Champagne",category:"Gaun Wanita",price:1099000,original:1299000,badge:"Signature",rating:5,reviews:12,image:"https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=900&q=85",colors:["Champagne","Mocha"],colorHex:["#d8c19c","#907466"],sizes:["S","M","L"],stock:5,desc:"Koleksi signature dengan detail tekstur halus dan rona champagne yang memantulkan cahaya secara elegan."},
  {id:"GW-007",name:"Mirelle Mauve Gown",category:"Gaun Wanita",price:789000,original:null,badge:null,rating:4.8,reviews:26,image:"https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85",colors:["Mauve","Dusty Pink"],colorHex:["#9d7d8a","#c89fa0"],sizes:["S","M","L","XL"],stock:11,desc:"Potongan modest modern dalam warna mauve yang lembut, lengkap dengan lengan nyaman dan rok berjatuh cantik."},
  {id:"GW-008",name:"Elara Midnight Black",category:"Gaun Wanita",price:949000,original:1149000,badge:"Evening Edit",rating:4.9,reviews:39,image:"https://images.unsplash.com/photo-1568251188392-ae32f898cb3b?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85",colors:["Black","Burgundy"],colorHex:["#1f1d1d","#632e3b"],sizes:["S","M","L"],stock:7,desc:"Gaun hitam serbaguna dengan detail drape modern, pilihan aman untuk gala, resepsi, dan acara formal malam."},

  {id:"SW-001",name:"Odette Pearl Heels",category:"Sepatu Wanita",price:469000,original:549000,badge:"Best Seller",rating:4.9,reviews:66,image:"https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1562273138-f46be4ebdf33?auto=format&fit=crop&w=900&q=85",colors:["Pearl","Nude"],colorHex:["#e8e0d5","#c9a68d"],sizes:["36","37","38","39","40"],stock:22,desc:"Heels berujung runcing dengan tinggi nyaman dan warna pearl yang mudah dipadukan untuk kerja maupun pesta."},
  {id:"SW-002",name:"Camille Nude Pumps",category:"Sepatu Wanita",price:429000,original:null,badge:null,rating:4.8,reviews:44,image:"https://images.unsplash.com/photo-1562273138-f46be4ebdf33?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=85",colors:["Nude","Black"],colorHex:["#cba68c","#242424"],sizes:["36","37","38","39","40"],stock:19,desc:"Pumps klasik dengan bantalan empuk dan warna nude yang memberi kesan kaki lebih jenjang."},
  {id:"SW-003",name:"Belle Ribbon Flats",category:"Sepatu Wanita",price:359000,original:419000,badge:"New",rating:4.7,reviews:25,image:"https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=85",colors:["Rose","Cream"],colorHex:["#c98788","#e2d3bd"],sizes:["36","37","38","39","40"],stock:16,desc:"Flat shoes feminin dengan aksen pita minimal dan sol fleksibel untuk aktivitas sepanjang hari."},
  {id:"SW-004",name:"Sienna Leather Loafer",category:"Sepatu Wanita",price:499000,original:null,badge:"Work Edit",rating:4.8,reviews:31,image:"https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=900&q=85",colors:["Tan","Black"],colorHex:["#9e6849","#252525"],sizes:["36","37","38","39","40"],stock:12,desc:"Loafer bertekstur kulit dengan garis bersih, cocok untuk tampilan kerja yang profesional dan tetap nyaman."},
  {id:"SW-005",name:"Luna Metallic Slingback",category:"Sepatu Wanita",price:519000,original:599000,badge:"Party Edit",rating:4.9,reviews:18,image:"https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=85",colors:["Silver","Champagne"],colorHex:["#b9bcc0","#d1b889"],sizes:["36","37","38","39"],stock:9,desc:"Slingback dengan sentuhan metallic halus yang menangkap cahaya, dibuat untuk menambah kilau pada pesta malam."},
  {id:"SW-006",name:"Riviera White Sneaker",category:"Sepatu Wanita",price:449000,original:null,badge:"Everyday",rating:4.8,reviews:72,image:"https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=900&q=85",colors:["White","Sage"],colorHex:["#f0efea","#97a18e"],sizes:["36","37","38","39","40"],stock:26,desc:"Sneaker putih ringan dengan desain bersih untuk gaya kasual, kampus, dan perjalanan akhir pekan."},
  {id:"SW-007",name:"Valerie Block Heels",category:"Sepatu Wanita",price:479000,original:539000,badge:null,rating:4.7,reviews:29,image:"https://images.unsplash.com/photo-1554062614-6da4fa67725a?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=85",colors:["Black","Caramel"],colorHex:["#242424","#ad7954"],sizes:["36","37","38","39","40"],stock:13,desc:"Block heels stabil dengan tali ramping, memberikan tinggi yang elegan tanpa mengorbankan kenyamanan."},

  {id:"JP-001",name:"Alden Sand Tailored Suit",category:"Jas Pria",price:1499000,original:1749000,badge:"Signature",rating:4.9,reviews:37,image:"https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=85",colors:["Sand","Charcoal"],colorHex:["#c5b59c","#454747"],sizes:["S","M","L","XL","XXL"],stock:9,desc:"Setelan tailoring modern berwarna sand dengan bahu terstruktur lembut dan potongan yang rapi untuk acara penting."},
  {id:"JP-002",name:"Bastian Navy Classic",category:"Jas Pria",price:1399000,original:null,badge:"Best Seller",rating:4.9,reviews:61,image:"https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=85",colors:["Navy","Black"],colorHex:["#283448","#222222"],sizes:["S","M","L","XL","XXL"],stock:17,desc:"Jas navy klasik yang fleksibel untuk kerja, pernikahan, dan acara formal dengan tampilan tajam tanpa berlebihan."},
  {id:"JP-003",name:"Cyrus Charcoal Slim",category:"Jas Pria",price:1449000,original:1599000,badge:null,rating:4.8,reviews:33,image:"https://images.unsplash.com/photo-1598808503746-f34c53b9323e?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=85",colors:["Charcoal","Slate"],colorHex:["#46494b","#68737b"],sizes:["S","M","L","XL"],stock:11,desc:"Siluet slim dalam warna charcoal dengan lapel ramping, ideal untuk tampilan bisnis kontemporer."},
  {id:"JP-004",name:"Damar Black Formal",category:"Jas Pria",price:1599000,original:1899000,badge:"Formal Edit",rating:5,reviews:24,image:"https://images.unsplash.com/photo-1555069519-127aadedf1ee?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=85",colors:["Black"],colorHex:["#202020"],sizes:["S","M","L","XL","XXL"],stock:8,desc:"Jas hitam formal dengan struktur presisi dan detail satin halus untuk resepsi, gala, atau acara black tie."},
  {id:"JP-005",name:"Elio Powder Blue Suit",category:"Jas Pria",price:1549000,original:null,badge:"New",rating:4.8,reviews:16,image:"https://images.unsplash.com/photo-1555069519-127aadedf1ee?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=85",colors:["Powder Blue","Ivory"],colorHex:["#91a8bd","#ded8cb"],sizes:["S","M","L","XL"],stock:7,desc:"Setelan biru muda yang segar untuk acara siang, prewedding, atau perayaan dengan tema modern."},
  {id:"JP-006",name:"Faris Olive Textured",category:"Jas Pria",price:1479000,original:1649000,badge:"Modern Edit",rating:4.8,reviews:20,image:"https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=85",colors:["Olive","Brown"],colorHex:["#68725d","#72574a"],sizes:["S","M","L","XL"],stock:10,desc:"Jas olive bertekstur halus dengan karakter santai-elegan, mudah dipadukan dengan kemeja putih atau krem."},
  {id:"JP-007",name:"Gavin Mocha Double Breasted",category:"Jas Pria",price:1699000,original:null,badge:"Premium",rating:4.9,reviews:19,image:"https://images.unsplash.com/photo-1555069519-127aadedf1ee?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=85",colors:["Mocha","Cream"],colorHex:["#8a6d5d","#d4c7b3"],sizes:["M","L","XL"],stock:6,desc:"Double-breasted suit dengan proporsi modern dan warna mocha yang hangat untuk tampilan premium yang berani."},
  {id:"JP-008",name:"Harris Grey Travel Blazer",category:"Jas Pria",price:1199000,original:1399000,badge:"Travel Edit",rating:4.7,reviews:42,image:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=85",colors:["Grey","Navy"],colorHex:["#808080","#293649"],sizes:["S","M","L","XL","XXL"],stock:15,desc:"Blazer ringan anti-kusut untuk perjalanan bisnis dan agenda harian, tetap rapi meski digunakan sepanjang hari."},

  {id:"SP-001",name:"Arden Tan Oxford",category:"Sepatu Pria",price:679000,original:779000,badge:"Best Seller",rating:4.9,reviews:58,image:"https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=900&q=85",colors:["Tan","Dark Brown"],colorHex:["#a66f49","#513a30"],sizes:["39","40","41","42","43","44"],stock:21,desc:"Oxford kulit berwarna tan dengan konstruksi klasik, pasangan tepat untuk jas maupun smart casual."},
  {id:"SP-002",name:"Bromley Black Derby",category:"Sepatu Pria",price:699000,original:null,badge:"Formal Edit",rating:4.8,reviews:46,image:"https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=900&q=85",colors:["Black"],colorHex:["#202020"],sizes:["39","40","41","42","43","44"],stock:18,desc:"Derby hitam dengan bentuk ramping dan finishing bersih untuk kebutuhan kantor hingga pesta formal."},
  {id:"SP-003",name:"Cavendish Brown Loafer",category:"Sepatu Pria",price:629000,original:729000,badge:null,rating:4.8,reviews:36,image:"https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=900&q=85",colors:["Brown","Black"],colorHex:["#79533e","#242424"],sizes:["39","40","41","42","43"],stock:14,desc:"Loafer kulit slip-on yang ringan, cocok untuk pertemuan bisnis, makan malam, dan tampilan akhir pekan."},
  {id:"SP-004",name:"Dante White Court",category:"Sepatu Pria",price:579000,original:null,badge:"Gen Z Pick",rating:4.9,reviews:77,image:"https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=900&q=85",colors:["White","Black"],colorHex:["#eeeae2","#252525"],sizes:["39","40","41","42","43","44"],stock:28,desc:"Sneaker court putih minimalis yang mudah dipadukan dengan denim, chino, maupun setelan kasual modern."},
  {id:"SP-005",name:"Easton Navy Suede",category:"Sepatu Pria",price:649000,original:749000,badge:"Weekend Edit",rating:4.7,reviews:28,image:"https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=900&q=85",colors:["Navy","Sand"],colorHex:["#334359","#b5a286"],sizes:["39","40","41","42","43"],stock:13,desc:"Sepatu suede navy dengan karakter santai-premium untuk acara semi formal dan akhir pekan."},
  {id:"SP-006",name:"Fletcher Chunky Sneaker",category:"Sepatu Pria",price:599000,original:null,badge:"New",rating:4.8,reviews:34,image:"https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=85",colors:["Grey","White"],colorHex:["#8b9091","#ece9e2"],sizes:["39","40","41","42","43","44"],stock:24,desc:"Sneaker chunky dengan bantalan responsif dan siluet modern, cocok untuk street style dan aktivitas harian."},
  {id:"SP-007",name:"Grant Espresso Monk Strap",category:"Sepatu Pria",price:749000,original:849000,badge:"Premium",rating:4.9,reviews:22,image:"https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=900&q=85",alt:"https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=900&q=85",colors:["Espresso","Tan"],colorHex:["#49352e","#a27151"],sizes:["39","40","41","42","43"],stock:9,desc:"Monk strap premium dengan buckle rapi dan warna espresso dalam, dibuat untuk pria yang menyukai detail berbeda."}
];

PRODUCTS.forEach(product => {
  const filename = product.id.toLowerCase();
  const secondaryPhoto = product.alt;
  product.image = `assets/images/products/${filename}.webp`;
  product.colorImages = {};
  product.colors.forEach((color, index) => {
    product.colorImages[color] = index === 0 ? product.image : (secondaryPhoto || product.image);
  });
});
// Setiap pilihan warna kedua memiliki foto katalog tersendiri. Tidak ada lagi
// fallback ke foto produk lain/eksternal saat pembeli mengganti warna.
const COLOR_VARIANT_ASSETS = {
  "GW-001": {"Champagne":"gw-001-champagne.png"}, "GW-002": {"Ivory":"gw-002-ivory.png"},
  "GW-003": {"Navy":"gw-003-navy.png"}, "GW-004": {"Rose":"gw-004-rose.png"},
  "GW-005": {"Black":"gw-005-black.png"}, "GW-006": {"Mocha":"gw-006-mocha.png"},
  "GW-007": {"Dusty Pink":"gw-007-dusty-pink.png"}, "GW-008": {"Burgundy":"gw-008-burgundy.png"},
  "SW-001": {"Nude":"sw-001-nude.png"}, "SW-002": {"Black":"sw-002-black.png"},
  "SW-003": {"Cream":"sw-003-cream.png"}, "SW-004": {"Black":"sw-004-black.png"},
  "SW-005": {"Champagne":"sw-005-champagne.png"}, "SW-006": {"Sage":"sw-006-sage.png"},
  "SW-007": {"Caramel":"sw-007-caramel.png"},
  "JP-001": {"Charcoal":"jp-001-charcoal.png"}, "JP-002": {"Black":"jp-002-black.png"},
  "JP-003": {"Slate":"jp-003-slate.png"}, "JP-005": {"Ivory":"jp-005-ivory.png"},
  "JP-006": {"Brown":"jp-006-brown.png"}, "JP-007": {"Cream":"jp-007-cream.png"},
  "JP-008": {"Navy":"jp-008-navy.png"},
  "SP-001": {"Dark Brown":"sp-001-dark-brown.png"}, "SP-003": {"Black":"sp-003-black.png"},
  "SP-004": {"Black":"sp-004-black.png"}, "SP-005": {"Sand":"sp-005-sand.png"},
  "SP-006": {"White":"sp-006-white.png"}, "SP-007": {"Tan":"sp-007-tan.png"}
};
Object.entries(COLOR_VARIANT_ASSETS).forEach(([id, variants]) => {
  const product = PRODUCTS.find(item => item.id === id);
  if (!product) return;
  Object.entries(variants).forEach(([color, filename]) => {
    product.colorImages[color] = `assets/images/products/${filename}`;
  });
});

const money = value => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(value);
const byId = id => document.getElementById(id);
const STORE_KEYS = {cart:"yashbi_cart_v1",orders:"yashbi_orders_v1",visitor:"yashbi_visitor_v1",queue:"yashbi_sync_queue_v1"};
const API_URL = String(window.YASHBI_CONFIG?.apiUrl || "").trim();

let cart = JSON.parse(localStorage.getItem(STORE_KEYS.cart) || "[]");
let activeCategory = "all";
let activeSearch = "";
let activeSort = "featured";
let selectedProduct = null;
let selectedColor = null;
let selectedSize = null;
let proofData = null;
let visitor = JSON.parse(localStorage.getItem(STORE_KEYS.visitor) || "null");
let pendingCheckout = false;
const orderSource = (() => {
  const value = new URLSearchParams(location.search).get("source") || new URLSearchParams(location.search).get("src") || "";
  const source = value.trim().toLowerCase();
  if (source === "wa" || source === "whatsapp") return "WhatsApp";
  if (source === "chat" || source === "chatbot") return "Chatbot";
  return "Website";
})();

function newId(prefix) {
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

function readQueue() { return JSON.parse(localStorage.getItem(STORE_KEYS.queue) || "[]"); }
function writeQueue(queue) { localStorage.setItem(STORE_KEYS.queue, JSON.stringify(queue)); }

async function postApi(payload) {
  if (!API_URL) throw new Error("Backend belum dikonfigurasi.");
  const response = await fetch(API_URL, {method:"POST",redirect:"follow",body:JSON.stringify(payload)});
  if (!response.ok) throw new Error("Server tidak dapat menerima data.");
  const result = await response.json();
  if (!result.ok) throw new Error(result.error || "Permintaan ditolak server.");
  return result;
}

async function syncQueue() {
  const queue = readQueue();
  if (!queue.length || !navigator.onLine || !API_URL) return;
  const remaining=[];
  for (const queued of queue) {
    try { await postApi({...queued.payload, action:"syncOrder"}); }
    catch (error) { remaining.push(queued); }
  }
  writeQueue(remaining);
}

async function syncVisitor(status="Online / Tanya", orderId="") {
  if (!visitor) return;
  try { await postApi({action:"upsertVisitor",sessionId:visitor.sessionId,name:visitor.name,status,orderId}); }
  catch (error) { console.warn("Status pengunjung belum tersinkron:", error); }
}

const productGrid = byId("productGrid");
const backdrop = byId("backdrop");

function renderProducts() {
  let list = PRODUCTS.filter(p => {
    const categoryMatch = activeCategory === "all" || p.category === activeCategory;
    const haystack = `${p.name} ${p.category} ${p.colors.join(" ")} ${p.desc}`.toLowerCase();
    return categoryMatch && (!activeSearch || haystack.includes(activeSearch.toLowerCase()));
  });
  if (activeSort === "price-low") list.sort((a,b)=>a.price-b.price);
  if (activeSort === "price-high") list.sort((a,b)=>b.price-a.price);
  if (activeSort === "newest") list.sort((a,b)=>(b.badge==="New")-(a.badge==="New"));

  byId("productResultCount").textContent = `${list.length} produk`;
  byId("catalogTitle").textContent = activeCategory === "all" ? "Semua Koleksi" : activeCategory;
  byId("emptyState").hidden = list.length > 0;
  productGrid.innerHTML = list.map(p => `
    <article class="product-card">
      <div class="product-media" data-product-id="${p.id}" role="button" tabindex="0" aria-label="Lihat detail ${p.name}">
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='assets/images/yashbi-hero.png'">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ""}
        <button class="quick-add" type="button" data-open-product="${p.id}">Lihat & Pilih</button>
      </div>
      <div class="product-info">
        <div class="product-meta">
          <div><p class="product-category">${p.category}</p><h3>${p.name}</h3></div>
          <div class="swatches">${p.colorHex.slice(0,3).map(c=>`<i style="background:${c}"></i>`).join("")}</div>
        </div>
        <p><strong>${money(p.price)}</strong>${p.original ? `<span class="original-price">${money(p.original)}</span>` : ""}</p>
      </div>
    </article>`).join("");
}

async function hydrateCatalogImages() {
  if (!API_URL) return;
  try {
    const url = new URL(API_URL);
    url.searchParams.set("action", "products");
    const response = await fetch(url);
    const payload = await response.json();
    if (!payload.ok || !Array.isArray(payload.products)) return;
    payload.products.forEach(asset => {
      const product = PRODUCTS.find(item => item.id === String(asset.id).toUpperCase());
      if (product) {
        product.remoteImage = asset.image;
      }
    });
    renderProducts();
    renderCart();
  } catch (error) {
    console.warn("Gambar katalog Drive belum dapat dimuat:", error);
  }
}

function setCategory(category) {
  activeCategory = category;
  document.querySelectorAll("[data-filter]").forEach(b => b.classList.toggle("active", b.dataset.filter === category));
  renderProducts();
  byId("koleksi").scrollIntoView({behavior:"smooth"});
  byId("mobileNav").classList.remove("open");
}

function openProduct(id) {
  selectedProduct = PRODUCTS.find(p=>p.id===id);
  if (!selectedProduct) return;
  selectedColor = selectedProduct.colors[0];
  selectedSize = null;
  byId("productModalImage").src = imageForColor(selectedProduct, selectedColor);
  byId("productModalImage").alt = selectedProduct.name;
  byId("productModalCategory").textContent = selectedProduct.category;
  byId("productModalTitle").textContent = selectedProduct.name;
  byId("productModalPrice").textContent = money(selectedProduct.price);
  byId("productModalOriginal").textContent = selectedProduct.original ? money(selectedProduct.original) : "";
  byId("productModalRating").textContent = `${selectedProduct.rating} · ${selectedProduct.reviews} ulasan`;
  byId("productModalDescription").textContent = selectedProduct.desc;
  byId("stockNote").textContent = `Tersedia · ${selectedProduct.stock} item dalam stok online`;
  byId("thumbnailRow").innerHTML = selectedProduct.colors.map((color,i)=>{
    const img=imageForColor(selectedProduct,color);
    return `<button type="button" class="${i===0?"active":""}" data-thumb="${img}" data-image-color="${color}"><img src="${img}" alt="${selectedProduct.name} warna ${color}"></button>`;
  }).join("");
  byId("colorOptions").innerHTML = selectedProduct.colors.map((c,i)=>`<button type="button" class="color-option ${i===0?"active":""}" data-color="${c}" title="${c}"><i style="background:${selectedProduct.colorHex[i]}"></i></button>`).join("");
  byId("selectedColorLabel").textContent = selectedColor;
  byId("sizeOptions").innerHTML = selectedProduct.sizes.map(s=>`<button type="button" class="size-option" data-size="${s}">${s}</button>`).join("");
  openModal("productModal");
}

function imageForColor(product, color) {
  return product?.colorImages?.[color] || product?.image || "";
}

function updateProductColorImage() {
  if (!selectedProduct || !selectedColor) return;
  byId("productModalImage").src = imageForColor(selectedProduct, selectedColor);
  document.querySelectorAll("[data-thumb]").forEach(button => button.classList.toggle("active", button.dataset.imageColor === selectedColor));
}

function openModal(id) {
  document.querySelectorAll(".modal-panel.open").forEach(m=>m.classList.remove("open"));
  byId(id).classList.add("open");
  backdrop.classList.add("open");
  document.body.classList.add("modal-open");
}

function closeModals() {
  document.querySelectorAll(".modal-panel.open").forEach(m=>m.classList.remove("open"));
  byId("cartDrawer").classList.remove("open");
  byId("cartDrawer").setAttribute("aria-hidden","true");
  backdrop.classList.remove("open");
  document.body.classList.remove("modal-open");
}

function persistCart() {
  localStorage.setItem(STORE_KEYS.cart, JSON.stringify(cart));
  renderCart();
}

function openCheckoutFlow() {
  if (!cart.length) return;
  if (!visitor) {
    pendingCheckout = true;
    openModal("identityModal");
    toast("Isi nama panggilan dulu agar pesananmu tidak tertukar.");
    return;
  }
  pendingCheckout = false;
  syncVisitor("Checkout — belum bayar");
  renderCheckout();
  openModal("checkoutModal");
}

function addSelectedToCart(openCheckout = false) {
  if (!selectedSize) return toast("Pilih ukuran terlebih dahulu.");
  const key = `${selectedProduct.id}-${selectedColor}-${selectedSize}`;
  const existing = cart.find(i=>i.key===key);
  if (existing) existing.qty += 1;
  else cart.push({key,productId:selectedProduct.id,color:selectedColor,size:selectedSize,qty:1});
  persistCart();
  closeModals();
  if (openCheckout) {
    openCheckoutFlow();
    return;
  }
  toast(`${selectedProduct.name} masuk keranjang.`);
}

function renderCart() {
  const count = cart.reduce((n,i)=>n+i.qty,0);
  byId("cartCount").textContent = count;
  const items = byId("cartItems");
  if (!cart.length) {
    items.innerHTML = "";
    byId("cartEmpty").hidden = false;
    byId("cartSummary").hidden = true;
    return;
  }
  byId("cartEmpty").hidden = true;
  byId("cartSummary").hidden = false;
  items.innerHTML = cart.map(item => {
    const p = PRODUCTS.find(x=>x.id===item.productId);
    return `<article class="cart-item">
      <img src="${p.image}" alt="${p.name}">
      <div><h3>${p.name}</h3><p>${item.color} · Ukuran ${item.size}</p><strong>${money(p.price)}</strong>
      <div class="quantity-control"><button type="button" data-qty="${item.key}" data-delta="-1">−</button><span>${item.qty}</span><button type="button" data-qty="${item.key}" data-delta="1">+</button></div></div>
      <button class="cart-remove" type="button" data-remove="${item.key}" aria-label="Hapus ${p.name}">×</button>
    </article>`;
  }).join("");
  byId("cartSubtotal").textContent = money(cartTotal());
}

function cartTotal() {
  return cart.reduce((sum,item)=>sum+PRODUCTS.find(p=>p.id===item.productId).price*item.qty,0);
}

function openCart() {
  renderCart();
  byId("cartDrawer").classList.add("open");
  byId("cartDrawer").setAttribute("aria-hidden","false");
  backdrop.classList.add("open");
  document.body.classList.add("modal-open");
}

function renderCheckout() {
  byId("checkoutItems").innerHTML = cart.map(item=>{
    const p=PRODUCTS.find(x=>x.id===item.productId);
    return `<div class="checkout-line"><img src="${p.image}" alt=""><div><strong>${p.name}</strong><small>${item.color} · ${item.size} · ${item.qty}×</small></div><span>${money(p.price*item.qty)}</span></div>`;
  }).join("");
  byId("checkoutSubtotal").textContent = money(cartTotal());
  byId("checkoutTotal").textContent = money(cartTotal());
  byId("checkoutSource").textContent = `Sumber pesanan: ${orderSource}`;
}

function readAndCompressImage(file) {
  return new Promise((resolve,reject)=>{
    if (!file || !file.type.startsWith("image/")) return reject(new Error("File harus berupa gambar."));
    if (file.size > 5*1024*1024) return reject(new Error("Ukuran bukti maksimal 5 MB."));
    const reader = new FileReader();
    reader.onerror = ()=>reject(new Error("Gambar gagal dibaca."));
    reader.onload = e => {
      const img = new Image();
      img.onerror = ()=>reject(new Error("Format gambar tidak didukung."));
      img.onload = () => {
        const scale = Math.min(1, 1200/img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width*scale); canvas.height = Math.round(img.height*scale);
        canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL("image/jpeg",.78));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function shippingCost(courier) {
  const match = String(courier || "").match(/Rp([\d.]+)/);
  return match ? Number(match[1].replace(/\./g,"")) : 0;
}

async function sendOrderToBackend(order) {
  const items = order.items.map(item => {
    const product = PRODUCTS.find(product => product.id === item.productId);
    return {...item,name:product.name,price:product.price};
  });
  const result = await postApi({action:"createOrder",clientOrderId:order.clientOrderId,sessionId:visitor?.sessionId || "",customer:order.customer,items,subtotal:order.subtotal,shipping:order.shipping,proof:order.proof,source:order.source});
  return result.order;
}

async function createOrder(form) {
  const orders = JSON.parse(localStorage.getItem(STORE_KEYS.orders) || "[]");
  const now = new Date();
  const localId = `TMP-${String(now.getFullYear()).slice(-2)}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-${String(orders.length+1).padStart(3,"0")}`;
  const data = Object.fromEntries(new FormData(form).entries());
  delete data.proof;
  const order = {id:localId,clientOrderId:newId("YSH"),createdAt:now.toISOString(),customer:data,items:[...cart],subtotal:cartTotal(),shipping:shippingCost(data.courier),status:"Menunggu Verifikasi Pembayaran",proof:proofData,source:orderSource,syncState:"Mencoba sinkron"};
  try {
    const remoteOrder = await sendOrderToBackend(order);
    if (remoteOrder) { Object.assign(order, remoteOrder); order.syncState="Tersinkron"; await syncVisitor(order.status, order.id); }
  } catch (error) {
    order.syncError = error.message;
    order.status = "Menunggu sinkronisasi";
    order.syncState = "Antrean perangkat ini";
    writeQueue([...readQueue(), {payload:{action:"syncOrder",clientOrderId:order.clientOrderId,sessionId:visitor?.sessionId || "",customer:order.customer,items:order.items.map(item=>{const product=PRODUCTS.find(p=>p.id===item.productId);return {...item,name:product.name,price:product.price};}),subtotal:order.subtotal,shipping:order.shipping,proof:order.proof,source:order.source},queuedAt:now.toISOString()}]);
    console.warn("Pesanan menunggu sinkronisasi:", error);
  }
  orders.unshift(order);
  try { localStorage.setItem(STORE_KEYS.orders, JSON.stringify(orders)); }
  catch {
    order.proof = "Bukti diterima (pratinjau tidak disimpan di browser demo)";
    localStorage.setItem(STORE_KEYS.orders, JSON.stringify(orders));
  }
  cart = []; persistCart(); proofData = null; form.reset();
  byId("proofPreview").hidden = true;
  return order;
}

function toast(message) {
  const el=byId("toast"); el.textContent=message; el.classList.add("show");
  clearTimeout(window.__toastTimer); window.__toastTimer=setTimeout(()=>el.classList.remove("show"),2600);
}

document.addEventListener("click", e => {
  const category = e.target.closest("[data-category-link]")?.dataset.categoryLink;
  if (category) { e.preventDefault(); setCategory(category); }
  const productId = e.target.closest("[data-product-id]")?.dataset.productId || e.target.closest("[data-open-product]")?.dataset.openProduct;
  if (productId) openProduct(productId);
  const filter = e.target.closest("[data-filter]")?.dataset.filter;
  if (filter) setCategory(filter);
  const thumb = e.target.closest("[data-thumb]");
  if (thumb) {
    if (thumb.dataset.imageColor) {
      selectedColor=thumb.dataset.imageColor;
      byId("selectedColorLabel").textContent=selectedColor;
      document.querySelectorAll("[data-color]").forEach(c=>c.classList.toggle("active",c.dataset.color===selectedColor));
      updateProductColorImage();
    } else {
      byId("productModalImage").src=thumb.dataset.thumb;
      document.querySelectorAll("[data-thumb]").forEach(t=>t.classList.toggle("active",t===thumb));
    }
  }
  const color = e.target.closest("[data-color]");
  if (color) {
    selectedColor=color.dataset.color; byId("selectedColorLabel").textContent=selectedColor;
    document.querySelectorAll("[data-color]").forEach(c=>c.classList.toggle("active",c===color));
    updateProductColorImage();
  }
  const size = e.target.closest("[data-size]");
  if (size) {
    selectedSize=size.dataset.size; document.querySelectorAll("[data-size]").forEach(s=>s.classList.toggle("active",s===size));
  }
  const qty = e.target.closest("[data-qty]");
  if (qty) {
    const item=cart.find(i=>i.key===qty.dataset.qty); item.qty+=Number(qty.dataset.delta);
    if(item.qty<=0) cart=cart.filter(i=>i.key!==item.key); persistCart();
  }
  const remove = e.target.closest("[data-remove]");
  if(remove) { cart=cart.filter(i=>i.key!==remove.dataset.remove); persistCart(); }
  if(e.target.closest("[data-close-modal]")) closeModals();
});

byId("filterRow").addEventListener("click",()=>{});
byId("sortSelect").addEventListener("change",e=>{activeSort=e.target.value;renderProducts();});
byId("searchToggle").addEventListener("click",()=>{byId("searchBar").classList.add("open");setTimeout(()=>byId("globalSearch").focus(),200);});
byId("searchClose").addEventListener("click",()=>byId("searchBar").classList.remove("open"));
byId("globalSearch").addEventListener("input",e=>{activeSearch=e.target.value;activeCategory="all";renderProducts();byId("koleksi").scrollIntoView({behavior:"smooth"});});
byId("resetSearch").addEventListener("click",()=>{activeSearch="";activeCategory="all";byId("globalSearch").value="";renderProducts();});
byId("menuToggle").addEventListener("click",()=>byId("mobileNav").classList.toggle("open"));
byId("cartToggle").addEventListener("click",openCart);
byId("cartClose").addEventListener("click",closeModals);
byId("cartShopButton").addEventListener("click",()=>{closeModals();byId("koleksi").scrollIntoView({behavior:"smooth"});});
backdrop.addEventListener("click",closeModals);
byId("addToCartButton").addEventListener("click",()=>addSelectedToCart());
byId("buyNowButton").addEventListener("click",()=>addSelectedToCart(true));
byId("checkoutOpen").addEventListener("click",openCheckoutFlow);
byId("productImageZoom").addEventListener("click",()=>{byId("lightboxImage").src=byId("productModalImage").src;byId("imageLightbox").classList.add("open");});
byId("lightboxClose").addEventListener("click",()=>byId("imageLightbox").classList.remove("open"));
byId("imageLightbox").addEventListener("click",e=>{if(e.target===byId("imageLightbox"))e.currentTarget.classList.remove("open");});
byId("sizeGuideButton").addEventListener("click",()=>toast("Panduan ukuran lengkap akan tersedia pada versi customer."));
byId("trackOrderOpen").addEventListener("click",()=>openModal("trackModal"));
byId("newsletterForm").addEventListener("submit",e=>{e.preventDefault();e.currentTarget.reset();toast("Terima kasih. Kamu sudah masuk Yashbi Circle.");});

byId("proofInput").addEventListener("change",async e=>{
  try {
    proofData=await readAndCompressImage(e.target.files[0]);
    byId("proofPreview").src=proofData;byId("proofPreview").hidden=false;
    byId("uploadTitle").textContent="Bukti transfer siap diunggah";
    byId("uploadHint").textContent=e.target.files[0].name;
  } catch(err) { e.target.value=""; proofData=null; toast(err.message); }
});

byId("checkoutForm").addEventListener("change",e=>{
  if(e.target.name==="courier") {
    const match=e.target.value.match(/Rp([\d.]+)/); const shipping=match?Number(match[1].replace(".","")):0;
    byId("checkoutShipping").textContent=shipping?money(shipping):e.target.value.includes("Gratis")?"Gratis":"Dipilih nanti";
    byId("checkoutTotal").textContent=money(cartTotal()+shipping);
  }
});

byId("checkoutForm").addEventListener("submit",async e=>{
  e.preventDefault();
  if(!proofData) return toast("Unggah bukti transfer terlebih dahulu.");
  const submitButton=e.currentTarget.querySelector('[type="submit"]');
  submitButton.disabled=true;submitButton.textContent="Mencatat pesanan...";
  const order=await createOrder(e.currentTarget);
  submitButton.disabled=false;submitButton.textContent="Buat Pesanan";
  closeModals();byId("successOrderId").textContent=order.id;
  byId("successTitle").textContent=order.syncState === "Tersinkron" ? "Pesananmu sudah tercatat." : "Pesananmu sedang diamankan.";
  document.querySelector("#successModal > p:not(.eyebrow)").textContent=order.syncState === "Tersinkron"
    ? "Tim Yashbi akan memverifikasi pembayaran pada jam operasional berikutnya."
    : "Sistem toko sedang gangguan. Pesanan disimpan di perangkat ini dan akan dikirim saat koneksi backend kembali. Untuk proses tercepat, hubungi staff melalui WhatsApp.";
  const manualButton=byId("manualOrderButton");
  const waNumber=String(window.YASHBI_CONFIG?.whatsappNumber || "").replace(/\D/g,"");
  manualButton.hidden=order.syncState === "Tersinkron" || !waNumber;
  manualButton.href=`https://wa.me/${waNumber}?text=${encodeURIComponent(`Halo Yashbi, saya ${order.customer.name}. Pesanan ${order.id} sedang menunggu sinkronisasi. Mohon bantu proses manual.`)}`;
  openModal("successModal");
  if(order.syncState !== "Tersinkron") toast("Pesanan masuk antrean sinkron. Simpan nomor pesanan ini.");
});

byId("trackForm").addEventListener("submit",async e=>{
  e.preventDefault(); const data=Object.fromEntries(new FormData(e.currentTarget).entries());
  const result=byId("trackResult"); result.hidden=false;
  if(API_URL) {
    try {
      const url=new URL(API_URL);url.searchParams.set("action","track");url.searchParams.set("orderId",data.orderId);url.searchParams.set("phone",data.phone);
      const response=await fetch(url);const remote=await response.json();
      if(remote.ok) {
        const order=remote.order;
        result.innerHTML=`<strong>${order.id}</strong><div class="status-pill">${order.status}</div><span>Dibuat ${new Date(order.createdAt).toLocaleString("id-ID")}</span>${order.trackingNumber?`<span>${order.expedition} · Resi ${order.trackingNumber}</span>`:""}`;
        return;
      }
    } catch(error) { console.warn("Pelacakan online gagal, mencoba data lokal:",error); }
  }
  const orders=JSON.parse(localStorage.getItem(STORE_KEYS.orders)||"[]");
  const normalize=v=>String(v).replace(/\D/g,"").replace(/^62/,"0");
  const order=orders.find(o=>o.id.toLowerCase()===data.orderId.trim().toLowerCase()&&normalize(o.customer.phone)===normalize(data.phone));
  result.innerHTML=order?`<strong>${order.id}</strong><div class="status-pill">${order.status}</div><span>Dibuat ${new Date(order.createdAt).toLocaleString("id-ID")}</span>`:`<strong>Pesanan tidak ditemukan</strong><span>Periksa nomor order dan WhatsApp yang digunakan.</span>`;
});

document.addEventListener("keydown",e=>{if(e.key==="Escape"){byId("imageLightbox").classList.remove("open");closeModals();}});

byId("identityForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const name=String(new FormData(e.currentTarget).get("visitorName") || "").trim();
  if(!name) return;
  visitor={sessionId:newId("VIS"),name,createdAt:new Date().toISOString()};
  localStorage.setItem(STORE_KEYS.visitor,JSON.stringify(visitor));
  closeModals();
  await syncVisitor();
  if (pendingCheckout) {
    openCheckoutFlow();
    return;
  }
  toast(`Halo ${name}, koleksi Yashbi siap kamu lihat.`);
});

window.addEventListener("online",()=>{ syncQueue(); syncVisitor(); toast("Koneksi kembali. Antrean pesanan sedang disinkronkan."); });
window.addEventListener("focus",()=>{ syncQueue(); syncVisitor(); });

renderProducts();
renderCart();
hydrateCatalogImages();
syncQueue();
if(visitor) syncVisitor(); else setTimeout(()=>openModal("identityModal"),500);
const linkedProduct = new URLSearchParams(location.search).get("product");
if (linkedProduct && PRODUCTS.some(product => product.id === linkedProduct.toUpperCase())) {
  setTimeout(() => openProduct(linkedProduct.toUpperCase()), 250);
}
