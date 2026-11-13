# Yashbi Store — Alabaster Showroom

Frontend showroom WebGL menggunakan Three.js0.187.0 dan HUD baru. Struktur storefront lama sudah diganti. Data30 produk,60 cutout transparan, fallback gambar, storage dan kontrak transaksi tetap dipertahankan.

## Menjalankan lokal

```powershell
npm install
npm run build
npm run preview
```

Buka http://localhost:4173. Jalankan `npm test` pada terminal lain saat preview aktif. Node20+ dan Chrome diperlukan. Build memakai esbuild dan menyimpan hasil pada `dist/`; server preview membaca hasil build tersebut. Setelah mengubah source, jalankan build lagi.

Di localhost, order, PDF dan Sahabat Yashbi menggunakan layanan simulasi lokal. Jangan melakukan pembayaran. Order simulasi berada di memori server sampai proses dimulai ulang; riwayat browser tetap tersimpan di perangkat. Konfigurasi produksi dan backend Google tidak diubah atau diuji live.

## Arsitektur

| Source | Tanggung jawab |
| --- | --- |
| `src/catalog.js` | Katalog30 produk, harga IDR, gambar warna, fallback Drive/lokal |
| `src/commerce.js` | Keranjang, storage, checkout/upload bukti, queue offline, invoice URL dan tracking |
| `src/showroom.js` | Renderer WebGL, lighting, lantai/shadow, runway, pedestal, raycaster, hover, damping dan kamera inspeksi |
| `src/ui.js` | HUD, filter, lookbook, drawer keranjang, checkout, riwayat, tracking, bantuan dan Sahabat Yashbi |
| `src/showroom.css` | Seluruh tampilan storefront baru; tidak memuat CSS storefront lama |
| `src/main.js` | Koordinasi scene, HUD dan commerce |
| `tools/build.mjs` | Bundle Three.js/source/CSS dan salin aset ke dist |
| `tools/preview.cjs` | Host localhost dan endpoint simulasi yang terisolasi |

Showroom utama dipisahkan menjadi tiga koleksi: **Gaun Wanita (8)**, **Pakaian Pria (8)** dan **Sepatu (14)**. Halaman pertama membuka gaun saja; perpindahan koleksi langsung menghilangkan objek kategori sebelumnya. Sepatu memiliki subfilter Semua sepatu / Wanita / Pria. Kategori pakaian tampil dalam runway melengkung tanpa rel/hanger. Drag, swipe, wheel atau panah menggeser pilihan; klik objek aktif membuka inspeksi kamera. Sepatu memakai pedestal BoxGeometry dengan garis emissive. Hover mengangkat sepatu; klik langsung membawa kamera ke depan produk. Galeri gabungan14 sepatu tersedia lewat “Semua sepatu”:10 slot desktop (2×5) lalu4. Mobile memakai4 slot (2×2) agar produk terbaca.

HUD menyediakan warna/ukuran, +Keranjang, VIEW DETAILS, Katalog30 produk dengan search/sort, Riwayat/Cek Pesanan dan asisten. Dialog native dan katalog HTML tetap dapat dipakai bila WebGL tidak tersedia. Font Cormorant Garamond dan Plus Jakarta Sans tersimpan lokal.

## Aset produk

Seluruh32 foto SKU dasar dan28 varian memiliki PNG RGBA di `assets/images/cutout/`. Sumber asli tetap di `assets/images/products/` dan salinan byte-identik di `assets/images/raw/`. Storefront mereferensikan58 aset aktif; SW008/SP008 tetap aset tanpa produk aktif.

```powershell
node tools/sync-image-sources.cjs
python -m pip install -r tools/requirements-cutout.txt
python tools/build_cutouts.py
```

Skrip sinkronisasi hanya membaca katalog dan mengunduh sumber yang belum ada. Pipeline CPU memakai ISNet/U2Net dan alpha matting; default pakaian adalah `--garments subject` untuk mempertahankan orang lengkap. Model/dependensi sesi ini berada di workspace `../work/`. Manifest mencatat hash, crop dan alpha. Seluruh31 foto pakaian, termasuk varian warna, menampilkan model lengkap dari foto asli dengan latar transparan. Seluruh29 cutout sepatu tidak berubah. Tidak ada rekonstruksi atau pembuatan orang baru.

## Verifikasi dan deployment

Laporan perubahan aktif: `docs/redesign/10-TEXT-COLLISION-FIX.md`. Laporan09 mencatat pemulihan model dan pemisahan koleksi. Laporan08 mencatat arsitektur WebGL awal. Dokumen01–07 mencatat tahap sebelumnya; spesifikasi hanger dan layout lama tidak lagi mengatur frontend aktif.

`npm test` menjalankan kontrak commerce dan browser WebGL desktop1440×1000 serta HP390×844,360×800,412×915 dan landscape844×390. Batas empat sudut model diuji terhadap ruang kosong HUD. Pada HP, raster DPR dibatasi1.5, shadow1024, decode tekstur hanya koleksi aktif dan frame idle dibatasi30fps. Kamera tetap bergerak pada refresh rate layar saat transisi; performa perangkat fisik belum diuji. Pesanan, upload dan PDF benar-benar diuji pada server simulasi. API Google/Drive/Gemini/email/pengiriman live belum diuji.

Tidak ada Git push atau deployment produksi pada pengerjaan ini. Jangan menjalankan `git push` atau `vercel --prod` sebelum user meninjau Local Preview. Backend Apps Script dan halaman admin tetap memakai kontrak existing.

Mode inspeksi pakaian memiliki `DETAIL BAJU`/`TAMPILAN UTUH`; detail memakai ROI kamera dan empat clipping plane GPU, sedangkan sepatu tetap tidak berubah.

Pemeriksaan benturan teks dan geometri: `npm run test:layout` saat preview aktif. Suite ini memproyeksikan bidang foto/pedestal ke layar dan membandingkannya dengan area judul, filter, panel produk dan navigasi pada delapan viewport. HUD memakai status inline agar konfirmasi tambah tidak menutupi tombol.
