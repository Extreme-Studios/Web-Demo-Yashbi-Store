# Laporan Local Preview — 13 November 2026

Catatan lanjutan: batas aset tentang panel foto model dan masking pada laporan awal ini telah diperbarui oleh `07-TRANSPARENT-CUTOUT-REPORT.md`. Frontend kini memakai 60 turunan PNG RGBA asli; 21 pakaian dipisahkan dari model, 10 foto mempertahankan subjek untuk menjaga kain yang tertutup tangan. Tidak ada lagi edge masking pada rak sepatu.

**Status: implementasi lokal dan pengujian selesai. Belum dipush atau dideploy.**

- Preview: http://localhost:4173 atau http://127.0.0.1:4173.
- Repo: `Extreme-Studios/Web-Demo-Yashbi-Store`.
- Source awal: commit `519d00e4b2c6e89490acdbccb726502d4534a526`.
- Checkout lokal: `C:\Users\ROG ALLY\Documents\Codex\2026-11-13\jalankan-tugas-ini-dalam-mode-full\Web-Demo-Yashbi-Store`.
- Enam file blueprint dibuat (daftar permintaan memuat AGENTS.md + lima dokumen, termasuk 02B).

## Audit dan perubahan

Seluruh source HTML, JavaScript, CSS, admin, API, Apps Script, tool, test, konfigurasi dan aset diperiksa. Katalog frontend berisi tepat 30 produk: 8 Gaun Wanita, 8 Jas Pria, 7 Sepatu Wanita, 7 Sepatu Pria. Ada 58 jalur gambar primer/varian yang direferensikan. SW-008 dan SP-008 adalah file ekstra tanpa produk aktif; keduanya tetap disimpan. Nilai seluruh objek produk dibandingkan dengan source awal dan identik. Berkas gambar, backend, API produksi, config produksi dan CSS existing tidak diubah.

| Area | Hasil |
| --- | --- |
| Warm Atelier | Seluruh token warna, Cormorant Garamond/Plus Jakarta Sans, tipografi editorial, bayangan, layer kanvas dan reduced motion diterapkan. |
| Hero pakaian | Kategori gaun/jas, rel/hanger metalik, perspektif aktif/nonaktif, klik, panah, keyboard, horizontal wheel, drag dan swipe. |
| Inspeksi | Blur 11px, foto fokus, hangtag bergoyang, swatch varian asli, ukuran dan quick-add. Ayunan berhenti saat interaksi; target swatch 36px. Tap langsung setelah swipe juga diverifikasi. |
| Rak sepatu | Dua baris × lima kolom desktop, dua kolom mobile, pedestal/under-glow, hover lift; halaman pertama 10 dan kedua 4, filter kategori masing-masing 7. |
| Fokus sepatu | Zoom 0,65 detik, peek tetangga, HUD, warna, ukuran asli, tambah keranjang, navigasi tetangga, Escape dan pemulihan focus. |
| Fitur existing | Keranjang/subtotal IDR, checkout/upload bukti, purchase record/invoice, tracking Nomor Order + WA, Sahabat Yashbi, search/filter/sort dipertahankan. |
| Sapaan | Sapaan nama awal non-blocking: tidak ada backdrop, scroll lock atau pemindahan focus. Bisa ditutup; nama dapat diisi saat checkout. |
| Bantuan | Modal terpisah untuk Panduan Ukuran, Pengiriman, Kebijakan Penukaran, Tentang Kami; Kontak juga memiliki dialog sendiri. Tidak ada kebijakan/tenggat/ukuran cm yang dikarang. |
| Detail produk | Menutup panduan ukuran mengembalikan detail beserta pilihan warna/ukuran yang sama. |
| About | Hero lama dipakai satu kali pada About; duplikasi penggunaan gambar tersebut dihapus. |
| Admin | Halaman login tetap tampil; localhost juga diisolasi. Tidak ada login atau operasi admin live. |

## Bukti pengujian

