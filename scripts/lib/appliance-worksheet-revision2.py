"""Draw Revision 2 of the one-page washing machine and dishwasher worksheets."""

import importlib.util
from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4

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


def draw_sheet(c, appliance, category, dishwasher=False):
    text(c, MARGIN, 30, "AUSTRALIAN HOME COLLECTIVE", size=10, bold=True, color=FOREST)
    printable_label = "FREE A4 WORKSHEET"
    text(c, PAGE_W - MARGIN - c.stringWidth(printable_label, "Helvetica", 9), 30, printable_label, size=9)
    text(c, MARGIN, 60, f"{appliance} measurement sheet", size=22, bold=True, color=FOREST)
    text(c, MARGIN, 82, "Measure the actual cavity, not the old appliance.", size=11.5, bold=True)
    text(c, MARGIN, 98, "Write every measurement in millimetres (mm).")
    fields(c, 110, ["Brand and full model code"], height=35)

    heading(c, 165, "01", "Measure the space in your home")
    text(c, MARGIN, 184, "Diagram shows directions only. Measure the actual cavity.")
    text(c, MARGIN, 198, "Record its smallest clear width, height and usable depth below.")
    _diagram.draw_appliance_diagram(c, MARGIN, PAGE_H - 385, width=250, height=180, dishwasher=dishwasher)
    sketch_x = MARGIN + 276
    sketch_width = WIDTH - 276
    box(c, sketch_x, 211, sketch_width, 172)
    text(c, sketch_x + 10, 229, "Sketch your layout", size=11, bold=True)
    wrapped(c, "Mark taps, pipes, power points, trim and other obstructions.", sketch_x + 10, 246, sketch_width - 20)
    text(c, MARGIN, 401, "Check front, middle and rear. Allow for obstructions; leave unknowns blank.")

    heading(c, 423, "02", "Check the new model's required space")
    text(c, MARGIN, 442, "Copy these figures from the exact model's installation guide.")
    fields(c, 452, ["Product width (mm)", "Product height (mm)", "Product depth (mm)"])
    fields(c, 489, ["Required cavity W x H x D (mm)", "Required gaps: sides / rear / top (mm)"])
    note = (
        "Check the drawing for the fitted door, panel and kickboard. Parts may sit outside the cavity."
        if dishwasher
        else "Include handles, hoses and other projections. Use the manual's dimension definitions."
    )
    wrapped(c, note, MARGIN, 544, WIDTH)

    heading(c, 581, "03", "Check doors, connections and installation")
    if dishwasher:
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
    for y, label in zip([600, 630, 660], notes):
        note_row(c, y, label)

    heading(c, 700, "04", "Check the delivery route")
    fields(c, 712, ["Packaged size W x H x D (mm)", "Narrowest doorway / hall W x H (mm)"])
    text(c, MARGIN, 765, "Check tight turns, stairs and lifts with the delivery team.")
    text(c, MARGIN, 780, "Before ordering, confirm any unknowns with the retailer or installer.")

    line(c, MARGIN, 794, PAGE_W - MARGIN, 794, color=FOREST)
    label = "australianhomecollective.com.au"
    text(c, MARGIN, 810, label, size=9.5, color=FOREST)
    c.linkURL(f"https://{label}/categories/{category}/", (MARGIN, PAGE_H - 814, MARGIN + 205, PAGE_H - 798), relative=0)
    revision = "Revision 2 / 11 September 2026 / 1 of 1"
    text(c, PAGE_W - MARGIN - c.stringWidth(revision, "Helvetica", 9.5), 810, revision, size=9.5)
