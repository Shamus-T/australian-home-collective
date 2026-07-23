from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import re
import subprocess
import tempfile
import textwrap
from collections import defaultdict
from colorsys import rgb_to_hsv
from pathlib import Path
from urllib.parse import urlparse
from xml.etree import ElementTree

import numpy as np
from lxml import html as lxml_html
from PIL import Image, ImageDraw, ImageFont, ImageOps


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".svg"}
SITE_ORIGIN = "https://australianhomecollective.com.au"
RESTORED_GUIDES = [
    "public/images/guides/fridge-dimensions-australia.webp",
    "public/images/guides/dryer-types-australia.webp",
    "public/images/guides/dishwasher-sizes-australia.webp",
    "public/images/guides/cookware-materials-australia.webp",
    "public/images/guides/cordless-stick-vacuums-australia.webp",
    "public/images/guides/robot-vacuum-buying-guide-australia.webp",
    "public/images/guides/bedroom-storage-clear-walkway.webp",
]
CATEGORY_FALLBACKS = {
    "public/images/Nursery-kids.webp",
    "public/images/kitchen.webp",
    "public/images/guides/pet-essentials-home-zones.webp",
    "public/images/laundry.webp",
    "public/images/bathroom.webp",
    "public/images/bedroom.webp",
    "public/images/living-room.webp",
    "public/images/garage.webp",
    "public/images/home-office.webp",
    "public/images/outdoor-garden.webp",
}
SCORE_FIELDS = [
    "topic_relevance",
    "realism",
    "colour_visual_interest",
    "composition",
    "technical_quality",
    "brand_suitability",
]
PHASE_STATUS_DEFAULTS = {
    "KEEP": "FINAL KEEP",
    "RECROP": "RECROP COMPLETED",
    "MINOR EDIT": "MINOR EDIT PENDING",
    "REPLACE": "REPLACEMENT ASSET PENDING",
    "URGENT REPLACEMENT": "REPLACEMENT ASSET PENDING",
}
CONTACT_STATUS_LABELS = {
    "TEMPORARILY REMOVED FROM PUBLIC USE": "REMOVED FROM PUBLIC USE",
    "TEMPORARY SAFE FALLBACK": "TEMPORARY SAFE FALLBACK",
    "REPLACEMENT ASSET PENDING": "REPLACEMENT PENDING",
    "RECROP COMPLETED": "RECROP COMPLETED",
    "MINOR EDIT PENDING": "MINOR EDIT PENDING",
    "FINAL KEEP": "FINAL KEEP",
}


def relative_posix(path: Path, root: Path) -> str:
    return path.relative_to(root).as_posix()


def normalise_image_url(value: str) -> str | None:
    if not value:
        return None
    parsed = urlparse(value)
    if parsed.scheme and parsed.netloc:
        if f"{parsed.scheme}://{parsed.netloc}" != SITE_ORIGIN:
            return None
        image_path = parsed.path
    else:
        image_path = parsed.path
    if not image_path.startswith("/images/"):
        return None
    return f"public{image_path}"


