# Product and asset map

Audited against the existing `PRODUCTS` catalogue in `assets/app.js`. There are **30 active products**: 8 Gaun Wanita, 7 Sepatu Wanita, 8 Jas Pria and 7 Sepatu Pria. Product IDs, names, prices, colours and sizes are retained.

All active primary and colour-variant paths were checked on disk. The table below maps preserved source assets. The storefront now renders transparent derivatives: replace `assets/images/products/` with `assets/images/cutout/` and the source extension with `.png`, keeping each filename stem. All 58 active references have cutouts; the two inactive base images also have cutouts (60 total). Originals are preserved byte-for-byte in `raw/`. See `07-TRANSPARENT-CUTOUT-REPORT.md` and the image manifest for crop/alpha/anchor details. Shoe photos retain their actual three-quarter angle. Edge masking and multiply blending were removed from both interactive displays.

| ID | Product | Category | IDR | Sizes | Colour → asset (relative to repository) | Exists |
|---|---|---|---:|---|---|---|
| GW-001 | Serena Sage Gown | Gaun Wanita | 899.000 | S, M, L, XL | Sage → `assets/images/products/gw-001.webp`<br>Champagne → `assets/images/products/gw-001-champagne.png` | Yes |
| GW-002 | Amara Blush Dress | Gaun Wanita | 749.000 | S, M, L | Blush → `assets/images/products/gw-002.webp`<br>Ivory → `assets/images/products/gw-002-ivory.png` | Yes |
| GW-003 | Celeste Evening Blue | Gaun Wanita | 979.000 | S, M, L, XL | Powder Blue → `assets/images/products/gw-003.webp`<br>Navy → `assets/images/products/gw-003-navy.png` | Yes |
| GW-004 | Nadine Satin Ivory | Gaun Wanita | 829.000 | S, M, L | Ivory → `assets/images/products/gw-004.webp`<br>Rose → `assets/images/products/gw-004-rose.png` | Yes |
| GW-005 | Livia Emerald Flow | Gaun Wanita | 929.000 | S, M, L, XL | Emerald → `assets/images/products/gw-005.webp`<br>Black → `assets/images/products/gw-005-black.png` | Yes |
| GW-006 | Aurelia Champagne | Gaun Wanita | 1.099.000 | S, M, L | Champagne → `assets/images/products/gw-006.webp`<br>Mocha → `assets/images/products/gw-006-mocha.png` | Yes |
| GW-007 | Mirelle Mauve Gown | Gaun Wanita | 789.000 | S, M, L, XL | Mauve → `assets/images/products/gw-007.webp`<br>Dusty Pink → `assets/images/products/gw-007-dusty-pink.png` | Yes |
| GW-008 | Elara Midnight Black | Gaun Wanita | 949.000 | S, M, L | Black → `assets/images/products/gw-008.webp`<br>Burgundy → `assets/images/products/gw-008-burgundy.png` | Yes |
| SW-001 | Odette Pearl Heels | Sepatu Wanita | 469.000 | 36, 37, 38, 39, 40 | Pearl → `assets/images/products/sw-001.webp`<br>Nude → `assets/images/products/sw-001-nude.png` | Yes |
| SW-002 | Camille Nude Pumps | Sepatu Wanita | 429.000 | 36, 37, 38, 39, 40 | Nude → `assets/images/products/sw-002.webp`<br>Black → `assets/images/products/sw-002-black.png` | Yes |
| SW-003 | Belle Ribbon Flats | Sepatu Wanita | 359.000 | 36, 37, 38, 39, 40 | Rose → `assets/images/products/sw-003.webp`<br>Cream → `assets/images/products/sw-003-cream.png` | Yes |
| SW-004 | Sienna Leather Loafer | Sepatu Wanita | 499.000 | 36, 37, 38, 39, 40 | Tan → `assets/images/products/sw-004.webp`<br>Black → `assets/images/products/sw-004-black.png` | Yes |
| SW-005 | Luna Metallic Slingback | Sepatu Wanita | 519.000 | 36, 37, 38, 39 | Silver → `assets/images/products/sw-005.webp`<br>Champagne → `assets/images/products/sw-005-champagne.png` | Yes |
| SW-006 | Riviera White Sneaker | Sepatu Wanita | 449.000 | 36, 37, 38, 39, 40 | White → `assets/images/products/sw-006.webp`<br>Sage → `assets/images/products/sw-006-sage.png` | Yes |
| SW-007 | Valerie Block Heels | Sepatu Wanita | 479.000 | 36, 37, 38, 39, 40 | Black → `assets/images/products/sw-007.webp`<br>Caramel → `assets/images/products/sw-007-caramel.png` | Yes |
| JP-001 | Alden Sand Tailored Suit | Jas Pria | 1.499.000 | S, M, L, XL, XXL | Sand → `assets/images/products/jp-001.webp`<br>Charcoal → `assets/images/products/jp-001-charcoal.png` | Yes |
| JP-002 | Bastian Navy Classic | Jas Pria | 1.399.000 | S, M, L, XL, XXL | Navy → `assets/images/products/jp-002.webp`<br>Black → `assets/images/products/jp-002-black.png` | Yes |
| JP-003 | Cyrus Charcoal Slim | Jas Pria | 1.449.000 | S, M, L, XL | Charcoal → `assets/images/products/jp-003.webp`<br>Slate → `assets/images/products/jp-003-slate.png` | Yes |
| JP-004 | Damar Black Formal | Jas Pria | 1.599.000 | S, M, L, XL, XXL | Black → `assets/images/products/jp-004.webp` | Yes |
| JP-005 | Elio Powder Blue Suit | Jas Pria | 1.549.000 | S, M, L, XL | Powder Blue → `assets/images/products/jp-005.webp`<br>Ivory → `assets/images/products/jp-005-ivory.png` | Yes |
| JP-006 | Faris Olive Textured | Jas Pria | 1.479.000 | S, M, L, XL | Olive → `assets/images/products/jp-006.webp`<br>Brown → `assets/images/products/jp-006-brown.png` | Yes |
| JP-007 | Gavin Mocha Double Breasted | Jas Pria | 1.699.000 | M, L, XL | Mocha → `assets/images/products/jp-007.webp`<br>Cream → `assets/images/products/jp-007-cream.png` | Yes |
| JP-008 | Harris Grey Travel Blazer | Jas Pria | 1.199.000 | S, M, L, XL, XXL | Grey → `assets/images/products/jp-008.webp`<br>Navy → `assets/images/products/jp-008-navy.png` | Yes |
| SP-001 | Arden Tan Oxford | Sepatu Pria | 679.000 | 39, 40, 41, 42, 43, 44 | Tan → `assets/images/products/sp-001.webp`<br>Dark Brown → `assets/images/products/sp-001-dark-brown.png` | Yes |
| SP-002 | Bromley Black Derby | Sepatu Pria | 699.000 | 39, 40, 41, 42, 43, 44 | Black → `assets/images/products/sp-002.webp` | Yes |
| SP-003 | Cavendish Brown Loafer | Sepatu Pria | 629.000 | 39, 40, 41, 42, 43 | Brown → `assets/images/products/sp-003.webp`<br>Black → `assets/images/products/sp-003-black.png` | Yes |
| SP-004 | Dante White Court | Sepatu Pria | 579.000 | 39, 40, 41, 42, 43, 44 | White → `assets/images/products/sp-004.webp`<br>Black → `assets/images/products/sp-004-black.png` | Yes |
| SP-005 | Easton Navy Suede | Sepatu Pria | 649.000 | 39, 40, 41, 42, 43 | Navy → `assets/images/products/sp-005.webp`<br>Sand → `assets/images/products/sp-005-sand.png` | Yes |
| SP-006 | Fletcher Chunky Sneaker | Sepatu Pria | 599.000 | 39, 40, 41, 42, 43, 44 | Grey → `assets/images/products/sp-006.webp`<br>White → `assets/images/products/sp-006-white.png` | Yes |
| SP-007 | Grant Espresso Monk Strap | Sepatu Pria | 749.000 | 39, 40, 41, 42, 43 | Espresso → `assets/images/products/sp-007.webp`<br>Tan → `assets/images/products/sp-007-tan.png` | Yes |

## Validation

- Active product count: 30.
- The shoe overview uses a 10-product window: two rows × five columns on desktop, two columns on mobile. Pagination exposes all 14 shoes (10 on page one, 4 on page two). Category-specific views retain all 7 products each; focus-stage neighbors traverse the full selected category rather than stopping at page boundaries.
- Referenced primary + variant image paths: 58.
- Missing paths: 0.
- No changes to price, stock, sizes, descriptions or catalogue membership.
- `SW-008` and `SP-008` have base image files but **are not entries in the active storefront catalogue**. They are retained on disk, not silently added as purchasable products.
- There are no supplied back-view photographs for garments. No back-view asset is represented as authentic photography.

## Retained unused product image files

- `assets/images/products/sp-008.webp`
- `assets/images/products/sw-008.webp`
