# Warm Atelier

## Palet

```css
:root {
  --bg-canvas: #F5F3EF;
  --bg-canvas-elevated: #FAF9F6;
  --ink-primary: #181818;
  --ink-secondary: #5C5852;
  --ink-muted: #969087;
  --rack-metal: #2C2C2E;
  --accent-gold: #8C7355;
  --hangtag-paper: #FDFBF7;
}
```

## Tipografi

Google Fonts: `'Cormorant Garamond'` untuk judul dan hero editorial; `'Plus Jakarta Sans'` untuk spesifikasi, indeks, harga IDR, tombol dan antarmuka operasional. Sediakan fallback lokal.

## Pencahayaan dan bayangan

Gunakan multi-layered `drop-shadow` realistis pada foto pakaian/sepatu. Gunakan `mix-blend-mode: multiply` pada foto berlatar putih untuk menyatu dengan kanvas `#F5F3EF`. Bayangan lantai berbentuk elips lembut. Mode inspeksi menerapkan depth-of-field `blur(11px)` pada panggung di belakang. Hindari layout shift, hormati `prefers-reduced-motion`, sediakan focus ring dan kontras yang terbaca.
