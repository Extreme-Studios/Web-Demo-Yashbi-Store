# Perbaikan Benturan Teks — Yashbi Store

13 November 2026. Preview: http://localhost:4173. Source final dibangun dan diuji; tidak ada push atau deployment produksi.

## Penyebab dan perbaikan

Framing desktop sebelumnya memakai jarak kamera dan offset tetap. Pada ruang konten pendek, objek sepatu baris atas memasuki judul/filter, sedangkan pedestal baris bawah memasuki nama dan harga produk. Mode inspeksi beberapa pakaian juga mendekati header. Pemeriksaan lama belum membandingkan proyeksi objek desktop dengan area teks.

Kamera desktop sekarang mengukur batas DOM header, judul, panel produk, pager dan footer. Ukuran aktual bidang foto dan pedestal dihitung untuk menentukan jarak kamera serta pusat proyeksi. Perhitungan diulang setelah perubahan produk, mode, warna, font dan ukuran jendela. Bidang produk aktif dan seluruh pedestal galeri berada di area yang bebas dari teks.

Tajuk sepatu dan subfilter ditempatkan dalam satu area horizontal. Nama, harga dan tombol inspeksi berada pada panel bawah tersendiri. Judul editorial pakaian dan HUD memakai permukaan kanvas yang solid agar model latar tidak mengganggu keterbacaan. Layar pendek memakai judul pakaian ringkas di bagian atas. Font judul, pembungkusan nama panjang, jarak harga dan tata letak header dirapikan tanpa mengubah data atau arah desain Three.js.

Notifikasi tambah keranjang pada HP sebelumnya menutupi tombol selama2,8 detik. Konfirmasi HUD sekarang memakai baris status inline yang sudah memiliki aria-live. Dialog tetap memakai status di dalam alur dokumen. Tidak ada notifikasi tambahan yang menutup tombol tambah HUD.

## Verifikasi final

- `npm run build`: lulus. Bundle JavaScript sekitar627KB dan CSS41KB sebelum compression.
- `npm test`:117 pemeriksaan lulus (16 commerce,101 browser/scene). Termasuk konfirmasi tambah tetap terbaca dan tidak menutupi tombol pada HP, alur keranjang, checkout, upload bukti, PDF, tracking dan chat simulasi.
- `npm run test:layout`:56/56 keadaan tampilan lulus pada source final,0 benturan,0 runtime errors.
- Delapan viewport:1440×1000,1366×768,1228×610,1024×768,1920×1080,390×844,360×800 dan844×390. Screenshot tambahan1228×610 memakai DPR1,5 untuk mencocokkan skala ruang konten pada gambar pengguna.
- Suite tata letak memakai proyeksi matriks dunia/kamera Three.js yang sebenarnya: empat sudut bidang foto dan delapan sudut geometri pedestal dibandingkan dengan area teks/kontrol yang terlihat. Pemeriksaan juga memakai DOM Range untuk mendeteksi benturan fragmen tulisan dan kotak kontrol. Mencakup tiga koleksi, overview, inspeksi nama panjang dan halaman terakhir sepatu.
- Bukti sebelum perbaikan:14 kasus desktop diperiksa;7 gagal dengan31 benturan. Suite yang sama lulus setelah perbaikan sehingga tidak sekadar menguji nilai konfigurasi.
- Audit tambahan48 keadaan HUD dengan nama panjang:0 benturan teks,0 tumpang tindih komponen header dan0 overflow horizontal. Dialog checkout, detail produk, tracking, bantuan dan chat diperiksa pada390×844 serta1228×610.
- Browser utama:0 console/page/resource errors,0 gambar rusak dan0 request eksternal/produksi pada skenario uji. `21st review` UI:0 errors dan0 warnings. Syntax dan `git diff --check` lulus; Git hanya memberi pemberitahuan konversi LF/CRLF.

## Bukti

Folder outputs chat menyimpan:

- `text-clear-shoes-1228.png`: galeri sepatu pada dimensi yang mendekati screenshot pengguna, dengan judul/filter, dua baris sepatu dan ringkasan produk terpisah.
- `text-clear-shoes-1440.png`, `text-clear-gown-1440.png`, `text-clear-gown-1024.png`: pemeriksaan visual desktop.
- `3d-clothing-mobile-focus.png`: status tambah berada di dalam panel, tanpa toast di atas tombol.
- `text-layout-before-results.json`, `text-layout-final-results.json`, `hud-text-css-audit.json`, `3d-showroom-test-results.json`: hasil uji terperinci.

Pemeriksaan memakai Chrome desktop dan emulasi HP; Opera/perangkat HP fisik belum diuji langsung. Order, PDF dan Sahabat Yashbi memakai simulasi localhost. Data30 produk,31 foto pakaian bermodel lengkap,29 cutout sepatu, fallback dan kontrak backend tetap dipertahankan.
