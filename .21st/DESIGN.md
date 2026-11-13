# Yashbi Store — Alabaster 3D Showroom

Arahan aktif user mengganti seluruh frontend storefront dengan Three.js WebGL dan HUD baru. Tidak ada rel atau hanger. Katalog30 produk,60 cutout, fallback dan logika transaksi dipertahankan. Layout/komponen storefront lama dihapus; halaman admin bukan bagian dari penggantian storefront.

Source aktif: `src/main.js`, `catalog.js`, `commerce.js`, `showroom.js`, `ui.js`, `showroom.css`. Build esbuild menghasilkan `dist/assets/showroom.js` dan CSS. Three0.187.0 dibundel lokal; font Cormorant Garamond/Plus Jakarta Sans dilayani lokal. Tidak ada dependency runtime CDN.

Visual: kanvas #F5F3EF, elevated #FAF9F6, ink #181818, secondary #5C5852, gold #8C7355. Editorial serif, ruang kosong, HUD kanan ringan. Di overview sepatu, HUD diciutkan agar seluruh grid3D terlihat. Mobile memakai panel bawah dan judul ringkas.

Scene nyata memakai PerspectiveCamera, WebGLRenderer AA, ACESFilmic, FogExp2 density.035, floor receiveShadow, alpha customDepthMaterial, Ambient/Directional/SpotLight. Pakaian bergerak dalam runway melengkung; galeri sepatu memakai BoxGeometry stone/dark brushedmetal, normalmap prosedural dan emissive edge. Input raycaster alpha-aware, hover lift, camera flight dan frame-independent damping. Kontrol HTML menyediakan alternatif aksesibel.

Artefak visual adalah textured planes/billboards dari foto cutout. Jangan mengklaim model produk volumetrik atau tampak belakang yang tidak tersedia. Seluruh31 foto pakaian mempertahankan model lengkap dari foto asli.29 cutout sepatu tidak berubah. Local commerce/chat/PDF merupakan simulasi; tidak ada klaim integrasi produksi lulus.

Pencarian katalog21st terhalangHTTP401; implementasi baru dibuat langsung di stack proyek. Review HTML/JS tidak memiliki error; review CSS memberi saran token efek. Laporan aktif: `docs/redesign/10-TEXT-COLLISION-FIX.md`. Tiga koleksi utama terpisah: Gaun Wanita8 (default), Pakaian Pria8, Sepatu14. Tidak ada scene campuran30 produk. Kamera seluruh viewport mengukur ruang kosong antara header/judul dan HUD; panel overview ringkas, kontrol warna/ukuran di inspeksi. Landscape pendek memakai panel kanan. Inspeksi pakaian default ke close-up ROI dada/pinggang dengan empat clipping plane GPU; `TAMPILAN UTUH` mengembalikan seluruh model. Sepatu tetap memakai focus stage lama.
