/* Original 30-product commercial catalogue; local RGBA derivatives preserve source photos. */
const originalProducts = [
  {
    "id": "GW-001",
    "name": "Serena Sage Gown",
    "category": "Gaun Wanita",
    "price": 899000,
    "original": 1099000,
    "badge": "Best Seller",
    "rating": 4.9,
    "reviews": 48,
    "image": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Sage",
      "Champagne"
    ],
    "colorHex": [
      "#9eaa91",
      "#dbc8aa"
    ],
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "stock": 12,
    "desc": "Gaun panjang berpotongan anggun dengan jatuh kain lembut dan detail pinggang yang membentuk siluet elegan."
  },
  {
    "id": "GW-002",
    "name": "Amara Blush Dress",
    "category": "Gaun Wanita",
    "price": 749000,
    "original": null,
    "badge": "New",
    "rating": 4.8,
    "reviews": 21,
    "image": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Blush",
      "Ivory"
    ],
    "colorHex": [
      "#d9aaa5",
      "#eee7dc"
    ],
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "stock": 8,
    "desc": "Dress feminin dengan warna blush lembut, cocok untuk pesta siang, lamaran, atau makan malam spesial."
  },
  {
    "id": "GW-003",
    "name": "Celeste Evening Blue",
    "category": "Gaun Wanita",
    "price": 979000,
    "original": 1199000,
    "badge": "Limited",
    "rating": 4.9,
    "reviews": 17,
    "image": "https://images.unsplash.com/photo-1562137369-1a1a0bc66744?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Powder Blue",
      "Navy"
    ],
    "colorHex": [
      "#9baebd",
      "#26344d"
    ],
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "stock": 6,
    "desc": "Evening gown bernuansa biru dengan struktur ringan dan kilau halus untuk tampilan yang tenang namun berkelas."
  },
  {
    "id": "GW-004",
    "name": "Nadine Satin Ivory",
    "category": "Gaun Wanita",
    "price": 829000,
    "original": null,
    "badge": null,
    "rating": 4.7,
    "reviews": 32,
    "image": "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Ivory",
      "Rose"
    ],
    "colorHex": [
      "#ece4d7",
      "#b98586"
    ],
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "stock": 10,
    "desc": "Gaun satin minimalis dengan kilau lembut, garis leher bersih, dan siluet modern yang mudah diaksesori."
  },
  {
    "id": "GW-005",
    "name": "Livia Emerald Flow",
    "category": "Gaun Wanita",
    "price": 929000,
    "original": 1049000,
    "badge": "Best Seller",
    "rating": 4.9,
    "reviews": 55,
    "image": "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Emerald",
      "Black"
    ],
    "colorHex": [
      "#365e4e",
      "#242424"
    ],
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "stock": 14,
    "desc": "Gaun flowy warna emerald dengan karakter kuat, nyaman bergerak, dan memberi kesan mewah tanpa berlebihan."
  },
  {
    "id": "GW-006",
    "name": "Aurelia Champagne",
    "category": "Gaun Wanita",
    "price": 1099000,
    "original": 1299000,
    "badge": "Signature",
    "rating": 5,
    "reviews": 12,
    "image": "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Champagne",
      "Mocha"
    ],
    "colorHex": [
      "#d8c19c",
      "#907466"
    ],
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "stock": 5,
    "desc": "Koleksi signature dengan detail tekstur halus dan rona champagne yang memantulkan cahaya secara elegan."
  },
  {
    "id": "GW-007",
    "name": "Mirelle Mauve Gown",
    "category": "Gaun Wanita",
    "price": 789000,
    "original": null,
    "badge": null,
    "rating": 4.8,
    "reviews": 26,
    "image": "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Mauve",
      "Dusty Pink"
    ],
    "colorHex": [
      "#9d7d8a",
      "#c89fa0"
    ],
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "stock": 11,
    "desc": "Potongan modest modern dalam warna mauve yang lembut, lengkap dengan lengan nyaman dan rok berjatuh cantik."
  },
  {
    "id": "GW-008",
    "name": "Elara Midnight Black",
    "category": "Gaun Wanita",
    "price": 949000,
    "original": 1149000,
    "badge": "Evening Edit",
    "rating": 4.9,
    "reviews": 39,
    "image": "https://images.unsplash.com/photo-1568251188392-ae32f898cb3b?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Black",
      "Burgundy"
    ],
    "colorHex": [
      "#1f1d1d",
      "#632e3b"
    ],
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "stock": 7,
    "desc": "Gaun hitam serbaguna dengan detail drape modern, pilihan aman untuk gala, resepsi, dan acara formal malam."
  },
  {
    "id": "SW-001",
    "name": "Odette Pearl Heels",
    "category": "Sepatu Wanita",
    "price": 469000,
    "original": 549000,
    "badge": "Best Seller",
    "rating": 4.9,
    "reviews": 66,
    "image": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1562273138-f46be4ebdf33?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Pearl",
      "Nude"
    ],
    "colorHex": [
      "#e8e0d5",
      "#c9a68d"
    ],
    "sizes": [
      "36",
      "37",
      "38",
      "39",
      "40"
    ],
    "stock": 22,
    "desc": "Heels berujung runcing dengan tinggi nyaman dan warna pearl yang mudah dipadukan untuk kerja maupun pesta."
  },
  {
    "id": "SW-002",
    "name": "Camille Nude Pumps",
    "category": "Sepatu Wanita",
    "price": 429000,
    "original": null,
    "badge": null,
    "rating": 4.8,
    "reviews": 44,
    "image": "https://images.unsplash.com/photo-1562273138-f46be4ebdf33?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Nude",
      "Black"
    ],
    "colorHex": [
      "#cba68c",
      "#242424"
    ],
    "sizes": [
      "36",
      "37",
      "38",
      "39",
      "40"
    ],
    "stock": 19,
    "desc": "Pumps klasik dengan bantalan empuk dan warna nude yang memberi kesan kaki lebih jenjang."
  },
  {
    "id": "SW-003",
    "name": "Belle Ribbon Flats",
    "category": "Sepatu Wanita",
    "price": 359000,
    "original": 419000,
    "badge": "New",
    "rating": 4.7,
    "reviews": 25,
    "image": "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Rose",
      "Cream"
    ],
    "colorHex": [
      "#c98788",
      "#e2d3bd"
    ],
    "sizes": [
      "36",
      "37",
      "38",
      "39",
      "40"
    ],
    "stock": 16,
    "desc": "Flat shoes feminin dengan aksen pita minimal dan sol fleksibel untuk aktivitas sepanjang hari."
  },
  {
    "id": "SW-004",
    "name": "Sienna Leather Loafer",
    "category": "Sepatu Wanita",
    "price": 499000,
    "original": null,
    "badge": "Work Edit",
    "rating": 4.8,
    "reviews": 31,
    "image": "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Tan",
      "Black"
    ],
    "colorHex": [
      "#9e6849",
      "#252525"
    ],
    "sizes": [
      "36",
      "37",
      "38",
      "39",
      "40"
    ],
    "stock": 12,
    "desc": "Loafer bertekstur kulit dengan garis bersih, cocok untuk tampilan kerja yang profesional dan tetap nyaman."
  },
  {
    "id": "SW-005",
    "name": "Luna Metallic Slingback",
    "category": "Sepatu Wanita",
    "price": 519000,
    "original": 599000,
    "badge": "Party Edit",
    "rating": 4.9,
    "reviews": 18,
    "image": "https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Silver",
      "Champagne"
    ],
    "colorHex": [
      "#b9bcc0",
      "#d1b889"
    ],
    "sizes": [
      "36",
      "37",
      "38",
      "39"
    ],
    "stock": 9,
    "desc": "Slingback dengan sentuhan metallic halus yang menangkap cahaya, dibuat untuk menambah kilau pada pesta malam."
  },
  {
    "id": "SW-006",
    "name": "Riviera White Sneaker",
    "category": "Sepatu Wanita",
    "price": 449000,
    "original": null,
    "badge": "Everyday",
    "rating": 4.8,
    "reviews": 72,
    "image": "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "White",
      "Sage"
    ],
    "colorHex": [
      "#f0efea",
      "#97a18e"
    ],
    "sizes": [
      "36",
      "37",
      "38",
      "39",
      "40"
    ],
    "stock": 26,
    "desc": "Sneaker putih ringan dengan desain bersih untuk gaya kasual, kampus, dan perjalanan akhir pekan."
  },
  {
    "id": "SW-007",
    "name": "Valerie Block Heels",
    "category": "Sepatu Wanita",
    "price": 479000,
    "original": 539000,
    "badge": null,
    "rating": 4.7,
    "reviews": 29,
    "image": "https://images.unsplash.com/photo-1554062614-6da4fa67725a?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Black",
      "Caramel"
    ],
    "colorHex": [
      "#242424",
      "#ad7954"
    ],
    "sizes": [
      "36",
      "37",
      "38",
      "39",
      "40"
    ],
    "stock": 13,
    "desc": "Block heels stabil dengan tali ramping, memberikan tinggi yang elegan tanpa mengorbankan kenyamanan."
  },
  {
    "id": "JP-001",
    "name": "Alden Sand Tailored Suit",
    "category": "Jas Pria",
    "price": 1499000,
    "original": 1749000,
    "badge": "Signature",
    "rating": 4.9,
    "reviews": 37,
    "image": "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Sand",
      "Charcoal"
    ],
    "colorHex": [
      "#c5b59c",
      "#454747"
    ],
    "sizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "stock": 9,
    "desc": "Setelan tailoring modern berwarna sand dengan bahu terstruktur lembut dan potongan yang rapi untuk acara penting."
  },
  {
    "id": "JP-002",
    "name": "Bastian Navy Classic",
    "category": "Jas Pria",
    "price": 1399000,
    "original": null,
    "badge": "Best Seller",
    "rating": 4.9,
    "reviews": 61,
    "image": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Navy",
      "Black"
    ],
    "colorHex": [
      "#283448",
      "#222222"
    ],
    "sizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "stock": 17,
    "desc": "Jas navy klasik yang fleksibel untuk kerja, pernikahan, dan acara formal dengan tampilan tajam tanpa berlebihan."
  },
  {
    "id": "JP-003",
    "name": "Cyrus Charcoal Slim",
    "category": "Jas Pria",
    "price": 1449000,
    "original": 1599000,
    "badge": null,
    "rating": 4.8,
    "reviews": 33,
    "image": "https://images.unsplash.com/photo-1598808503746-f34c53b9323e?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Charcoal",
      "Slate"
    ],
    "colorHex": [
      "#46494b",
      "#68737b"
    ],
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "stock": 11,
    "desc": "Siluet slim dalam warna charcoal dengan lapel ramping, ideal untuk tampilan bisnis kontemporer."
  },
  {
    "id": "JP-004",
    "name": "Damar Black Formal",
    "category": "Jas Pria",
    "price": 1599000,
    "original": 1899000,
    "badge": "Formal Edit",
    "rating": 5,
    "reviews": 24,
    "image": "https://images.unsplash.com/photo-1555069519-127aadedf1ee?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Black"
    ],
    "colorHex": [
      "#202020"
    ],
    "sizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "stock": 8,
    "desc": "Jas hitam formal dengan struktur presisi dan detail satin halus untuk resepsi, gala, atau acara black tie."
  },
  {
    "id": "JP-005",
    "name": "Elio Powder Blue Suit",
    "category": "Jas Pria",
    "price": 1549000,
    "original": null,
    "badge": "New",
    "rating": 4.8,
    "reviews": 16,
    "image": "https://images.unsplash.com/photo-1555069519-127aadedf1ee?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Powder Blue",
      "Ivory"
    ],
    "colorHex": [
      "#91a8bd",
      "#ded8cb"
    ],
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "stock": 7,
    "desc": "Setelan biru muda yang segar untuk acara siang, prewedding, atau perayaan dengan tema modern."
  },
  {
    "id": "JP-006",
    "name": "Faris Olive Textured",
    "category": "Jas Pria",
    "price": 1479000,
    "original": 1649000,
    "badge": "Modern Edit",
    "rating": 4.8,
    "reviews": 20,
    "image": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Olive",
      "Brown"
    ],
    "colorHex": [
      "#68725d",
      "#72574a"
    ],
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "stock": 10,
    "desc": "Jas olive bertekstur halus dengan karakter santai-elegan, mudah dipadukan dengan kemeja putih atau krem."
  },
  {
    "id": "JP-007",
    "name": "Gavin Mocha Double Breasted",
    "category": "Jas Pria",
    "price": 1699000,
    "original": null,
    "badge": "Premium",
    "rating": 4.9,
    "reviews": 19,
    "image": "https://images.unsplash.com/photo-1555069519-127aadedf1ee?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Mocha",
      "Cream"
    ],
    "colorHex": [
      "#8a6d5d",
      "#d4c7b3"
    ],
    "sizes": [
      "M",
      "L",
      "XL"
    ],
    "stock": 6,
    "desc": "Double-breasted suit dengan proporsi modern dan warna mocha yang hangat untuk tampilan premium yang berani."
  },
  {
    "id": "JP-008",
    "name": "Harris Grey Travel Blazer",
    "category": "Jas Pria",
    "price": 1199000,
    "original": 1399000,
    "badge": "Travel Edit",
    "rating": 4.7,
    "reviews": 42,
    "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Grey",
      "Navy"
    ],
    "colorHex": [
      "#808080",
      "#293649"
    ],
    "sizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "stock": 15,
    "desc": "Blazer ringan anti-kusut untuk perjalanan bisnis dan agenda harian, tetap rapi meski digunakan sepanjang hari."
  },
  {
    "id": "SP-001",
    "name": "Arden Tan Oxford",
    "category": "Sepatu Pria",
    "price": 679000,
    "original": 779000,
    "badge": "Best Seller",
    "rating": 4.9,
    "reviews": 58,
    "image": "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Tan",
      "Dark Brown"
    ],
    "colorHex": [
      "#a66f49",
      "#513a30"
    ],
    "sizes": [
      "39",
      "40",
      "41",
      "42",
      "43",
      "44"
    ],
    "stock": 21,
    "desc": "Oxford kulit berwarna tan dengan konstruksi klasik, pasangan tepat untuk jas maupun smart casual."
  },
  {
    "id": "SP-002",
    "name": "Bromley Black Derby",
    "category": "Sepatu Pria",
    "price": 699000,
    "original": null,
    "badge": "Formal Edit",
    "rating": 4.8,
    "reviews": 46,
    "image": "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Black"
    ],
    "colorHex": [
      "#202020"
    ],
    "sizes": [
      "39",
      "40",
      "41",
      "42",
      "43",
      "44"
    ],
    "stock": 18,
    "desc": "Derby hitam dengan bentuk ramping dan finishing bersih untuk kebutuhan kantor hingga pesta formal."
  },
  {
    "id": "SP-003",
    "name": "Cavendish Brown Loafer",
    "category": "Sepatu Pria",
    "price": 629000,
    "original": 729000,
    "badge": null,
    "rating": 4.8,
    "reviews": 36,
    "image": "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Brown",
      "Black"
    ],
    "colorHex": [
      "#79533e",
      "#242424"
    ],
    "sizes": [
      "39",
      "40",
      "41",
      "42",
      "43"
    ],
    "stock": 14,
    "desc": "Loafer kulit slip-on yang ringan, cocok untuk pertemuan bisnis, makan malam, dan tampilan akhir pekan."
  },
  {
    "id": "SP-004",
    "name": "Dante White Court",
    "category": "Sepatu Pria",
    "price": 579000,
    "original": null,
    "badge": "Gen Z Pick",
    "rating": 4.9,
    "reviews": 77,
    "image": "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "White",
      "Black"
    ],
    "colorHex": [
      "#eeeae2",
      "#252525"
    ],
    "sizes": [
      "39",
      "40",
      "41",
      "42",
      "43",
      "44"
    ],
    "stock": 28,
    "desc": "Sneaker court putih minimalis yang mudah dipadukan dengan denim, chino, maupun setelan kasual modern."
  },
  {
    "id": "SP-005",
    "name": "Easton Navy Suede",
    "category": "Sepatu Pria",
    "price": 649000,
    "original": 749000,
    "badge": "Weekend Edit",
    "rating": 4.7,
    "reviews": 28,
    "image": "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Navy",
      "Sand"
    ],
    "colorHex": [
      "#334359",
      "#b5a286"
    ],
    "sizes": [
      "39",
      "40",
      "41",
      "42",
      "43"
    ],
    "stock": 13,
    "desc": "Sepatu suede navy dengan karakter santai-premium untuk acara semi formal dan akhir pekan."
  },
  {
    "id": "SP-006",
    "name": "Fletcher Chunky Sneaker",
    "category": "Sepatu Pria",
    "price": 599000,
    "original": null,
    "badge": "New",
    "rating": 4.8,
    "reviews": 34,
    "image": "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Grey",
      "White"
    ],
    "colorHex": [
      "#8b9091",
      "#ece9e2"
    ],
    "sizes": [
      "39",
      "40",
      "41",
      "42",
      "43",
      "44"
    ],
    "stock": 24,
    "desc": "Sneaker chunky dengan bantalan responsif dan siluet modern, cocok untuk street style dan aktivitas harian."
  },
  {
    "id": "SP-007",
    "name": "Grant Espresso Monk Strap",
    "category": "Sepatu Pria",
    "price": 749000,
    "original": 849000,
    "badge": "Premium",
    "rating": 4.9,
    "reviews": 22,
    "image": "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=900&q=85",
    "alt": "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=900&q=85",
    "colors": [
      "Espresso",
      "Tan"
    ],
    "colorHex": [
      "#49352e",
      "#a27151"
    ],
    "sizes": [
      "39",
      "40",
      "41",
      "42",
      "43"
    ],
    "stock": 9,
    "desc": "Monk strap premium dengan buckle rapi dan warna espresso dalam, dibuat untuk pria yang menyukai detail berbeda."
  }
];