def route_for_dist_file(path: Path, dist_root: Path) -> str:
    relative = relative_posix(path, dist_root)
    if relative == "index.html":
        return "/"
    if relative.endswith("/index.html"):
        return f"/{relative[:-10]}"
    return f"/{relative}"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file_handle:
        for chunk in iter(lambda: file_handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def svg_dimensions(path: Path) -> tuple[int, int]:
    root = ElementTree.parse(path).getroot()

    def number(value: str | None) -> float | None:
        if not value:
            return None
        match = re.search(r"-?\d+(?:\.\d+)?", value)
        return float(match.group()) if match else None

    width = number(root.attrib.get("width"))
    height = number(root.attrib.get("height"))
    if width and height:
        return max(1, round(width)), max(1, round(height))
    view_box = root.attrib.get("viewBox", "").replace(",", " ").split()
    if len(view_box) == 4:
        return max(1, round(float(view_box[2]))), max(1, round(float(view_box[3])))
    return 1200, 675


def render_svg(path: Path, node_executable: str) -> Image.Image:
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as temporary:
        output_path = Path(temporary.name)
    code = (
        "import sharp from 'sharp';"
        "await sharp(process.argv[1], {density: 144})"
        ".resize({width: 1600, withoutEnlargement: true})"
        ".png().toFile(process.argv[2]);"
    )
    try:
        subprocess.run(
            [node_executable, "--input-type=module", "-e", code, str(path), str(output_path)],
            check=True,
            capture_output=True,
            text=True,
        )
        with Image.open(output_path) as rendered:
            return rendered.convert("RGB")
    finally:
        output_path.unlink(missing_ok=True)


def open_image(path: Path, node_executable: str) -> Image.Image:
    if path.suffix.lower() == ".svg":
        return render_svg(path, node_executable)
    with Image.open(path) as image:
        image.load()
        if "A" in image.getbands():
            background = Image.new("RGBA", image.size, "white")
            background.alpha_composite(image.convert("RGBA"))
            return background.convert("RGB")
        return image.convert("RGB")


def perceptual_hash(image: Image.Image) -> int:
    sample = np.asarray(image.convert("L").resize((32, 32), Image.Resampling.LANCZOS), dtype=np.float64)
    size = sample.shape[0]
    coordinates = np.arange(size)
    frequencies = np.arange(size)[:, None]
    transform = np.cos((math.pi / size) * (coordinates + 0.5) * frequencies)
    transform[0, :] *= 1 / math.sqrt(2)
    transform *= math.sqrt(2 / size)
    dct = transform @ sample @ transform.T
    low_frequency = dct[:8, :8]
    median = np.median(low_frequency.flatten()[1:])
    bits = low_frequency > median
    value = 0
    for bit in bits.flatten():
        value = (value << 1) | int(bit)
    return value


def hash_distance(first: int, second: int) -> int:
    return (first ^ second).bit_count()


def colour_diagnostics(image: Image.Image) -> tuple[str, list[str], dict[str, float]]:
    sample = image.resize((96, 96), Image.Resampling.BILINEAR).convert("RGB")
    quantised = sample.quantize(colors=6, method=Image.Quantize.MEDIANCUT).convert("RGB")
    colours = quantised.getcolors(maxcolors=96 * 96) or []
    colours.sort(reverse=True)
    dominant = [
        f"#{red:02x}{green:02x}{blue:02x}:{count / (96 * 96):.0%}"
        for count, (red, green, blue) in colours[:5]
    ]

    signals = defaultdict(int)
    considered = 0
    for red, green, blue in sample.get_flattened_data():
        red_f, green_f, blue_f = red / 255, green / 255, blue / 255
        hue, saturation, value = rgb_to_hsv(red_f, green_f, blue_f)
        hue_degrees = hue * 360
        if value < 0.08 or value > 0.98:
            continue
        considered += 1
        if saturation < 0.13 and 0.20 < value < 0.93:
            signals["grey"] += 1
        if 25 <= hue_degrees <= 58 and saturation < 0.32 and value > 0.62:
            signals["beige_or_cream"] += 1
        if 75 <= hue_degrees <= 165 and 0.10 <= saturation <= 0.48 and value < 0.78:
            signals["dull_green"] += 1
        if 12 <= hue_degrees <= 48 and saturation >= 0.24 and value < 0.66:
            signals["brown"] += 1
        if 205 <= hue_degrees <= 250 and saturation >= 0.48 and 0.28 <= value <= 0.90:
            signals["cobalt_blue"] += 1
        if (hue_degrees <= 24 or hue_degrees >= 345) and saturation >= 0.34 and 0.40 <= value <= 0.92:
            signals["coral_or_terracotta"] += 1
        if 18 <= hue_degrees <= 52 and saturation >= 0.22 and value >= 0.38:
            signals["warm_orange_grade"] += 1

    percentages = {
        key: round(value / max(1, considered), 3)
        for key, value in sorted(signals.items())
    }
    flags = []
    thresholds = {
        "grey": 0.24,
        "beige_or_cream": 0.18,
        "dull_green": 0.16,
        "brown": 0.18,
        "cobalt_blue": 0.12,
        "coral_or_terracotta": 0.10,
        "warm_orange_grade": 0.30,
    }
    for key, threshold in thresholds.items():
        if percentages.get(key, 0) >= threshold:
            flags.append(key)
    return " | ".join(dominant), flags, percentages


def source_references(root: Path, image_paths: set[str]) -> dict[str, list[dict[str, str]]]:
    references: dict[str, list[dict[str, str]]] = defaultdict(list)
    source_files = [
        path
        for base in ("src",)
        for path in (root / base).rglob("*")
        if path.is_file() and path.suffix.lower() in {".astro", ".ts", ".js", ".mjs"}
    ]
    image_pattern = re.compile(r"""["'](/images/[^"'?#]+\.(?:jpe?g|png|webp|svg))(?:\?[^"']*)?["']""", re.I)
    alt_patterns = [
        re.compile(r"""imageAlt\s*[:=]\s*["']([^"']+)["']""", re.I),
        re.compile(r"""socialImageAlt\s*[:=]\s*["']([^"']+)["']""", re.I),
        re.compile(r"""\balt\s*[:=]\s*["']([^"']+)["']""", re.I),
    ]
    for source_file in source_files:
        text = source_file.read_text(encoding="utf-8")
        for match in image_pattern.finditer(text):
            public_path = f"public{match.group(1)}"
            if public_path not in image_paths:
                continue
            line = text.count("\n", 0, match.start()) + 1
            nearby = text[match.start() : min(len(text), match.start() + 500)]
            alt = ""
            for pattern in alt_patterns:
                alt_match = pattern.search(nearby)
                if alt_match:
                    alt = alt_match.group(1)
                    break
            references[public_path].append(
                {
                    "context": f"source {relative_posix(source_file, root)}:{line}",
                    "kind": "source_literal",
                    "alt": alt,
                }
            )
    return references


def built_references(root: Path, image_paths: set[str]) -> dict[str, list[dict[str, str]]]:
    references: dict[str, list[dict[str, str]]] = defaultdict(list)
    dist_root = root / "dist"
    for html_file in sorted(dist_root.rglob("*.html")):
        route = route_for_dist_file(html_file, dist_root)
        document = lxml_html.fromstring(html_file.read_text(encoding="utf-8"))
        for image_node in document.xpath("//img[@src]"):
            public_path = normalise_image_url(image_node.get("src", ""))
            if not public_path or public_path not in image_paths:
                continue
            classes = set((image_node.get("class") or "").split())
            if "header-image" in classes:
                kind = "hero"
            elif "guide-card-image" in classes or image_node.getparent() is not None and image_node.getparent().tag == "picture":
                kind = "card_or_brand"
            else:
                kind = "inline"
            references[public_path].append(
                {
                    "context": f"route {route}",
                    "kind": kind,
                    "alt": image_node.get("alt", ""),
                }
            )
        for source_node in document.xpath("//source[@srcset]"):
            public_path = normalise_image_url(source_node.get("srcset", "").split()[0])
            if not public_path or public_path not in image_paths:
                continue
            references[public_path].append(
                {
                    "context": f"route {route}",
                    "kind": "responsive_source",
                    "alt": "",
                }
            )
        og_nodes = document.xpath("//meta[@property='og:image']/@content")
        og_alt_nodes = document.xpath("//meta[@property='og:image:alt']/@content")
        if og_nodes:
            public_path = normalise_image_url(og_nodes[0])
            if public_path and public_path in image_paths:
                references[public_path].append(
                    {
                        "context": f"route {route}",
                        "kind": "open_graph",
                        "alt": og_alt_nodes[0] if og_alt_nodes else "",
                    }
                )
    return references


def load_assessments(path: Path) -> dict[str, dict]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def font(path: str, size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default()


def make_contact_sheet(
    output_path: Path,
    title: str,
    records: list[dict],
    images: dict[str, Image.Image],
    regular_font_path: str,
    bold_font_path: str,
) -> None:
    if not records:
        return
    columns = 4
    cell_width = 390
    thumbnail_width = 350
    thumbnail_height = 235
    label_height = 82
    cell_height = thumbnail_height + label_height
    margin = 28
    header_height = 76
    rows = math.ceil(len(records) / columns)
    canvas = Image.new(
        "RGB",
        (margin * 2 + columns * cell_width, header_height + margin + rows * cell_height + margin),
        "#f7f7f5",
    )
    draw = ImageDraw.Draw(canvas)
    title_font = font(bold_font_path, 30)
    label_font = font(regular_font_path, 18)
    detail_font = font(regular_font_path, 14)
    draw.text((margin, 22), title, fill="#181818", font=title_font)

    for index, record in enumerate(records):
        row, column = divmod(index, columns)
        x = margin + column * cell_width
        y = header_height + margin + row * cell_height
        draw.rounded_rectangle(
            (x, y, x + cell_width - 16, y + cell_height - 14),
            radius=8,
            fill="white",
            outline="#d5d5d1",
            width=1,
        )
        source = images[record["file_path"]].copy()
        thumbnail = ImageOps.contain(source, (thumbnail_width, thumbnail_height), Image.Resampling.LANCZOS)
        image_x = x + (cell_width - 16 - thumbnail.width) // 2
        image_y = y + (thumbnail_height - thumbnail.height) // 2
        canvas.paste(thumbnail, (image_x, image_y))
        label_y = y + thumbnail_height + 7
        wrapped = textwrap.wrap(record["file_name"], width=38)[:2]
        for line_index, line in enumerate(wrapped):
            draw.text((x + 12, label_y + line_index * 21), line, fill="#111111", font=label_font)
        detail_y = label_y + len(wrapped) * 21 + 4
        display_status = CONTACT_STATUS_LABELS.get(record["phase_1_status"], record["phase_1_status"])
        detail = f'{record["width"]}×{record["height"]} · {record["format"].upper()} · {display_status}'
        draw.text((x + 12, detail_y), detail, fill="#555555", font=detail_font)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output_path, "JPEG", quality=92, optimize=True)


def paginate_contact_sheets(
    output_directory: Path,
    groups: list[tuple[str, list[dict]]],
    images: dict[str, Image.Image],
    regular_font_path: str,
    bold_font_path: str,
) -> list[Path]:
    created = []
    sheet_number = 1
    for group_title, records in groups:
        for start in range(0, len(records), 24):
            page = records[start : start + 24]
            output_path = output_directory / f"contact-sheet-{sheet_number:02d}.jpg"
            make_contact_sheet(
                output_path,
                f"{group_title} · {start + 1}–{start + len(page)} of {len(records)}",
                page,
                images,
                regular_font_path,
                bold_font_path,
            )
            created.append(output_path)
            sheet_number += 1
    return created


def main() -> None:
    parser = argparse.ArgumentParser(description="Build the Australian Home Collective image audit inventory.")
    parser.add_argument("--root", default=".", help="Repository root")
    parser.add_argument("--node", default="node", help="Node.js executable used to render SVG files")
    parser.add_argument("--font", default=r"C:\Windows\Fonts\arial.ttf")
    parser.add_argument("--bold-font", default=r"C:\Windows\Fonts\arialbd.ttf")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    images_root = root / "public" / "images"
    visual_root = root / "docs" / "visual"
    contact_root = visual_root / "contact-sheets"
    assessments_path = visual_root / "image-assessments.json"
    inventory_path = visual_root / "image-inventory.csv"
    diagnostics_path = visual_root / "image-analysis.json"

    image_files = sorted(
        path for path in images_root.rglob("*") if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    )
    image_paths = {relative_posix(path, root) for path in image_files}
    source_usage = source_references(root, image_paths)
    built_usage = built_references(root, image_paths)
    assessments = load_assessments(assessments_path)

    opened_images: dict[str, Image.Image] = {}
    records: list[dict] = []
    for image_file in image_files:
        file_path = relative_posix(image_file, root)
        opened = open_image(image_file, args.node)
        opened_images[file_path] = opened
        width, height = svg_dimensions(image_file) if image_file.suffix.lower() == ".svg" else opened.size
        dominant_colours, palette_flags, palette_percentages = colour_diagnostics(opened)
        usages = built_usage.get(file_path, []) + source_usage.get(file_path, [])
        deduplicated_usage = []
        seen_usage = set()
        for usage in usages:
            key = (usage["context"], usage["kind"], usage["alt"])
            if key not in seen_usage:
                deduplicated_usage.append(usage)
                seen_usage.add(key)
        public_usage = [usage for usage in deduplicated_usage if usage["context"].startswith("route ")]
        public_routes = sorted({usage["context"].removeprefix("route ") for usage in public_usage})
        alt_texts = sorted({usage["alt"] for usage in deduplicated_usage if usage["alt"]})
        assessment = assessments.get(file_path, {})
        quality_status = assessment.get("status", "PENDING")
        phase_1_status = assessment.get(
            "phase_1_status",
            PHASE_STATUS_DEFAULTS.get(quality_status, "NOT IN PHASE 1"),
        )
        scores = {field: assessment.get(field, "") for field in SCORE_FIELDS}
        numeric_scores = [value for value in scores.values() if isinstance(value, (int, float))]
        record = {
            "file_path": file_path,
            "file_name": image_file.name,
            "format": image_file.suffix.lower().removeprefix("."),
            "width": width,
            "height": height,
            "aspect_ratio": round(width / height, 4),
            "file_size_bytes": image_file.stat().st_size,
            "sha256": sha256(image_file),
            "perceptual_hash": f"{perceptual_hash(opened):016x}",
            "usages": deduplicated_usage,
            "public_routes": public_routes,
            "alt_texts": alt_texts,
            "number_of_uses": len(deduplicated_usage),
            "public_route_count": len(public_routes),
            "unique_or_reused": "reused" if len(public_routes) > 1 else "unique",
            "is_category_fallback": file_path in CATEGORY_FALLBACKS,
            "used_in_open_graph": any(usage["kind"] == "open_graph" for usage in deduplicated_usage),
            "dominant_colours": dominant_colours,
            "palette_flags": palette_flags,
            "palette_percentages": palette_percentages,
            "status": quality_status,
            "phase_1_status": phase_1_status,
            "phase_1_note": assessment.get("phase_1_note", ""),
            **scores,
            "average_score": round(sum(numeric_scores) / len(numeric_scores), 2) if numeric_scores else "",
            "assessment_notes": assessment.get("notes", ""),
            "priority": assessment.get("priority", ""),
            "recommended_concept": assessment.get("recommended_concept", ""),
            "important_objects": assessment.get("important_objects", ""),
            "avoid": assessment.get("avoid", ""),
            "suggested_alt_text": assessment.get("suggested_alt_text", ""),
        }
        records.append(record)

    exact_groups = []
    by_digest = defaultdict(list)
    for record in records:
        by_digest[record["sha256"]].append(record["file_path"])
    for paths in by_digest.values():
        if len(paths) > 1:
            exact_groups.append(sorted(paths))

    near_pairs = []
    for index, first in enumerate(records):
        first_hash = int(first["perceptual_hash"], 16)
        for second in records[index + 1 :]:
            if first["sha256"] == second["sha256"]:
                continue
            distance = hash_distance(first_hash, int(second["perceptual_hash"], 16))
            if distance <= 8:
                near_pairs.append(
                    {
                        "first": first["file_path"],
                        "second": second["file_path"],
                        "distance": distance,
                    }
                )

    exact_lookup = {}
    for group_index, paths in enumerate(exact_groups, start=1):
        for path in paths:
            exact_lookup[path] = f"exact-{group_index:02d}"
    near_lookup = defaultdict(list)
    for pair_index, pair in enumerate(near_pairs, start=1):
        label = f"near-{pair_index:02d}"
        near_lookup[pair["first"]].append(label)
        near_lookup[pair["second"]].append(label)

    fieldnames = [
        "file_path",
        "file_name",
        "format",
        "width",
        "height",
        "aspect_ratio",
        "file_size_bytes",
        "page_or_component_uses",
        "alt_texts",
        "number_of_uses",
        "public_route_count",
        "unique_or_reused",
        "is_category_fallback",
        "used_in_open_graph",
        "exact_duplicate_group",
        "near_duplicate_groups",
        "dominant_colours",
        "palette_flags",
        "status",
        "phase_1_status",
        "phase_1_note",
        *SCORE_FIELDS,
        "average_score",
        "assessment_notes",
    ]
    visual_root.mkdir(parents=True, exist_ok=True)
    with inventory_path.open("w", encoding="utf-8-sig", newline="") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        for record in records:
            writer.writerow(
                {
                    **{field: record.get(field, "") for field in fieldnames},
                    "page_or_component_uses": " || ".join(
                        f'{usage["context"]} [{usage["kind"]}]'
                        + (f' alt="{usage["alt"]}"' if usage["alt"] else "")
                        for usage in record["usages"]
                    ),
                    "alt_texts": " || ".join(record["alt_texts"]),
                    "exact_duplicate_group": exact_lookup.get(record["file_path"], ""),
                    "near_duplicate_groups": " | ".join(near_lookup.get(record["file_path"], [])),
                    "palette_flags": " | ".join(record["palette_flags"]),
                }
            )

    diagnostics = {
        "generated_from_head": subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=root,
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip(),
        "total_image_count": len(records),
        "unique_binary_image_count": len(by_digest),
        "exact_duplicate_groups": exact_groups,
        "near_duplicate_pairs": near_pairs,
        "records": records,
    }
    diagnostics_path.write_text(json.dumps(diagnostics, indent=2, ensure_ascii=False), encoding="utf-8")

    root_records = [record for record in records if Path(record["file_path"]).parent.as_posix() == "public/images"]
    social_records = [record for record in records if record["file_path"].startswith("public/images/social/")]
    guide_records = [record for record in records if record["file_path"].startswith("public/images/guides/")]
    paginate_contact_sheets(
        contact_root,
        [("Root and publication images", root_records), ("Social images", social_records), ("Guide images", guide_records)],
        opened_images,
        args.font,
        args.bold_font,
    )

    def records_for_paths(paths: set[str] | list[str]) -> list[dict]:
        wanted = set(paths)
        return [record for record in records if record["file_path"] in wanted]

    homepage_category_paths = {
        normalise_image_url(node.get("src", ""))
        for html_path in [root / "dist" / "index.html", *sorted((root / "dist" / "categories").rglob("index.html"))]
        for node in lxml_html.fromstring(html_path.read_text(encoding="utf-8")).xpath("//img[@src]")
    }
    homepage_category_paths.discard(None)
    featured_paths = {
        normalise_image_url(node.get("src", ""))
        for node in lxml_html.fromstring((root / "dist" / "guides" / "index.html").read_text(encoding="utf-8")).xpath("//img[@src]")
    }
    featured_paths.discard(None)
    focused_groups = [
        (
            "contact-sheet-homepage-categories.jpg",
            "Homepage and category images",
            records_for_paths(homepage_category_paths),
        ),
        (
            "contact-sheet-featured-guides.jpg",
            "Featured guide images",
            records_for_paths(featured_paths),
        ),
        (
            "contact-sheet-restored-guides.jpg",
            "Restored guides: seven images and one text-only card",
            records_for_paths(RESTORED_GUIDES),
        ),
        (
            "contact-sheet-generic-fallbacks.jpg",
            "Generic and reused category fallbacks",
            [record for record in records if record["is_category_fallback"] and record["public_route_count"] > 1],
        ),
    ]
    for file_name, title, group_records in focused_groups:
        make_contact_sheet(
            contact_root / file_name,
            title,
            group_records,
            opened_images,
            args.font,
            args.bold_font,
        )

    print(f"Inventory written: {inventory_path}")
    print(f"Diagnostics written: {diagnostics_path}")
    print(f"Images inventoried: {len(records)}")
    print(f"Exact duplicate groups: {len(exact_groups)}")
    print(f"Near-duplicate pairs: {len(near_pairs)}")
    print(f"Pending assessments: {sum(record['status'] == 'PENDING' for record in records)}")


if __name__ == "__main__":
    main()
