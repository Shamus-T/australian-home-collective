"""Build AHC's two printable, one-page A4 appliance measurement records.

Requires ReportLab. Run from any directory with:
    python scripts/build-appliance-measurement-worksheets.py

Final PDFs are written to output/pdf/ and copied to public/downloads/.
The sheets deliberately leave model dimensions and required spaces blank:
those values must come from the exact model's current installation manual.
"""

from pathlib import Path
import shutil

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf"
DOWNLOADS = ROOT / "public" / "downloads"
PAGE_W, PAGE_H = A4
MARGIN = 35
WIDTH = PAGE_W - MARGIN * 2
FOREST = HexColor("#244c3d")
INK = HexColor("#26372e")
MUTED = HexColor("#59655d")
CREAM = HexColor("#f7f4ec")
RULE = HexColor("#aab2ab")
ACCENT = HexColor("#b76634")


def text(c, x, y, value, size=9, bold=False, color=INK):
    c.setFillColor(color)
    c.setFont("Helvetica-Bold" if bold else "Helvetica", size)
    c.drawString(x, PAGE_H - y, value)


def line(c, x1, y1, x2, y2, color=RULE, width=0.5):
    c.setStrokeColor(color)
    c.setLineWidth(width)
    c.line(x1, PAGE_H - y1, x2, PAGE_H - y2)


def rect(c, x, y, w, h, fill=None, stroke=RULE):
    if fill:
        c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(0.5)
    c.rect(x, PAGE_H - y - h, w, h, stroke=1, fill=bool(fill))


def wrapped(c, value, x, y, max_width, size=8.4, leading=11, color=INK):
    words = value.split()
    current = ""
    for word in words:
        proposed = f"{current} {word}".strip()
        if current and c.stringWidth(proposed, "Helvetica", size) > max_width:
            text(c, x, y, current, size=size, color=color)
            y += leading
            current = word
        else:
            current = proposed
    if current:
        text(c, x, y, current, size=size, color=color)
        y += leading
    return y


def heading(c, y, number, title, aside=""):
    text(c, MARGIN, y, number, size=10, bold=True, color=ACCENT)
    text(c, MARGIN + 20, y, title, size=10, bold=True, color=FOREST)
    if aside:
        c.setFont("Helvetica", 8)
        aside_width = c.stringWidth(aside, "Helvetica", 8)
        text(c, PAGE_W - MARGIN - aside_width, y, aside, size=8, color=MUTED)
    line(c, MARGIN, y + 6, PAGE_W - MARGIN, y + 6, color=FOREST)


def field_row(c, y, labels, height=34, fractions=None):
    fractions = fractions or [1 / len(labels)] * len(labels)
    x = MARGIN
    for label, fraction in zip(labels, fractions):
        width = WIDTH * fraction
        rect(c, x, y, width, height)
        text(c, x + 8, y + 12, label, size=8, color=MUTED)
        x += width


def note_rows(c, y, labels, height=27):
    for label in labels:
        text(c, MARGIN, y + 10, label, size=8.4)
        line(c, MARGIN, y + height - 3, PAGE_W - MARGIN, y + height - 3)
        y += height
    return y


def header(c, appliance, subtitle):
    text(c, MARGIN, 35, "AUSTRALIAN HOME COLLECTIVE", size=9, bold=True, color=FOREST)
    text(c, PAGE_W - MARGIN - 88, 35, "FREE PRINTABLE  /  A4", size=7.2, color=MUTED)
    text(c, MARGIN, 66, f"{appliance} measurement sheet", size=22, bold=True, color=FOREST)
    text(c, MARGIN, 85, subtitle, size=9.1)
    rect(c, MARGIN, 98, WIDTH, 32, fill=CREAM, stroke=CREAM)
    text(c, MARGIN + 10, 111, "Record every measurement in millimetres (mm).", size=8.7, bold=True)
    text(c, MARGIN + 10, 123, "A measurement record, not installation approval. Check the exact manual and your installer.", size=8.2)


def model_section(c):
    heading(c, 151, "01", "Record the exact appliance and source")
    field_row(c, 164, ["Brand + full model code", "Date measured / measured by"], height=35, fractions=[0.62, 0.38])
    field_row(c, 199, ["Installation manual: title / version / page or saved link", "Manual checked on (date)"], height=35, fractions=[0.72, 0.28])


