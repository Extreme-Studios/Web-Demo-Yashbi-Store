# Perbaikan aset transparan dan display — 13 November 2026

Preview: http://localhost:4173 atau http://127.0.0.1:4173. Implementasi tetap lokal; tidak ada push, deployment, atau perubahan data toko.

## Seluruh sumber dan hasil

| Pemeriksaan | Hasil |
| --- | --- |
| SKU dasar | GW001–008, JP001–008, SW001–008, SP001–008: 32 foto |
| Varian warna | 28 foto lokal |
| PNG transparan | **60 file**, PNG8bit RGBA dengan alpha0 di latar dan alpha255 di subjek |
| Katalog aktif | Tetap30 produk dan58 referensi primer/varian; SW008/SP008 tetap aset tanpa produk aktif |
| Audit Google Drive | GET katalog dan katalog gambar masing-masing32 SKU; seluruh32 sudah memiliki sumber lokal, sehingga tidak ada sumber remote yang perlu diunduh |
| Sumber asli | `assets/images/products/` dipertahankan. Seluruh60 salinan di `assets/images/raw/` identik secara SHA-256 |
| Hasil | `assets/images/cutout/{stem}.png`; manifest mencatat sumber, hash, crop, model, alpha, anchor bahu dan sol |

URL Drive asli disimpan pada `assets/product-image-sources.js`, dan audit read-only pada `assets/images/raw/drive-catalog.json`. Sampel sumber GW001 terverifikasi mengembalikan HTTP200 image/jpeg. Tidak ada perubahan pada Sheets, deployment Apps Script, API produksi, ID produk, harga, warna, ukuran atau payload transaksi.

## Pemrosesan dan perbaikan kualitas

`tools/build_cutouts.py` melakukan segmentasi semantik CPU, alpha matting, pembersihan sisa mask dan crop tepat pada bounding box alpha nonzero. Sepatu juga membersihkan baris kabut mask di bawah sol solid, sehingga sol/hak mencapai baris paling bawah PNG. Warna putih, nude dan beige pada produk tidak dihapus melalui ambang warna.