const variantFiles = {
  "GW-001": {
    "Champagne": "gw-001-champagne.png"
  },
  "GW-002": {
    "Ivory": "gw-002-ivory.png"
  },
  "GW-003": {
    "Navy": "gw-003-navy.png"
  },
  "GW-004": {
    "Rose": "gw-004-rose.png"
  },
  "GW-005": {
    "Black": "gw-005-black.png"
  },
  "GW-006": {
    "Mocha": "gw-006-mocha.png"
  },
  "GW-007": {
    "Dusty Pink": "gw-007-dusty-pink.png"
  },
  "GW-008": {
    "Burgundy": "gw-008-burgundy.png"
  },
  "SW-001": {
    "Nude": "sw-001-nude.png"
  },
  "SW-002": {
    "Black": "sw-002-black.png"
  },
  "SW-003": {
    "Cream": "sw-003-cream.png"
  },
  "SW-004": {
    "Black": "sw-004-black.png"
  },
  "SW-005": {
    "Champagne": "sw-005-champagne.png"
  },
  "SW-006": {
    "Sage": "sw-006-sage.png"
  },
  "SW-007": {
    "Caramel": "sw-007-caramel.png"
  },
  "JP-001": {
    "Charcoal": "jp-001-charcoal.png"
  },
  "JP-002": {
    "Black": "jp-002-black.png"
  },
  "JP-003": {
    "Slate": "jp-003-slate.png"
  },
  "JP-005": {
    "Ivory": "jp-005-ivory.png"
  },
  "JP-006": {
    "Brown": "jp-006-brown.png"
  },
  "JP-007": {
    "Cream": "jp-007-cream.png"
  },
  "JP-008": {
    "Navy": "jp-008-navy.png"
  },
  "SP-001": {
    "Dark Brown": "sp-001-dark-brown.png"
  },
  "SP-003": {
    "Black": "sp-003-black.png"
  },
  "SP-004": {
    "Black": "sp-004-black.png"
  },
  "SP-005": {
    "Sand": "sp-005-sand.png"
  },
  "SP-006": {
    "White": "sp-006-white.png"
  },
  "SP-007": {
    "Tan": "sp-007-tan.png"
  }
};

