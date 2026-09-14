from __future__ import annotations

from io import BytesIO
from pathlib import Path

import qrcode
from pypdf import PdfReader, PdfWriter, Transformation
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = ROOT / "public" / "downloads"
BASE = "https://australianhomecollective.com.au/guides"

TARGETS = {
    "dishwasher-measurement-worksheet.pdf": f"{BASE}/dishwasher-sizes-australia/",
    "fridge-measurement-worksheet.pdf": f"{BASE}/fridge-dimensions-australia/",
    "rangehood-measurement-worksheet.pdf": f"{BASE}/rangehood-buying-guide-australia/",
    "robot-lawn-mower-yard-assessment.pdf": f"{BASE}/robot-lawn-mower-buying-guide-australia/",
    "washing-machine-measurement-worksheet.pdf": f"{BASE}/washing-machine-and-dryer-space-what-to-measure-before-buying-storage/",
    "australian-spring-home-maintenance-checklist.pdf": f"{BASE}/spring-home-maintenance-checklist/",
}


def qr_png(url: str) -> BytesIO:
    qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=8, border=3)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


def footer_overlay(width: float, height: float, url: str) -> BytesIO:
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=(width, height))
    qr_size = 54
    x = width - 42 - qr_size
    y = 9
    c.setStrokeColorRGB(0.82, 0.84, 0.82)
    c.setLineWidth(0.6)
    c.line(36, 70, width - 36, 70)
    c.drawImage(ImageReader(qr_png(url)), x, y, qr_size, qr_size, preserveAspectRatio=True, mask="auto")
    c.setFillColorRGB(0.12, 0.20, 0.16)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(42, 48, "Scan for the full guide and latest updates")
    c.setFillColorRGB(0.30, 0.34, 0.31)
    c.setFont("Helvetica", 6.8)
    c.drawString(42, 34, url)
    c.setFont("Helvetica", 6.5)
    c.drawString(42, 20, "Australian Home Collective")
    c.save()
    buf.seek(0)
    return buf


def stamp_pdf(path: Path, url: str) -> bool:
    reader = PdfReader(str(path))
    if reader.metadata and reader.metadata.get("/AHCQRTarget") == url:
        print(f"OK already stamped: {path.name}")
        return False

    writer = PdfWriter()
    for page in reader.pages:
        width = float(page.mediabox.width)
        height = float(page.mediabox.height)
        footer_h = 78.0
        usable_h = height - footer_h
        scale = usable_h / height
        x_offset = (width - width * scale) / 2
        page.add_transformation(Transformation().scale(scale, scale).translate(x_offset, footer_h))
        overlay = PdfReader(footer_overlay(width, height, url)).pages[0]
        page.merge_page(overlay)
        writer.add_page(page)

    metadata = dict(reader.metadata or {})
    metadata["/AHCQRTarget"] = url
    metadata["/AHCPrintableStandard"] = "QR-v1"
    writer.add_metadata({str(k): str(v) for k, v in metadata.items() if v is not None})

    tmp = path.with_suffix(".tmp.pdf")
    with tmp.open("wb") as f:
        writer.write(f)
    tmp.replace(path)
    print(f"Stamped: {path.name} -> {url}")
    return True


def main() -> None:
    pdfs = {p.name for p in DOWNLOADS.glob("*.pdf")}
    mapped = set(TARGETS)
    missing_map = sorted(pdfs - mapped)
    missing_file = sorted(mapped - pdfs)
    if missing_map or missing_file:
        raise SystemExit(f"PDF mapping mismatch. Unmapped PDFs: {missing_map}; missing mapped files: {missing_file}")

    changed = 0
    for filename, url in TARGETS.items():
        changed += stamp_pdf(DOWNLOADS / filename, url)
    print(f"QR PDF pass complete; {changed} file(s) updated.")


if __name__ == "__main__":
    main()
