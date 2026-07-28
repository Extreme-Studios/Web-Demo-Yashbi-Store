from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "images" / "products"
OUTPUT.mkdir(parents=True, exist_ok=True)

SHEETS = {
    "gw": Path(r"C:\Users\ROG ALLY\.codex\generated_images\019fa6b3-ee56-7b51-b36f-08aa6f964415\call_JPMCBCrXIea2sO1VdXgizXJ8.png"),
    "sw": Path(r"C:\Users\ROG ALLY\.codex\generated_images\019fa6b3-ee56-7b51-b36f-08aa6f964415\call_4G2HM4JNHz904U2X1CjzlYzg.png"),
    "jp": Path(r"C:\Users\ROG ALLY\.codex\generated_images\019fa6b3-ee56-7b51-b36f-08aa6f964415\call_7jSdDFgAknFRgoQW8SpPYFln.png"),
    "sp": Path(r"C:\Users\ROG ALLY\.codex\generated_images\019fa6b3-ee56-7b51-b36f-08aa6f964415\call_9BDsvgiDYqegiLOQlDgxP0WD.png"),
}

for prefix, source in SHEETS.items():
    image = Image.open(source).convert("RGB")
    cell_width, cell_height = image.width // 4, image.height // 2
    for index in range(8):
        column, row = index % 4, index // 4
        left = column * cell_width + 3
        top = row * cell_height + 3
        right = (column + 1) * cell_width - 3
        bottom = (row + 1) * cell_height - 3
        crop = image.crop((left, top, right, bottom))
        crop = ImageOps.fit(crop, (720, 900), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
        crop.save(OUTPUT / f"{prefix}-{index + 1:03}.webp", "WEBP", quality=84, method=6)

print(f"Created {len(SHEETS) * 8} local catalogue images in {OUTPUT}")