const driveSources = {
  "GW-001": {
    "image": "https://drive.google.com/thumbnail?id=1lNbpeWcNG17zZj1VQkD_toOZW6eozy9Y&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1lNbpeWcNG17zZj1VQkD_toOZW6eozy9Y&sz=w1200"
  },
  "GW-002": {
    "image": "https://drive.google.com/thumbnail?id=1G3v0VAdFWOJ43LGayysyydUpeG-vwWtT&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1G3v0VAdFWOJ43LGayysyydUpeG-vwWtT&sz=w1200"
  },
  "GW-003": {
    "image": "https://drive.google.com/thumbnail?id=1QGk-lZsEv8wUS7Y8q1fYRbuX2Fa2xGVg&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1QGk-lZsEv8wUS7Y8q1fYRbuX2Fa2xGVg&sz=w1200"
  },
  "GW-004": {
    "image": "https://drive.google.com/thumbnail?id=1XBZh6RrOZuyBBDXHVB_NlRhvMEIjIvLi&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1XBZh6RrOZuyBBDXHVB_NlRhvMEIjIvLi&sz=w1200"
  },
  "GW-005": {
    "image": "https://drive.google.com/thumbnail?id=1qNoRo8YA3_GodU9kIh2ykvZehdxrmif5&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1qNoRo8YA3_GodU9kIh2ykvZehdxrmif5&sz=w1200"
  },
  "GW-006": {
    "image": "https://drive.google.com/thumbnail?id=1LA95eWgbSAJcXUe_stvjSt-XLBDhpdQu&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1LA95eWgbSAJcXUe_stvjSt-XLBDhpdQu&sz=w1200"
  },
  "GW-007": {
    "image": "https://drive.google.com/thumbnail?id=1IPUG0lB46y9t7oJrGISZFtzl-f5gVfcQ&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1IPUG0lB46y9t7oJrGISZFtzl-f5gVfcQ&sz=w1200"
  },
  "GW-008": {
    "image": "https://drive.google.com/thumbnail?id=1niejUBjec6UYxUwWEQ_5D65dJbO6SRsD&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1niejUBjec6UYxUwWEQ_5D65dJbO6SRsD&sz=w1200"
  },
  "SW-001": {
    "image": "https://drive.google.com/thumbnail?id=1P4Q5ohTOOwpOlEkN_0VtQ0D6vcYgF7z4&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1P4Q5ohTOOwpOlEkN_0VtQ0D6vcYgF7z4&sz=w1200"
  },
  "SW-002": {
    "image": "https://drive.google.com/thumbnail?id=18W6EEDRCUwwszcJwBnqgwUw5q3_NxYFZ&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=18W6EEDRCUwwszcJwBnqgwUw5q3_NxYFZ&sz=w1200"
  },
  "SW-003": {
    "image": "https://drive.google.com/thumbnail?id=1Zo2ZDTlscPJ75Wr7ZatJvTRAh-AzQ9ZW&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1Zo2ZDTlscPJ75Wr7ZatJvTRAh-AzQ9ZW&sz=w1200"
  },
  "SW-004": {
    "image": "https://drive.google.com/thumbnail?id=1g05HLiN-dlfsdOB3sW3hF0FeGo_p1KvA&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1g05HLiN-dlfsdOB3sW3hF0FeGo_p1KvA&sz=w1200"
  },
  "SW-005": {
    "image": "https://drive.google.com/thumbnail?id=1Iz0PdVGl7XFVHXZ5ut73Io3xUqvg2vKC&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1Iz0PdVGl7XFVHXZ5ut73Io3xUqvg2vKC&sz=w1200"
  },
  "SW-006": {
    "image": "https://drive.google.com/thumbnail?id=1SNQIdSiUrNFOkw2dZOJrCO4eJId3VNjM&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1SNQIdSiUrNFOkw2dZOJrCO4eJId3VNjM&sz=w1200"
  },
  "SW-007": {
    "image": "https://drive.google.com/thumbnail?id=1eaAOFEmGUNIfrFQpqDqo4ZTwW9QykIT9&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1eaAOFEmGUNIfrFQpqDqo4ZTwW9QykIT9&sz=w1200"
  },
  "SW-008": {
    "image": "https://drive.google.com/thumbnail?id=1B2j0A1hN8DJ8_zSdRXra2Sa3QXu_JcN7&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1B2j0A1hN8DJ8_zSdRXra2Sa3QXu_JcN7&sz=w1200"
  },
  "JP-001": {
    "image": "https://drive.google.com/thumbnail?id=1OmBkD4w8l1K8LFYxPYOLpBz7hj0o2zuC&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1OmBkD4w8l1K8LFYxPYOLpBz7hj0o2zuC&sz=w1200"
  },
  "JP-002": {
    "image": "https://drive.google.com/thumbnail?id=1rgQAMZxQLqAWGSLaaXbWG9dvth9SWu-x&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1rgQAMZxQLqAWGSLaaXbWG9dvth9SWu-x&sz=w1200"
  },
  "JP-003": {
    "image": "https://drive.google.com/thumbnail?id=1cjLTqBc2gcDrjYQSETbT701iRQ30jR_2&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1cjLTqBc2gcDrjYQSETbT701iRQ30jR_2&sz=w1200"
  },
  "JP-004": {
    "image": "https://drive.google.com/thumbnail?id=10KcGvT3ywE8BS3TjGSBGtSyA7l8R5p6m&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=10KcGvT3ywE8BS3TjGSBGtSyA7l8R5p6m&sz=w1200"
  },
  "JP-005": {
    "image": "https://drive.google.com/thumbnail?id=1DyKpc56UlCCyAsUObDA8n_6_meZVvlTz&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1DyKpc56UlCCyAsUObDA8n_6_meZVvlTz&sz=w1200"
  },
  "JP-006": {
    "image": "https://drive.google.com/thumbnail?id=14MS54zhbnTGJfjMBtYyzVjJyzE20FC6S&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=14MS54zhbnTGJfjMBtYyzVjJyzE20FC6S&sz=w1200"
  },
  "JP-007": {
    "image": "https://drive.google.com/thumbnail?id=1OqvKARBXpRFifwKsh6hMR2XfwRIJlX77&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1OqvKARBXpRFifwKsh6hMR2XfwRIJlX77&sz=w1200"
  },
  "JP-008": {
    "image": "https://drive.google.com/thumbnail?id=18eHSF3SyM2rjQqYYb6S-3CaLOS6kU4y8&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=18eHSF3SyM2rjQqYYb6S-3CaLOS6kU4y8&sz=w1200"
  },
  "SP-001": {
    "image": "https://drive.google.com/thumbnail?id=1-ULE5W-rqtOOIguQTvAUV-iNSQ0nQ8pb&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1-ULE5W-rqtOOIguQTvAUV-iNSQ0nQ8pb&sz=w1200"
  },
  "SP-002": {
    "image": "https://drive.google.com/thumbnail?id=1xYofPIRuXZYyvN_YxwtA0NaYtLT0olka&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1xYofPIRuXZYyvN_YxwtA0NaYtLT0olka&sz=w1200"
  },
  "SP-003": {
    "image": "https://drive.google.com/thumbnail?id=1EmKM2sRM884FPhNBuXeEd9fHs8FQHb0q&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1EmKM2sRM884FPhNBuXeEd9fHs8FQHb0q&sz=w1200"
  },
  "SP-004": {
    "image": "https://drive.google.com/thumbnail?id=15BqKOI9ewHy7_SNYNToAtvcmxzpYzUrd&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=15BqKOI9ewHy7_SNYNToAtvcmxzpYzUrd&sz=w1200"
  },
  "SP-005": {
    "image": "https://drive.google.com/thumbnail?id=1CeH4iEDXy9iOIOD7YWyPTnr4fK5SDHUi&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1CeH4iEDXy9iOIOD7YWyPTnr4fK5SDHUi&sz=w1200"
  },
  "SP-006": {
    "image": "https://drive.google.com/thumbnail?id=1HNIsJ-DnR1ucZsetb-tlqKgO-qFrexzr&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1HNIsJ-DnR1ucZsetb-tlqKgO-qFrexzr&sz=w1200"
  },
  "SP-007": {
    "image": "https://drive.google.com/thumbnail?id=1o3iFYD1ZXCermPilswnMAhQySmWzSHKY&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1o3iFYD1ZXCermPilswnMAhQySmWzSHKY&sz=w1200"
  },
  "SP-008": {
    "image": "https://drive.google.com/thumbnail?id=1E785YQZz9Q9nDpjEN0GTqjOSmg85BIYE&sz=w1200",
    "alt": "https://drive.google.com/thumbnail?id=1E785YQZz9Q9nDpjEN0GTqjOSmg85BIYE&sz=w1200"
  }
};