def cavity_section(c, dishwasher=False):
    heading(c, 257, "02", "Measure the finished opening", "Record the tightest usable space")
    text(c, MARGIN, 277, "Check width and height at the front, middle and rear; note sloping or out-of-square surfaces.", size=8.4)
    field_row(c, 287, ["Smallest clear width (mm)", "Smallest floor-to-top height (mm)", "Usable depth to obstruction (mm)"], height=37)
    field_row(c, 324, ["Obstructions / floor level / trim to allow for"], height=32)


def product_section(c, dishwasher=False):
    heading(c, 379, "03", "Copy the exact model's installation requirements")
    text(c, MARGIN, 399, "Record published overall dimensions and required cavity dimensions as separate measurements.", size=8.4)
    field_row(c, 409, ["Published overall width (mm)", "Published overall height (mm)", "Published overall depth (mm)"], height=34)
    field_row(c, 443, ["Required cavity W x H x D (mm)", "Required spaces: sides / rear / top (mm)"], height=36)
    dimension_note = (
        "Fascia or projections may sit outside the cavity. Confirm the installed fit using the exact drawing."
        if dishwasher
        else "Use the manual's dimension definitions; record handles, hoses and projections separately below."
    )
    text(c, MARGIN, 490, dimension_note, size=8)


def operation_section(c, dishwasher=False):
    heading(c, 513, "04", "Check opening, connections and operating space")
    if dishwasher:
        rows = [
            "Open door + extended rack reach (mm) / remaining walkway (mm):",
            "Inlet, drain + power route / usable reach / connection location:",
            "Adjustable-foot height range (mm) / level floor / fixing / panel + kickboard checks:",
        ]
    else:
        rows = [
            "Door or lid fully open: total depth or height (mm) / remaining access (mm):",
            "Inlet, drain + power route / usable reach / rear projections (mm):",
            "Level floor + foot adjustment / if stacking: approved models, kit + total height (mm):",
        ]
    note_rows(c, 527, rows, height=28)


def delivery_section(c):
    heading(c, 638, "05", "Measure the whole delivery route")
    field_row(c, 651, ["Packaged delivery W x H x D (mm)", "Narrowest doorway / hall W x H (mm)"], height=36)
    note_rows(c, 692, ["Tight turns, stairs, lift, landings, thresholds / access confirmed with retailer:"], height=27)


def final_section(c):
    text(c, MARGIN, 738, "BEFORE YOU ORDER", size=8.4, bold=True, color=FOREST)
    text(c, MARGIN + 122, 738, "Resolve missing measurements with the retailer or installer.", size=8.4)
    note_rows(c, 746, ["Unresolved checks / who will confirm:"], height=25)


def footer(c, category):
    line(c, MARGIN, 788, PAGE_W - MARGIN, 788)
    label = f"australianhomecollective.com.au/categories/{category}/"
    text(c, MARGIN, 803, label, size=8, color=FOREST)
    c.linkURL(f"https://{label}", (MARGIN, PAGE_H - 808, MARGIN + 310, PAGE_H - 794), relative=0)
    text(c, PAGE_W - MARGIN - 59, 803, "AHC  /  1 of 1", size=7.7, color=MUTED)


def make_sheet(filename, appliance, subtitle, category, dishwasher=False):
    path = OUTPUT / filename
    c = canvas.Canvas(str(path), pagesize=A4, pageCompression=1, invariant=1)
    c.setTitle(f"{appliance} Measurement Worksheet | Australian Home Collective")
    c.setAuthor("Australian Home Collective")
    c.setSubject("Printable A4 appliance measurement record. All measurements in millimetres.")
    c.setCreator("Australian Home Collective")
    header(c, appliance, subtitle)
    model_section(c)
    cavity_section(c, dishwasher)
    product_section(c, dishwasher)
    operation_section(c, dishwasher)
    delivery_section(c)
    final_section(c)
    footer(c, category)
    c.showPage()
    c.save()
    destination = DOWNLOADS / filename
    shutil.copyfile(path, destination)
    print(destination.relative_to(ROOT))


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    DOWNLOADS.mkdir(parents=True, exist_ok=True)
    make_sheet(
        "washing-machine-measurement-worksheet.pdf",
        "Washing machine",
        "Take this sheet to the laundry, then compare it with the exact installation manual.",
        "laundry",
    )
    make_sheet(
        "dishwasher-measurement-worksheet.pdf",
        "Dishwasher",
        "Measure the finished kitchen cavity before choosing a dishwasher format or model.",
        "kitchen",
        dishwasher=True,
    )


if __name__ == "__main__":
    main()
