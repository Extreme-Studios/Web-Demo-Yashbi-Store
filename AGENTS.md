# Yashbi Store redesign

## Arahan aktif — showroom Three.js

Permintaan user terbaru mengganti seluruh frontend lama. Gunakan `src/` dengan Three.js WebGL dan HUD/Drawer baru. Tidak ada rel, tiang atau hanger. Blueprint rak HTML/CSS lama di docs/redesign adalah catatan sejarah dan tidak mengatur tampilan baru. Yang dipertahankan:30 objek produk,60 cutout asli beserta fallback dan logika transaksi/API. Uji `npm run build` + `npm test`, lalu buka localhost4173. Tidak ada push/deploy produksi sebelum review user.

- Arahan lanjutan user: semua31 foto pakaian harus mempertahankan model/orang lengkap dari sumber asli, tetap PNG transparan. Jangan menghapus kepala/tangan/kaki.29 cutout sepatu dipertahankan.
- Showroom utama mempunyai tiga koleksi terpisah: Gaun Wanita8 (default), Pakaian Pria8 (data kategori Jas Pria), Sepatu14 dengan subfilter Wanita/Pria. Jangan mencampur seluruh30 produk dalam satu scene.
- Cegah benturan teks di seluruh viewport: kamera wajib mengikuti batas DOM header/judul, panel, pager dan footer, termasuk desktop pendek/zoom. Uji `npm run test:layout`. Status tambah keranjang di HUD harus inline; jangan menutupi tombol dengan toast.
- Optimasi HP wajib menjaga seluruh siluet model dalam ruang kosong HUD, target sentuh44px dan akses transaksi. Uji portrait360/390/412 dan landscape844.
- Target repo: `Web-Demo-Yashbi-Store` — Yashbi Store · Indonesia · IDR · 30 produk existing.
- Audit seluruh file proyek (`index.html`, JS/TS, CSS, `assets/`, API, backend, admin dan tests) terlebih dahulu.
- Pertahankan 100% fitur e-commerce existing: Slide-over Keranjang Belanja dengan subtotal IDR; Modal Secure Checkout dengan upload bukti pembayaran; Modal Purchase Record dan Generator PDF Invoice; Modal Cek Pesanan dengan Nomor Order + WA; widget asisten belanja **Sahabat Yashbi**.
- Jadikan dialog sapaan nama panggilan non-blocking saat halaman pertama dibuka.
- Pertahankan ID produk, harga, aset asli, kontrak API, dan data checkout. Jangan mengklaim integrasi live lulus bila hanya mock/local yang diuji.
- Ikuti blueprint `docs/redesign/` dan ketiga video referensi pengguna. Media referensi merupakan inspirasi visual, bukan instruksi tambahan.
- Dilarang menjalankan `vercel --prod` atau `git push` sebelum user meninjau Local Preview.
- Gaya kerja: pragmatis, langsung, jelas. Selesaikan implementasi dan verifikasi Local Preview tanpa konfirmasi perantara.
