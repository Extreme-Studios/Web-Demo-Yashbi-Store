# Yashbi Store — Three.js showroom

Status: frontend selesai dibangun ulang dan Local Preview terverifikasi. URL: http://localhost:4173 atau http://127.0.0.1:4173. Tidak ada push atau deployment produksi.

## Hasil implementasi

Struktur storefront lama diganti seluruhnya. Halaman aktif hanya memuat canvas WebGL, HUD dan host dialog baru. File controller/rak/CSS storefront lama tidak lagi dipakai; source aktif berada pada `src/`. Halaman admin dan backend existing dipertahankan terpisah.

| Bagian | Implementasi aktif |
| --- | --- |
| Renderer | Three.js0.187.0 dibundel npm/esbuild, WebGLRenderer antialias/alpha, sRGB, ACESFilmicToneMapping, pixel ratio dibatasi untuk mobile |
| Ruang | Canvas/background Warm Alabaster #F5F3EF, FogExp2 density0.035, PerspectiveCamera, lantai studio MeshStandard receiveShadow, stone runway inlay |
| Pencahayaan | AmbientLight, directional key/fill, gallery SpotLight, spotlight pilihan, shadow map2048 dan alpha customDepthMaterial |
| Pakaian | Mesh plane transparan berdiri tanpa rel/tiang/hanger, susunan runway melengkung dan perspektif, bayangan lantai serta contact ellipse |
| Gerak | Frame-rate independent exponential damping pada objek dan kamera; drag, native touch swipe, wheel, keyboard dan tombol HUD |
| Inspeksi | Kamera dolly/flight, produk aktif maju, tetangga mundur dan meredup; HUD harga IDR, warna aktual, ukuran dan +Keranjang |
| Sepatu | BoxGeometry pedestal metal/stone gelap, brushed normalmap prosedural, garis emissive; raycaster alpha-aware untuk hover dan klik |
| Galeri | Gabungan14 sepatu: desktop10 slot2×5 lalu4. Kategori sepatu individual masing-masing7. Mobile4 slot2×2 perhalaman |
| Hover/click | Sepatu terangkat dari pedestal saat hover, garis cahaya menguat. Klik sepatu mana pun langsung membuka flight inspeksi dengan tetangga tetap dalam perspektif |
| HUD | Header/filter baru, panel editorial, tombol inspeksi/VIEW DETAILS, lookbook, katalog30 dengan search/filter/sort, drawer dan seluruh dialog baru |
| Mobile | Header kategori scroll horizontal, judul singkat, HUD bawah, ruang objek di atas panel, bantuan/tracking melalui menu tiga titik |
| Font/aset | Three.js, font Cormorant Garamond/Plus Jakarta Sans dan gambar tersedia lokal; frontend normal tidak meminta CDN eksternal |

Produk adalah textured planes/billboards dari cutout foto, sesuai permintaan. Ruang, lantai, kamera, lighting, pedestal dan bayangan adalah objek/render3D nyata. Produk bukan model volumetrik360°; tidak ada tampak belakang atau sudut baru yang dikarang dari foto.

## Data dan transaksi yang dipertahankan

- Seluruh30 produk dibandingkan dengan source awal commit `519d00e4b2c6e89490acdbccb726502d4534a526`: ID, nama, kategori, harga, original price, warna/hex, ukuran, stok, deskripsi dan atribut komersial identik.
- Seluruh60 file cutout tetap cocok dengan SHA-256 manifest. Frontend memakai58 referensi aktif. Fallback Drive/lokal dipertahankan di modul katalog dan loader tekstur.
- Storage keys tetap `yashbi_cart_v1`, `yashbi_orders_v1`, `yashbi_visitor_v1`, `yashbi_sync_queue_v1` sehingga keranjang/pesanan existing dapat dimuat.
- Keranjang varian/ukuran, kuantitas, subtotal IDR, ongkir, QRIS/BCA, upload gambar maksimal5MB dan kompresi tetap berfungsi dari UI baru.
- Checkout mempertahankan payload backend, clientOrderId/deduplikasi, status, proof, sumber Website/WhatsApp/Chatbot, antrean offline dan sinkronisasi ulang.
- Riwayat/purchase record, tautan unduh/lihat invoice PDF, tracking Nomor Order+WA serta normalisasi08/+62 tetap tersedia.
- Sahabat Yashbi tetap memakai kontrak POST `/api/chat`, katalog dan kuota percakapan browser; pada localhost respons simulasi ditandai.

