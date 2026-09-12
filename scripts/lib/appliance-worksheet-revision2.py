"""Draw the shared branded layout for AHC's one-page appliance worksheets."""

import importlib.util
from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from PIL import Image

LOGO_PATH = Path(__file__).resolve().parents[2] / "public" / "images" / "header-title.png"

DIAGRAM_PATH = Path(__file__).with_name("appliance-worksheet-diagram.py")
_spec = importlib.util.spec_from_file_location("appliance_cavity_diagram", DIAGRAM_PATH)
_diagram = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_diagram)

PAGE_W, PAGE_H = A4
MARGIN = 34
WIDTH = PAGE_W - 2 * MARGIN
INK = HexColor("#26372e")
FOREST = HexColor("#244c3d")
RULE = HexColor("#87978e")
CREAM = HexColor("#f7f4ec")
BODY_SIZE = 10.5


def text(c, x, y, value, size=BODY_SIZE, bold=False, color=INK):
    c.setFillColor(color)
    c.setFont("Helvetica-Bold" if bold else "Helvetica", size)
    c.drawString(x, PAGE_H - y, value)


def line(c, x1, y1, x2, y2, color=RULE, width=0.6):
    c.setStrokeColor(color)
    c.setLineWidth(width)
    c.line(x1, PAGE_H - y1, x2, PAGE_H - y2)


def box(c, x, y, width, height, fill=None):
    c.setStrokeColor(RULE)
    c.setLineWidth(0.6)
    c.setFillColor(fill or white)
    c.rect(x, PAGE_H - y - height, width, height, stroke=1, fill=bool(fill))


def wrapped(c, value, x, y, width, size=BODY_SIZE, leading=13):
    current = ""
    for word in value.split():
        proposed = f"{current} {word}".strip()
        if current and c.stringWidth(proposed, "Helvetica", size) > width:
            text(c, x, y, current, size=size)
            y += leading
            current = word
        else:
            current = proposed
    if current:
        text(c, x, y, current, size=size)
        y += leading
    return y


def heading(c, y, number, title):
    text(c, MARGIN, y, f"{number}  {title}", size=12, bold=True, color=FOREST)
    line(c, MARGIN, y + 6, PAGE_W - MARGIN, y + 6, color=FOREST, width=0.8)


def fields(c, y, labels, height=37, fractions=None):
    fractions = fractions or [1 / len(labels)] * len(labels)
    x = MARGIN
    for label, fraction in zip(labels, fractions):
        width = WIDTH * fraction
        box(c, x, y, width, height)
        text(c, x + 8, y + 14, label)
        x += width


def note_row(c, y, label):
    text(c, MARGIN, y, label)
    line(c, MARGIN, y + 17, PAGE_W - MARGIN, y + 17)


