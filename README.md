# Yashbi Store Demo

Demo storefront fashion profesional untuk Extreme Studios AI.

## Fitur tahap website

- 30 produk dummy: gaun wanita, sepatu wanita, jas pria, dan sepatu pria.
- Filter kategori, pencarian, dan pengurutan.
- Detail produk bergambar dengan zoom, warna, ukuran, dan stok online.
- Keranjang belanja lokal.
- Checkout alamat, kurir, transfer bank, dan upload bukti transfer.
- Nomor order dan pelacakan tanpa login.
- Data demo disimpan di `localStorage` sampai backend Google Sheets diaktifkan.

## Jalankan lokal

```powershell
python -m http.server 4173
```

Buka `http://localhost:4173`.

## Deployment

Target Vercel: `yashbi-store.extremestudiosai.com`.

## Backend Google

Kode Apps Script tersedia di `backend/Code.gs`. Jalankan fungsi
`setupYashbiStore` satu kali, deploy sebagai Web App dengan akses `Anyone`,
lalu isi URL deployment pada `assets/config.js`.

Backend membuat tab `Produk`, `Pesanan`, `Detail Pesanan`, dan `Pengaturan`;
serta folder `Katalog Produk`, `Bukti Transfer`, dan `Invoice` di Drive.
Jika endpoint belum diisi atau sedang gagal, checkout demo tetap tersimpan di
browser agar alur presentasi tidak terputus.
