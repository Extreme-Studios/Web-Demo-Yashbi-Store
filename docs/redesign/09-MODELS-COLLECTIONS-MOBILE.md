# Yashbi Store — Model Lengkap, Koleksi Terpisah, dan Optimasi HP

Tanggal: 13 November 2026. Local Preview aktif: http://localhost:4173. Tidak ada Git push atau deployment produksi.

## Perubahan sesuai arahan terakhir

Desain Three.js/WebGL yang sudah disetujui dipertahankan. Perubahan difokuskan pada foto model, pemisahan koleksi dan pemakaian di HP.

- Seluruh31 foto pakaian (16 gaun dan15 jas, termasuk varian) diproses ulang dari foto sumber asli untuk mempertahankan orang lengkap. Kepala, tangan, tubuh dan sepatu/kaki yang memang ada pada foto sumber tidak dihapus. Latar tetap PNG transparan RGBA dan crop mengikuti batas alpha. Tidak ada wajah, kain tersembunyi atau geometri yang dibuat ulang.
- Seluruh29 PNG sepatu identik byte demi byte dengan versi sebelumnya. Manifest dan metadata60 aset diperbarui. Foto sumber asli tidak ditimpa. Backup pakaian lama tersedia di `../work/pre-fullperson/20261113-145847/`.
- Tiga navigasi koleksi utama: **Gaun Wanita8**, **Pakaian Pria8**, **Sepatu14**. Halaman pertama membuka gaun saja. Objek kategori sebelumnya langsung disembunyikan saat berpindah koleksi; tidak ada etalase campuran30 produk.
- Label Pakaian Pria hanya ada pada tampilan. Nilai kategori data/API tetap `Jas Pria`. ID, harga, warna, ukuran, stok, deskripsi dan seluruh30 produk existing tetap sama.
- Sepatu menyediakan subfilter Semua sepatu14, Wanita7 dan Pria7. Desktop menampilkan10 pedestal2×5 lalu4; HP menampilkan4 pedestal2×2 perhalaman. Katalog HTML tetap menyediakan pencarian seluruh30 produk, dengan filter awal mengikuti koleksi aktif.

## HP dan kinerja

Panel overview di HP dipadatkan menjadi nama, harga, INSPEKSI PRODUK dan VIEW DETAILS. Warna, ukuran serta tambah keranjang tersedia pada inspeksi. Tombol utama dan kontrol transaksi memiliki target sentuh minimal44px. Landscape pendek memakai HUD kanan yang dapat digulir di dalam panel.

Kamera mengukur ruang kosong aktual antara header/judul, panel produk dan navigasi bawah. Jarak dan pusat proyeksi disesuaikan terhadap seluruh siluet foto, termasuk sesudah pergantian warna, ukuran viewport dan mode inspeksi. Kepala hingga kaki model serta seluruh siluet sepatu tetap berada di ruang panggung. Untuk mempertahankan seluruh model di layar pendek, ukuran model pada inspeksi HP dapat lebih kecil daripada overview ketika panel pilihan terbuka.

Optimasi khusus HP: DPR render maksimal1.5, shadow map1024 dibanding2048 desktop, anisotropy maksimal4, dua jalur decode preload pada koleksi aktif, koleksi lain dimuat saat dibuka, serta render idle maksimal sekitar30fps. Transisi kamera/objek tetap memakai refresh rate layar dan damping berdasarkan waktu. Emulasi membuktikan konfigurasi dan tata letak; angka FPS/GPU pada ponsel fisik belum diukur.

## Verifikasi

`npm run build` lulus. Bundle JavaScript sekitar625KB dan CSS35KB, sebelum transfer compression. Three.js dan font tetap lokal.

`npm test` lulus **115 pemeriksaan**:16 kontrak commerce dan99 browser WebGL. Viewport: desktop1440×1000, HP390×844,360×800,412×915 dan landscape844×390. Emulasi HP juga memakai DPR3 untuk memverifikasi batas render1.5.

Pemeriksaan mencakup pemisahan kategori tanpa transisi campuran, lazy decode koleksi, model lengkap, seluruh empat sudut bidang foto di dalam ruang panggung pada overview/inspeksi, target sentuh44px, akses tambah keranjang dan tidak adanya horizontal overflow. Alur wheel/drag/keyboard/native touch swipe, raycaster, kamera, warna, ukuran, keranjang, checkout, upload bukti, purchase record, unduh PDF, tracking WA dan Sahabat Yashbi lulus.

Hasil skenario browser: **0 console errors,0 page errors,0 resource errors/404,0 gambar HTML rusak,0 request eksternal/produksi**. Seluruh60 hash output cocok dengan manifest. Seluruh31 foto pakaian memiliki penanda `photographed-subject`;29 hash sepatu cocok dengan ledger sebelum perubahan. Contact sheet seluruh31 pakaian diperiksa visual. QA tambahan menguji24 kasus fokus (enam SKU awal/akhir pada empat viewport HP); seluruh sudut bidang foto berada dalam ruang panggung. Judul dekoratif galeri sepatu disembunyikan pada landscape pendek untuk memperluas area produk, sementara subfilter tetap tersedia.

Bukti berada di folder outputs chat: `3d-showroom-test-results.json`, screenshot `3d-showroom-mobile.png`, `3d-suits-desktop.png`, `3d-shoe-gallery.png`, `3d-clothing-mobile-focus.png`, `3d-shoes-mobile.png`, contact sheet `model-gowns-fullperson.jpg` dan `model-suits-fullperson.jpg`, serta screenshot koleksi tambahan.

Order, pembayaran, PDF dan chat di localhost memakai simulasi terisolasi. Backend Google/Drive/Sheets/Gemini dan layanan transaksi produksi tidak ditulis atau diuji live. Belum diuji pada ponsel fisik. Produk pada ruang3D tetap textured planes dari foto asli; tidak ada klaim model pakaian volumetrik360 derajat.

## Menjalankan ulang

```powershell
npm run build
npm run preview
```

Jalankan `npm test` pada terminal lain. Buka http://localhost:4173 dan muat ulang tab bila masih menampilkan versi sebelumnya.