def draw_sheet(c, appliance, category, dishwasher=False, fridge=False):
    # Use the existing site logo, retaining its proportions and transparency.
    with Image.open(LOGO_PATH) as source:
        logo = source.convert("RGBA")
        logo = logo.crop(logo.getchannel("A").getbbox())
    logo_width = 126
    logo_height = logo_width * logo.height / logo.width
    c.drawImage(ImageReader(logo), MARGIN, PAGE_H - 8 - logo_height,
                width=logo_width, height=logo_height, mask="auto")
    printable_label = "FREE A4 WORKSHEET"
    text(c, PAGE_W - MARGIN - c.stringWidth(printable_label, "Helvetica", 9), 30, printable_label, size=9)
    text(c, MARGIN, 72, f"{appliance} measurement sheet", size=22, bold=True, color=FOREST)
    text(c, MARGIN, 88, "Measure the actual cavity, not the old appliance.", size=11.5, bold=True)
    text(c, MARGIN, 104, "Write every measurement in millimetres (mm).")
    fields(c, 116, ["Brand and full model code"], height=35)

    heading(c, 171, "01", "Measure the space in your home")
    text(c, MARGIN, 190, "Diagram shows directions only. Measure the actual cavity.")
    text(c, MARGIN, 204, "Record its smallest clear width, height and usable depth below.")
    _diagram.draw_appliance_diagram(c, MARGIN, PAGE_H - 385, width=250, height=180,
                                    dishwasher=dishwasher, fridge=fridge)
    sketch_x = MARGIN + 276
    sketch_width = WIDTH - 276
    box(c, sketch_x, 217, sketch_width, 166)
    text(c, sketch_x + 10, 229, "Sketch your layout", size=11, bold=True)
    sketch_note = ("Mark walls, door swing, power, water and other obstructions." if fridge
                   else "Mark taps, pipes, power points, trim and other obstructions.")
    wrapped(c, sketch_note, sketch_x + 10, 246, sketch_width - 20)
    if fridge:
        text(c, sketch_x + 10, 357, "Manual / page / date checked:", size=10)
        line(c, sketch_x + 10, 375, sketch_x + sketch_width - 10, 375)
    text(c, MARGIN, 401, "Check front, middle and rear. Allow for obstructions; leave unknowns blank.")

    heading(c, 423, "02", "Check the new model's required space")
    text(c, MARGIN, 442, "Copy these figures from the exact model's installation guide.")
    if fridge:
        fields(c, 452, ["Product width (mm)", "Height incl. hinges (mm)", "Body depth, no door (mm)"])
        fields(c, 489, ["Required opening W x H x D (mm)", "Ventilation: sides / rear / top (mm)"])
        fields(c, 526, ["Closed depth incl. doors + handles (mm)", "Other projections (mm)"],
               height=31, fractions=[0.6, 0.4])
    else:
        fields(c, 452, ["Product width (mm)", "Product height (mm)", "Product depth (mm)"])
        fields(c, 489, ["Required cavity W x H x D (mm)", "Required gaps: sides / rear / top (mm)"])
    note = (
        "Check the drawing for the fitted door, panel and kickboard. Parts may sit outside the cavity."
        if dishwasher
        else "Include handles, hoses and other projections. Use the manual's dimension definitions."
    )
    if fridge:
        text(c, MARGIN, 573, "Use the manual's labels and required opening; do not add generic gaps.")
    else:
        wrapped(c, note, MARGIN, 544, WIDTH)

    heading(c, 593 if fridge else 581, "03", "Check doors, connections and installation")
    if fridge:
        notes = [
            "Hinge-side wall gap (mm) / door angle to use and remove drawers (degrees):",
            "Doors open + drawers extended / remaining walkway (mm):",
            "Power + water positions / hose reach / access to tap and plug:",
        ]
    elif dishwasher:
        notes = [
            "Open door and extended rack reach / remaining walkway (mm):",
            "Taps, drain and power / hose route and reach:",
            "Foot adjustment / level floor / fixing, panel and kickboard:",
        ]
    else:
        notes = [
            "Door or lid fully open / room to load (mm):",
            "Taps, drain and power / hose route and reach:",
            "Foot adjustment / level floor / stacking: approved models, kit and total height:",
        ]
    for y, label in zip([610, 638, 666] if fridge else [600, 630, 660], notes):
        note_row(c, y, label)

    heading(c, 700, "04", "Check the delivery route")
    fields(c, 712, ["Packaged size W x H x D (mm)", "Narrowest doorway / hall W x H (mm)"])
    text(c, MARGIN, 765, "Check tight turns, stairs and lifts with the delivery team.")
    text(c, MARGIN, 780, "Before ordering, confirm any unknowns with the retailer or installer.")

    line(c, MARGIN, 794, PAGE_W - MARGIN, 794, color=FOREST)
    label = "australianhomecollective.com.au"
    text(c, MARGIN, 810, label, size=9.5, color=FOREST)
    c.linkURL(f"https://{label}/categories/{category}/", (MARGIN, PAGE_H - 814, MARGIN + 205, PAGE_H - 798), relative=0)
    revision = "Revision 3 / 11 September 2026 / 1 of 1"
    text(c, PAGE_W - MARGIN - c.stringWidth(revision, "Helvetica", 9.5), 810, revision, size=9.5)