export const products = originalProducts.map(original => {
  const stem = original.id.toLowerCase();
  const remote = globalThis.YASHBI_IMAGE_SOURCES?.[original.id] || driveSources[original.id] || {};
  const originalImage = `assets/images/products/${stem}.webp`;
  const originalColorImages = {};
  const colorImages = {};
  for (const color of original.colors) {
    const file = variantFiles[original.id]?.[color];
    originalColorImages[color] = file ? `assets/images/products/${file}` : originalImage;
    const colorStem = file ? file.replace(/\.[^.]+$/, '') : stem;
    colorImages[color] = `assets/images/cutout/${colorStem}.png`;
  }
  return {
    ...original,
    image: `assets/images/cutout/${stem}.png`,
    originalImage,
    originalColorImages,
    colorImages,
    remoteImage: remote.image || '',
    remoteAlt: remote.alt || '',
    remoteColorImages: { ...(remote.colorImages || {}) },
    sourceImage: original.image,
    sourceAlt: original.alt,
  };
});

export const money = value => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
}).format(Number(value) || 0);

export function imageForColor(product, color = product?.colors?.[0]) {
  return product?.colorImages?.[color] || product?.image || '';
}

export function productImageFallbacks(product, color = product?.colors?.[0]) {
  if (!product) return [];
  const first = color === product.colors[0];
  const sources = first
    ? [product.remoteImage, product.originalImage]
    : [product.remoteColorImages?.[color], product.originalColorImages?.[color], product.remoteImage, product.originalImage];
  const base = globalThis.location?.href || 'http://localhost/';
  return [...new Set(sources.filter(Boolean).map(value => {
    try { const url = new URL(value, base); return /^https?:$/.test(url.protocol) ? url.href : ''; }
    catch { return ''; }
  }).filter(Boolean))];
}