Model ISNet dipakai untuk celah tali dan detail; U2Net dipilih untuk lima SKU sepatu yang memiliki insole pucat atau kulit putih agar material tidak ikut menjadi transparan. Pakaian memakai model segmentasi kain yang dipadukan dengan mask subjek. Model resmi diambil dari [repositori rembg](https://github.com/danielgatis/rembg), cache berada di `../work/cutout-models/`, dan checksum model diverifikasi. Dependensi CPU berada terpisah di `../work/cutout-python/`; versi tersimpan di manifest dan requirements.

Pemeriksaan foto asli menemukan lipatan tulle ivory dan insole sneaker yang salah dikenali sebagai lubang. Mask pada wilayah sumber yang telah diperiksa diperbaiki agar piksel material asli kembali terlihat. Sisa bayangan lantai di bawah sepatu pearl juga dibersihkan dengan mask yang mengikuti batas sol pada sumber. Tidak ada piksel kain/sepatu tersembunyi yang direkonstruksi.

**21 foto pakaian menjadi pakaian saja. Sepuluh foto dari lima SKU tetap menampilkan model:** GW002, GW005, GW007, JP001 dan JP007, masing-masing dua warna. Pada foto tersebut tangan menutupi kain. Menghapus tubuh sepenuhnya akan membuat lubang palsu atau membutuhkan rekonstruksi kain; seluruh latar studio tetap transparan.

## Integrasi frontend

- Semua referensi yang dirender memakai PNG lokal di `cutout/`. Varian pada keranjang dan checkout juga menggunakan warna yang dipilih.
- Fallback primer: URL Drive asli, lalu sumber lokal asli. Fallback varian: URL Drive spesifik warna bila tersedia, sumber lokal varian yang benar, lalu sumber primer. Katalog API saat ini tidak menyediakan URL Drive varian terpisah; cadangan lokal menjaga warna agar tidak langsung tertukar dengan foto primer.
- Error handler berlaku pada gambar dinamis dan mencegah loop fallback. Foto hero toko tidak dipakai sebagai pengganti produk.
- Rak sepatu: tidak ada edge-mask, multiply blending atau crop transform. PNG menggunakan contain dan posisi bottom; drop-shadow mengikuti alpha. Pedestal tipis bertemu dasar sol.
- Fokus sepatu: seluruh siluet masuk stage, pedestal mengikuti lebar gambar, peek tetangga dipertahankan. Seluruh HUD dan tombol terlihat dalam satu viewport1440×1000.
- Rak pakaian: bingkai dan shadow kotak dihapus. Hanger dihitung dari ukuran gambar contain dan anchor bahu/kerah; hook mengikuti rel. Hangtag mengikuti bahu kanan.

## Pengujian

`npm test` menjalankan regresi commerce dan verifikasi cutout. **51 pemeriksaan regresi lulus**, termasuk keranjang, subtotal, pilihan warna/ukuran, upload bukti, checkout lokal, unduhan PDF, riwayat, tracking, chat lokal, mobile swipe, reduced motion dan admin login.

Tambahan verifikasi cutout:

- Seluruh60 file diperiksa sebagai PNG8bit RGBA, bukan file RGB yang sekadar diberi ekstensi PNG.
- Seluruh60 memiliki latar alpha0, subjek alpha255 dan bounding alpha tepat pada keempat tepi termasuk dasar gambar.
- Hash sumber, salinan raw dan output sesuai manifest.
- Semua14 sepatu aktif diuji pada viewport1440×1000: siluet tidak terpotong, sole-to-pedestal kurang dari1,5 CSSpixel, contain, tanpa mask/multiply, seluruh HUD terlihat dan tanpa scroll overlay desktop.
- Desktop5kolom/2baris dan mobile2kolom diuji; seluruh14 sepatu tetap dapat diakses melalui10+4 paginasi.
- Rak pakaian dan fokus diuji pada1440×1000 dan390×844: sumber RGBA, tanpa bingkai, kerah/hanger, swatch, ukuran, quick-add, jas dan Escape.
- **0 console errors, 0 page errors, 0 resource error/404 dan 0 gambar rusak pada penggunaan normal yang diuji.**
- Uji negatif sengaja memberi404 pada satu cutout primer dan satu varian: primer berhasil memakai URL Drive (respons gambar diisolasi dalam tes), varian berhasil memakai cadangan lokal dengan warna yang benar. Error buatan ini dipisahkan dari hasil penggunaan normal.
- `node --check`, `git diff --check` dan review HTML/JS21st lulus; review tersebut memberi0 temuan. Pencarian komponen21st masih HTTP401, sehingga komponen existing diperbaiki langsung.

Bukti mesin berada di folder `outputs` di sebelah checkout: `qa-results.json`, `cutout-test-results.json`, `cutout-alpha-results.json`, dan `cutout-geometry-results.json`. Screenshot: `cutout-shoe-overview.png`, `cutout-shoe-focus.png`, `cutout-shoe-mobile.png`, `cutout-clothing-rack.png`, `cutout-clothing-focus.png` dan versi mobile pakaian.

## Menjalankan ulang

```powershell
node tools/sync-image-sources.cjs
python -m pip install -r tools/requirements-cutout.txt
python tools/build_cutouts.py
npm run preview
```

Pada terminal lain jalankan `npm test`. Sumber Drive yang belum ada di lokal diunduh oleh skrip sinkronisasi ke raw; pipeline menerima sumber dari products maupun raw. Model dicache di workspace. Foto sumber tetap memiliki sudut asli, termasuk pasangan sepatu tiga perempat. BACK tetap tidak aktif karena foto belakang belum tersedia. Integrasi pembayaran, email, pengiriman, Gemini dan generator PDF backend live tidak diuji; localhost memakai simulasi terisolasi.
