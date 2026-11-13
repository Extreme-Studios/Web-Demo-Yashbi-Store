# Execution and Local Preview

1. Audit seluruh source, kontrak API, admin, backend, CSS, gambar dan tes sebelum implementasi. Petakan seluruh 30 produk existing beserta aset gambarnya; bila jumlah data aktual berbeda, laporkan dengan bukti dan pertahankan semua produk.
2. Implementasikan Warm Atelier, rak pakaian, hangtag warna dan rak sepatu zoom. Pertahankan keranjang, secure checkout/upload bukti, purchase record/PDF, cek pesanan dan Sahabat Yashbi. Sapaan nama panggilan harus non-blocking.
3. Perbaiki duplikasi gambar About Yashbi: jangan memakai `yashbi-hero.png` dua kali. Buat modal informatif terpisah untuk Panduan Ukuran, Pengiriman, Kebijakan Penukaran dan Tentang Kami. Jangan membuat janji operasional tanpa dasar data existing.
4. Jalankan preview localhost. Verifikasi console, gambar/404, rak pakaian, hangtag, sepatu zoom, keranjang hingga PDF invoice dan mobile `390×844`. Uji browser nyata dengan mock terisolasi untuk jalur yang menulis ke backend; bedakan hasil mock dan live. Perbaiki bug, simpan laporan audit, lalu berikan URL Local Preview.
5. Tidak ada `git push` atau `vercel --prod` sebelum user meninjau Local Preview.

## Hasil

Selesai pada 13 November 2026. Katalog 30 produk dan 58 aset dipetakan pada `05-PRODUCT-ASSET-MAP.md`. `npm test` lulus 51 pemeriksaan, console/gambar/HTTP error 0, viewport 1440×1000 dan 390×844. Preview aktif di http://localhost:4173. Rincian hasil, bukti, batas aset FRONT/BACK/foto sepatu dan lingkup simulasi ada pada `06-LOCAL-PREVIEW-REPORT.md`. Tidak ada push atau deploy produksi.