`npm test` lulus: **51 pemeriksaan**, Chrome headless desktop **1440×1000** dan mobile emulation **390×844**. Hasil mesin lengkap ada pada `outputs/qa-results.json` di direktori chat.

- **0 console errors**, **0 page errors**, **0 resource HTTP errors/404**, **0 elemen gambar rusak** pada skenario pengujian.
- **0 request ke endpoint backend Google produksi**. Endpoint tersebut diblokir oleh pengujian; konfigurasi localhost mengarah ke server simulasi.
- Seluruh 30 objek produk tidak berubah; 58 jalur gambar merespons HTTP 200.
- Rak: panah, keyboard, wheel horizontal, pointer drag, swipe sentuh native CDP, hangtag/warna, ukuran dan quick-add.
- Sepatu: paginasi, kategori, zoom, swatch, ukuran, tetangga, keranjang, Tab/focus dan Escape.
- Kuantitas keranjang dan IDR: 2 × GW-001 Rp899.000 + SW-001 Rp469.000 = subtotal **Rp2.267.000**; ongkir **Rp18.000**; total **Rp2.285.000**.
- Upload non-gambar ditolak; upload gambar valid, pergantian metode bayar, pembuatan pesanan dan pengosongan keranjang lulus di kedua viewport.
- PDF benar-benar diunduh melalui UI, bukan placeholder. File `%PDF-` diparse, varian Champagne/M dan Nude/38 serta subtotal/ongkir/total diverifikasi; satu halaman A4 dirender dan diperiksa visual. Generator juga diuji dengan 30 item panjang untuk beberapa halaman.
- Riwayat pembelian menyimpan nomor pesanan dan tautan PDF. Tracking menolak WA yang salah dan menerima nomor cocok dengan normalisasi +62/08.
- Keempat modal bantuan, respons chat simulasi, pencarian, sort, mobile menu, tanpa horizontal overflow, reduced motion dan tampilan login admin lulus.
- `node --check` untuk seluruh JS yang berubah dan server lulus. `git diff --check` lulus. `21st review` HTML/integrasi: 0 temuan. Review CSS memberi saran token warna/fallback, tanpa error fungsional; pencarian katalog 21st terhalang HTTP 401 sehingga tidak ada komponen eksternal yang diimpor.

## Batas hasil yang perlu terlihat saat review

1. **Aset pakaian adalah foto model studio, bukan cutout pakaian.** Rak memakai panel fotografi yang digantung dengan perspektif; detail foto produk asli dipertahankan. Hasilnya belum berupa pakaian terisolasi seperti video referensi.
2. **Tidak ada foto belakang asli.** Switcher FRONT/BACK tampil, tetapi BACK nonaktif dengan penjelasan. Tidak ada foto belakang palsu atau hasil mirror yang diklaim sebagai tampilan asli.
3. **Sepatu memakai foto pasangan sudut tiga perempat.** Foto side-profile murni tidak tersedia; pedestal dan zoom memakai aset existing dengan blending/masking tepi.
4. **Checkout, chat dan PDF pada localhost adalah simulasi.** PDF lokal valid, tetapi bukan bukti pembayaran. Integrasi live Google Sheets/Drive, generator PDF Apps Script, email, Gemini dan pengiriman tidak diuji dalam task ini. Status keamanan/pembayaran produksi tidak disertifikasi.
5. Pesanan simulasi berada di memori server; restart menghapusnya dan membuat tautan invoice simulasi lama tidak tersedia. Riwayat browser tetap lokal. Preview hanya tersedia selama proses server aktif pada komputer ini.
6. Mobile diuji melalui emulasi browser dan input sentuh native; belum diuji pada ponsel fisik.

## Menjalankan ulang

Pada root repo, jalankan `npm install`, lalu `npm run preview`. Buka http://localhost:4173. Jalankan `npm test` pada terminal lain. Node.js 20+ dan Chrome diperlukan; mesin saat ini memakai Node 24 dan Chrome terpasang.

Tidak ada `git push`, `vercel --prod`, deployment Apps Script, pengiriman email, atau perubahan data backend produksi.
