"""Build real RGBA catalogue cutouts without modifying original photos.

Install requirements-cutout.txt, then run:
    python tools/build_cutouts.py
Models are cached under ../work/cutout-models (never downloaded into the home
directory). --only accepts stems for a representative review; a complete run
expects all 32 base SKU photos and all 28 local colour variant photos.

Background segmentation is semantic ISNet inference, not a beige/white pixel
threshold. The default preserves the complete photographed person, including
head, hands and shoes, and removes only the studio background. The optional
--garments cloth mode segments unoccluded fabric; full subjects are retained
where photographed hands occlude fabric. No geometry is invented. Matting refines real source edges. Raw originals
are copied byte-for-byte for reproducibility. Output alpha is cropped exactly to
its nonzero bounding box; there is no invisible sole-to-shelf padding.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import shutil
import sys
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT.parent / "work"
ISOLATED_PACKAGES = WORK / "cutout-python"
if ISOLATED_PACKAGES.is_dir():
    sys.path.insert(0, str(ISOLATED_PACKAGES))
os.environ.setdefault("OMP_NUM_THREADS", "4")
os.environ.setdefault("NUMBA_NUM_THREADS", "4")
os.environ.setdefault("NUMBA_CACHE_DIR", str(WORK / "cutout-numba-cache"))

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps
from rembg import new_session
from rembg.bg import alpha_matting_cutout, decontaminate_cutout

MODELS = {
    "isnet-general-use": {
        "url": "https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx",
        "md5": "fc16ebd8b0c10d971d3513d564d01e29",
    },
    "u2net": {
        "url": "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx",
        "md5": "60024c5c889badc19c04ad937298a77b",
    },
    "u2net_cloth_seg": {
        "url": "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net_cloth_seg.onnx",
        "md5": "2434d1f3cb744e0e49386c906e5a08bb",
    },
}

# Source-photo inspection: hands cross the fabric in these poses. Removing the
# person would leave fabricated garment holes. Retain the authentic foreground.
SUBJECT_FALLBACK_SKUS = {"gw-002", "gw-005", "gw-007", "jp-001", "jp-007"}
# Reviewed pale insoles and white leather: U2Net preserves their continuous
# opaque surfaces better; ISNet is retained for open straps and fine gaps.
U2NET_OVERRIDE_SKUS = {"sw-001", "sw-002", "sw-006", "sw-007", "sp-004"}

# Reviewed original ivory tulle has continuous fabric in this source region.
# The foreground network mistakes two pale folds for enclosed background holes.
# Restore only source pixels inside those enclosed mask components, never draw
# missing fabric or fill legitimate open slits/arm gaps.
FABRIC_HOLE_REGIONS = {
    "gw-002-ivory": (0.30, 0.48, 0.72, 0.92),
    "sp-004": (0.025, 0.34, 0.27, 0.51),
    "sp-004-black": (0.025, 0.34, 0.27, 0.51),
}

# Reviewed studio-floor shadow below the rear pearl heel. Trace the visible sole
# and the front shoe's edge in source coordinates; normalized to the same pose
# in the higher-resolution nude variant. No shoe pixels are synthesized.
PEARL_HEEL_FLOOR = [(515, 659), (690, 659), (720, 650), (720, 900),
                    (560, 900), (560, 712), (558, 700), (550, 689),
                    (539, 679), (524, 668)]


def restore_reviewed_fabric_mask(mask: Image.Image, stem: str) -> tuple[Image.Image, int]:
    region = FABRIC_HOLE_REGIONS.get(stem)
    if not region:
        return mask, 0
    values = np.asarray(mask.convert("L")).copy()
    height, width = values.shape
    count, labels, statistics, _ = cv2.connectedComponentsWithStats((values < 128).astype(np.uint8), 8)
    repaired = 0
    for label in range(1, count):
        left, top, component_width, component_height, area = statistics[label]
        right, bottom = left + component_width, top + component_height
        if area >= 16 and left > region[0] * width and right < region[2] * width and top > region[1] * height and bottom < region[3] * height:
            component = (labels == label).astype(np.uint8)
            # A two-pixel interior ring also restores the low-confidence fringe.
            component = cv2.dilate(component, np.ones((5, 5), np.uint8))
            values[component > 0] = 255
            repaired += 1
    return Image.fromarray(values, "L"), repaired


def digest(filename: Path, algorithm: str = "sha256") -> str:
    result = hashlib.new(algorithm)
    with filename.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            result.update(chunk)
    return result.hexdigest()


def ensure_model(name: str, directory: Path) -> Path:
    directory.mkdir(parents=True, exist_ok=True)
    target = directory / f"{name}.onnx"
    specification = MODELS[name]
    if not target.exists():
        temporary = target.with_suffix(".download")
        print(f"Downloading official {name} model", flush=True)
        urllib.request.urlretrieve(specification["url"], temporary)
        if digest(temporary, "md5") != specification["md5"]:
            raise RuntimeError(f"Official model checksum mismatch: {name}")
        temporary.replace(target)
    if digest(target, "md5") != specification["md5"]:
        raise RuntimeError(f"Model checksum mismatch: {target}")
    return target


def clean_alpha(image: Image.Image, shoe: bool) -> Image.Image:
    pixels = np.asarray(image.convert("RGBA")).copy()
    alpha = pixels[:, :, 3]
    # Remove low-confidence matting haze, not any source RGB colour.
    alpha[alpha < 32] = 0
    alpha[alpha > 247] = 255
    count, labels, statistics, _ = cv2.connectedComponentsWithStats((alpha > 0).astype(np.uint8), 8)
    area = int(np.count_nonzero(alpha))
    minimum = max(8, round(area * 0.00004))
    for label in range(1, count):
        if statistics[label, cv2.CC_STAT_AREA] < minimum:
            alpha[labels == label] = 0
    if shoe:
        # Alpha-matting haze underneath a solid sole is not shoe geometry.
        # Trim only the soft rows below the final confidently opaque foreground;
        # never classify any white/nude source RGB colour as background.
        solid_rows = np.flatnonzero(np.any(alpha >= 224, axis=1))
        if solid_rows.size:
            alpha[solid_rows[-1] + 1:] = 0
    pixels[:, :, 3] = alpha
    pixels[alpha == 0, :3] = 0
    return Image.fromarray(pixels, "RGBA")


def shoulder_anchor(image: Image.Image, garment: bool) -> tuple[dict, float]:
    """Silhouette estimate, in trimmed-image normalized coordinates.

    This is an alignment aid, not anatomical landmark ground truth. Cloth-only
    images start at the collar/strap; choose the broad shoulder band in the upper
    22% instead of mistakenly anchoring a CSS hanger above a model's head.
    """
    alpha = np.asarray(image.getchannel("A")) >= 128
    height, width = alpha.shape
    spans = np.zeros(height, dtype=float)
    lefts = np.zeros(height, dtype=int)
    rights = np.zeros(height, dtype=int)
    for row in range(height):
        occupied = np.flatnonzero(alpha[row])
        if occupied.size:
            lefts[row], rights[row] = occupied[0], occupied[-1]
            spans[row] = occupied[-1] - occupied[0] + 1
    first = max(1, round(height * (0.015 if garment else 0.13)))
    last = max(first + 1, min(height, round(height * (0.12 if garment else 0.23))))
    smoothed = np.convolve(spans, np.ones(7) / 7, mode="same")
    broad = np.flatnonzero(smoothed[first:last] >= smoothed[first:last].max() * 0.82)
    row = first + int(broad[0]) if broad.size else first
    center = (lefts[row] + rights[row]) / 2
    return {"x": round(center / max(1, width - 1), 5), "y": round(row / max(1, height - 1), 5)}, round(spans[row] / width, 5)


def segment(source: Path, general, cloth, garment_mode: str, model_name: str) -> tuple[Image.Image, tuple, dict]:
    original = ImageOps.exif_transpose(Image.open(source)).convert("RGB")
    foreground_mask = general.predict(original)[0].convert("L")
    clothing_source = source.stem.startswith(("gw-", "jp-"))
    fallback = clothing_source and garment_mode == "cloth" and source.stem[:6] in SUBJECT_FALLBACK_SKUS
    garment = clothing_source and garment_mode == "cloth" and not fallback
    mask = foreground_mask
    model = model_name
    if garment:
        clothing_masks = cloth.predict(original, cc="attire")
        cloth_alpha = np.maximum.reduce([np.asarray(value.convert("L")) for value in clothing_masks])
        # Keep only photographed clothing, including real gaps between arms/body.
        mask = Image.fromarray(np.minimum(cloth_alpha, np.asarray(foreground_mask)).astype(np.uint8), "L")
        mask = mask.filter(ImageFilter.GaussianBlur(0.45))
        model = f"u2net_cloth_seg + {model_name}"
    mask, repaired_fabric_holes = restore_reviewed_fabric_mask(mask, source.stem)
    floor_shadow_refined = source.stem in {"sw-001", "sw-001-nude"}
    if floor_shadow_refined:
        reviewed_mask = ImageDraw.Draw(mask)
        reviewed_mask.polygon([(round(x * original.width / 720), round(y * original.height / 900))
                               for x, y in PEARL_HEEL_FLOOR], fill=0)
    try:
        cutout = alpha_matting_cutout(original, mask, 240, 10, 3)
        refinement = "closed-form alpha matting"
    except (ValueError, RuntimeError):
        cutout = decontaminate_cutout(original, mask)
        refinement = "semantic mask + foreground decontamination"
    cutout = clean_alpha(cutout, source.stem.startswith(("sw-", "sp-")))
    bounding = cutout.getchannel("A").getbbox()
    if not bounding:
        raise RuntimeError(f"Empty model result: {source.name}")
    cutout = cutout.crop(bounding)
    alpha = np.asarray(cutout.getchannel("A"))
    if cutout.width < 20 or cutout.height < 20 or np.count_nonzero(alpha) < 300:
        raise RuntimeError(f"Implausibly small model result: {source.name}")
    anchor, shoulder_width = shoulder_anchor(cutout, garment)
    if source.stem == "gw-001" and garment:
        # Manually reviewed shoulder band of the original asymmetrical gown.
        anchor, shoulder_width = {"x": 0.47, "y": 0.045}, 0.32
    solid_bbox = Image.fromarray(np.where(alpha >= 224, 255, 0).astype(np.uint8), "L").getbbox()
    ground_y = (solid_bbox[3] - 1) / max(1, cutout.height - 1) if solid_bbox else 1.0
    return cutout, bounding, {
        "model": model,
        "refinement": refinement,
        "subjectType": "photographed-clothing-only" if garment else "photographed-subject",
        "foregroundFallbackReason": "Hands occlude fabric; preserve actual photographed subject instead of inventing missing cloth" if fallback else None,
        "geometryReconstructed": False,
        "reviewedFabricHolesRestored": repaired_fabric_holes,
        "reviewedFloorShadowRemoved": floor_shadow_refined,
        "anchor": anchor,
        "anchorMethod": "upper silhouette shoulder-band estimate",
        "shoulderWidth": shoulder_width,
        "groundAnchor": {"x": 0.5, "y": round(ground_y, 6)},
        "solidAlphaBBox": list(solid_bbox) if solid_bbox else None,
        "sourceDimensions": list(original.size),
        "alphaBBox": [0, 0, cutout.width, cutout.height],
        "bottomAlphaPixels": int(np.count_nonzero(alpha[-1])),
        "bottomMaxAlpha": int(alpha[-1].max()),
        "transparentPixelFraction": round(float(np.count_nonzero(alpha == 0) / alpha.size), 5),
        "opaquePixelFraction": round(float(np.count_nonzero(alpha >= 248) / alpha.size), 5),
    }


def make_contact_sheet(paths: list[Path], target: Path) -> None:
    tile_width, tile_height, columns = 210, 270, 6
    rows = (len(paths) + columns - 1) // columns
    sheet = Image.new("RGB", (tile_width * columns, tile_height * rows), "#e8e6e1")
    draw = ImageDraw.Draw(sheet)
    for index, filename in enumerate(paths):
        left, top = (index % columns) * tile_width, (index // columns) * tile_height
        # Alternating dark/atelier background exposes both light and dark halos.
        colour = "#454745" if index % 2 else "#f5f3ef"
        canvas = Image.new("RGBA", (tile_width - 12, tile_height - 34), colour)
        image = Image.open(filename).convert("RGBA")
        image.thumbnail((tile_width - 24, tile_height - 45), Image.Resampling.LANCZOS)
        canvas.alpha_composite(image, ((canvas.width - image.width) // 2, canvas.height - image.height))
        sheet.paste(canvas.convert("RGB"), (left + 6, top + 5))
        draw.text((left + 8, top + tile_height - 24), filename.stem, fill="#181818")
    target.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(target, quality=93)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--only", nargs="*", help="Review only these source stems")
    parser.add_argument("--garments", choices=["cloth", "subject"], default="subject")
    parser.add_argument("--foreground-model", choices=["u2net", "isnet-general-use"], default="isnet-general-use")
    parser.add_argument("--models", type=Path, default=WORK / "cutout-models")
    args = parser.parse_args()
    model_directory = args.models.resolve()
    os.environ["U2NET_HOME"] = str(model_directory)
    ensure_model(args.foreground_model, model_directory)
    if args.garments == "cloth":
        ensure_model("u2net_cloth_seg", model_directory)
    general = new_session(args.foreground_model, providers=["CPUExecutionProvider"])
    cloth = new_session("u2net_cloth_seg", providers=["CPUExecutionProvider"]) if args.garments == "cloth" else None
    raw = ROOT / "assets/images/raw"
    output = ROOT / "assets/images/cutout"
    inputs_by_stem = {}
    # Drive downloads in raw are valid processing inputs when the original local
    # SKU photo is absent. Prefer the existing product source when both exist.
    for directory in [raw, ROOT / "assets/images/products"]:
        for filename in sorted(directory.glob("*")):
            if filename.suffix.lower() in {".png", ".webp", ".jpg", ".jpeg"}:
                inputs_by_stem[filename.stem.lower()] = filename
    inputs = sorted(inputs_by_stem.values(), key=lambda filename: filename.stem)
    if len(inputs) != 60:
        raise RuntimeError(f"Expected 60 original catalogue images; found {len(inputs)}")
    expected_bases = {f"{prefix}-{index:03}" for prefix in ["gw", "jp", "sw", "sp"] for index in range(1, 9)}
    if not expected_bases.issubset({name.stem for name in inputs}):
        raise RuntimeError("The 32 base SKU files are incomplete or unexpected.")
    raw.mkdir(parents=True, exist_ok=True)
    output.mkdir(parents=True, exist_ok=True)
    existing = output / "manifest.json"
    manifest = json.loads(existing.read_text("utf-8")) if existing.exists() and args.only else {}
    entries = manifest.get("entries", {})
    selected = [name for name in inputs if not args.only or name.stem in args.only]
    if args.only and {name.stem for name in selected} != set(args.only):
        raise RuntimeError("Unknown source stem in --only")
    u2net_override = general if args.foreground_model == "u2net" else None
    if args.foreground_model != "u2net" and any(source.stem[:6] in U2NET_OVERRIDE_SKUS for source in selected):
        ensure_model("u2net", model_directory)
        u2net_override = new_session("u2net", providers=["CPUExecutionProvider"])
    written = []
    for index, source in enumerate(selected):
        started = time.monotonic()
        source_hash = digest(source)
        raw_filename = raw / source.name
        if raw_filename.resolve() != source.resolve() and (not raw_filename.exists() or digest(raw_filename) != source_hash):
            shutil.copy2(source, raw_filename)
        use_u2net = source.stem[:6] in U2NET_OVERRIDE_SKUS
        selected_session = u2net_override if use_u2net else general
        selected_model = "u2net" if use_u2net else args.foreground_model
        cutout, bounding, metadata = segment(source, selected_session, cloth, args.garments, selected_model)
        destination = output / f"{source.stem}.png"
        cutout.save(destination, "PNG", optimize=True)
        entry = {
            "file": destination.relative_to(ROOT).as_posix(),
            "raw": raw_filename.relative_to(ROOT).as_posix(),
            "source": source.relative_to(ROOT).as_posix(),
            "sourceSha256": source_hash,
            "outputSha256": digest(destination),
            "width": cutout.width,
            "height": cutout.height,
            "sourceCrop": list(bounding),
            **metadata,
        }
        entries[source.stem] = entry
        # Publish partial metadata atomically so UI work can inspect finished samples.
        checkpoint = {"schemaVersion": 1, "complete": len(entries) == 60, "entries": dict(sorted(entries.items()))}
        temporary_manifest = existing.with_suffix(".json.tmp")
        temporary_manifest.write_text(json.dumps(checkpoint, indent=2) + "\n", "utf-8")
        temporary_manifest.replace(existing)
        metadata_keys = ["anchor", "shoulderWidth", "subjectType", "width", "height", "groundAnchor", "solidAlphaBBox"]
        browser_metadata = {stem: {key: item[key] for key in metadata_keys if key in item} for stem, item in sorted(entries.items())}
        (output / "metadata.js").write_text("window.YASHBI_CUTOUT_META=" + json.dumps(browser_metadata, separators=(",", ":")) + ";\nwindow.dispatchEvent(new Event('yashbi:cutouts-ready'));\n", "utf-8")
        written.append(destination)
        print(f"[{index + 1}/{len(selected)}] {source.stem}: {cutout.width}x{cutout.height}, {metadata['subjectType']}, {time.monotonic() - started:.1f}s", flush=True)
    manifest = {
        "schemaVersion": 1,
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "sourcePhotoCount": 60,
        "baseSkuCount": 32,
        "colourVariantCount": 28,
        "complete": len(entries) == 60,
        "originalsPreserved": True,
        "geometryReconstructed": False,
        "pipeline": "semantic segmentation -> alpha matting -> speck cleanup -> exact nonzero-alpha crop",
        "models": {name: {**spec, "verifiedMd5": digest(model_directory / f"{name}.onnx", "md5")} for name, spec in MODELS.items() if (model_directory / f"{name}.onnx").exists()},
        "versions": {name: importlib.metadata.version(name) for name in ["rembg", "onnxruntime", "Pillow", "numpy", "opencv-python-headless"]},
        "entries": dict(sorted(entries.items())),
    }
    existing.write_text(json.dumps(manifest, indent=2) + "\n", "utf-8")
    label = "sample" if args.only else "all"
    for prefix in ["gw", "jp", "sw", "sp"]:
        group = [name for name in written if name.stem.startswith(prefix + "-")]
        if group:
            make_contact_sheet(group, WORK / "cutout-qa" / f"{prefix}-{label}.jpg")
    print(json.dumps({"complete": manifest["complete"], "outputs": len(entries), "manifest": str(existing), "qa": str(WORK / "cutout-qa")}))


if __name__ == "__main__":
    main()