Source terpisah: `catalog.js` untuk data/fallback, `commerce.js` untuk state/API, `showroom.js` untuk engine, `ui.js`+`showroom.css` untuk antarmuka, `main.js` untuk koordinasi. Build menghasilkan `dist/`, dan preview server melayani hasil build. Konfigurasi deployment diarahkan ke output build tanpa melakukan deployment.

## Verifikasi

`npm run build` lulus tanpa warning/error. Bundle Three.js/application sekitar622KB sebelum transfer compression, CSS sekitar26KB. Seluruhfont dilayani lokal; lisensi font/Three disimpan bersama aset.

`npm test` lulus **70 pemeriksaan**:

- **16 uji kontrak commerce:** nilai produk asli,58 jalur varian, restore storage, harga/ongkir, PDF valid, WA benar/salah, antrean offline dan retry, idempotensi, kegagalan penyimpanan serta pencegahan checkout ganda.
- **54 uji browser** pada Chrome WebGL desktop1440×1000 dan mobile emulation390×844.
- WebGL benar-benar dirender: konteks antialias, PerspectiveCamera, ACES, FogExp2, scene lights, material alpha shadow dan framebuffer berisi geometri diuji langsung. Renderer awal mencatat puluhan draw calls dan ratusan triangle, bukan gambar screenshot statis atau transformCSS.
- Klik objek memakai posisi proyeksi mesh dan pointer browser nyata; raycaster mengaktifkan kamera inspeksi. Klik sepatu nonaktif juga langsung flight.
- Runway: wheel, mouse drag, satu tombol panah maju tepat satu produk, nativeCDP touch swipe, dan tap HUD pertama sesudah swipe.
- Varian tetap konsisten antara tekstur3D, HUD, keranjang dan checkout, termasuk ketika kembali ke produk atau saat resize/inspect berlangsung.
- Sepatu: formasi5kolom2baris,14 produk/paginasi10+4, hover lift nyata, kamera fokus dan seluruh HUD desktop berada di viewport.
- Alur keranjang→checkout→unggah bukti→purchase record→unduh PDF dijalankan di desktop dan mobile. PDF benar-benar diunduh, header `%PDF-`, nomor order, nama pembeli, produk dan total diverifikasi.
- Tracking menolakWA salah dan menerima+62 yang cocok. Riwayat dan Sahabat Yashbi dari HUD baru lulus.
- Katalog HTML baru tetap menyediakan seluruh30 produk dan lookbook; dukungan ini juga tersedia bila renderingWebGL tidak didukung.
- **0 console errors, 0 page errors, 0 resource errors/404, 0 gambar HTML rusak dan 0 request eksternal/produksi pada skenario browser normal.**
- SHA-256 seluruh60 cutout tetap identik. `node --check` dan `git diff --check` lulus. Review21st HTML/JS tidak memiliki error; saranCSS hanya menyangkut token warna efek. Search21st HTTP401 sehingga implementasi dilakukan langsung.

Masalah yang ditemukan dan diperbaiki selama QA: input keyboard terprosesdua kali, preload yang dapat menimpa warna pilihan, background3D bertabrakan dengan HUD, tap mobile terabaikan setelah swipe, error upload tersembunyi di belakang native dialog, dan pemulihan fokus tombol kuantitas. Screenshot final diambil setelah posisi objek/kamera selesai meredam.

## Bukti dan batas pengujian

Folder `outputs` pada direktori chat menyimpan `3d-showroom-test-results.json`, screenshot showroom/galeri/fokus desktop dan mobile, serta PDF pesanan simulasi. Source30 produk dan seluruh60 gambar asli/cutout tidak diganti atau dihasilkan ulang dalam rebuildWebGL.

Local Preview memakai endpoint simulasi terisolasi untuk order, PDF dan chat. Tidak ada penulisanGoogle Sheets/Drive, pengiriman email atau pengiriman barang. Integrasi pembayaran/AI/backend live tidak diuji dan tidak dinyatakan lulus. Mobile memakai emulasi Chrome dengan input sentuh native, belum perangkat ponsel fisik. PerformaGPU spesifik perangkat dan semua-browser belum diaudit.

Foto dengan tangan menutupi kain tetap mempertahankan model pada10 foto dari5 SKU. Background foto sudah transparan; kain tersembunyi tidak direkonstruksi. URL invoice simulasi berlaku selama proses server yang membuatnya masih aktif; restart menghapus order simulasi server.

## Menjalankan ulang

```powershell
npm install
npm run build
npm run preview
```

Jalankan `npm test` pada terminal lain. Buka http://localhost:4173. Tidak ada `git push`, `vercel --prod` atau deploy Apps Script selama pengerjaan ini.