/** Ordered texture sources: selected RGBA first, then original Drive/local refs. */
export function imageSources(product, color = product?.colors?.[0]) {
  return [...new Set([imageForColor(product, color), ...productImageFallbacks(product, color)].filter(Boolean))];
}

/** Install one delegated image fallback without coupling catalogue data to UI. */
export function installImageFallback(root = globalThis.document) {
  if (!root?.addEventListener) return () => {};
  const references = new Map();
  const attempts = new WeakMap();
  const base = globalThis.location?.href || 'http://localhost/';
  for (const product of products) {
    for (const color of product.colors) references.set(new URL(imageForColor(product, color), base).href, { product, color });
  }
  const handle = event => {
    const image = event.target;
    if (image?.tagName !== 'IMG') return;
    const source = image.currentSrc || image.src;
    const reference = references.get(source);
    let state = attempts.get(image);
    if (reference) {
      state = { remaining: productImageFallbacks(reference.product, reference.color), seen: new Set([source]), last: source };
      attempts.set(image, state);
    }
    if (!state || (!reference && state.last !== source)) return;
    const next = state.remaining.find(url => !state.seen.has(url));
    if (!next) { image.classList.add('image-unavailable'); return; }
    state.seen.add(next);
    state.last = next;
    image.dataset.imageFallback = /googleusercontent|drive\.google/.test(next) ? 'google-drive' : 'original-local';
    image.src = next;
  };
  root.addEventListener('error', handle, true);
  return () => root.removeEventListener('error', handle, true);
}
