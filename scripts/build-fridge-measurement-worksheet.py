"""Build the one-page A4 fridge measurement worksheet.

Requires ReportLab. Run from any directory with:
    python scripts/build-fridge-measurement-worksheet.py

Uses the established appliance worksheet drawing helpers without modifying
those worksheets. Dimensions remain blank for the exact model and kitchen.
"""

from pathlib import Path
import importlib.util
import shutil

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
HELPERS = ROOT / "scripts" / "build-appliance-measurement-worksheets.py"
spec = importlib.util.spec_from_file_location("appliance_worksheets", HELPERS)
style = importlib.util.module_from_spec(spec)
spec.loader.exec_module(style)


def main():
    output_dir = ROOT / "output" / "pdf"
    downloads = ROOT / "public" / "downloads"
    output_dir.mkdir(parents=True, exist_ok=True)
    downloads.mkdir(parents=True, exist_ok=True)
    filename = "fridge-measurement-worksheet.pdf"
    path = output_dir / filename
    c = canvas.Canvas(str(path), pagesize=A4, pageCompression=1, invariant=1)
    c.setTitle("Fridge Measurement Worksheet | Australian Home Collective")
    c.setAuthor("Australian Home Collective")
    c.setSubject("Printable A4 fridge measurement record. All dimensions in millimetres.")
    c.setCreator("Australian Home Collective")

    style.header(c, "Fridge", "Measure your kitchen and delivery route, then check the exact model's installation guide.")
    style.model_section(c)

    style.heading(c, 256, "02", "Measure the finished opening", "Use the smallest measurement")
    style.text(c, style.MARGIN, 276, "Check front, middle and rear. Allow for skirting, trim, uneven floors and anything behind the fridge.", size=8.4)
    style.field_row(c, 287, ["Smallest clear width (mm)", "Smallest floor-to-top height (mm)", "Usable depth to obstruction (mm)"], height=37)

    style.heading(c, 347, "03", "Copy the exact model's dimensions and required space")
    style.field_row(c, 360, ["Product width (mm)", "Product height incl. hinges (mm)", "Body depth without door (mm)"], height=34)
    style.field_row(c, 394, ["Total closed depth incl. doors + handles (mm)", "Other projections / dimension notes"], height=34)
    style.field_row(c, 428, ["Required opening W x H x D (mm)", "Required ventilation: sides / rear / top (mm)"], height=36)
    style.text(c, style.MARGIN, 478, "Use the guide's dimension labels. Record the required opening; do not add a generic gap.", size=8.4)

    style.heading(c, 502, "04", "Check the doors, drawers and connections")
    style.note_rows(c, 516, [
        "Hinge-side wall gap (mm) / door angle needed to use and remove drawers (degrees):",
        "Depth with doors open (mm) / room to fully pull out drawers / remaining walkway (mm):",
        "Power point + water connection positions / hose reach / access to tap + plug:",
    ], height=30)

    style.heading(c, 633, "05", "Measure the whole delivery route")
    style.field_row(c, 646, ["Packaged delivery W x H x D (mm)", "Narrowest doorway / hall W x H (mm)"], height=36)
    style.note_rows(c, 689, ["Tight turns, stairs, lift, landings, thresholds / access confirmed with retailer:"], height=28)

    style.final_section(c)
    style.footer(c, "kitchen")
    c.showPage()
    c.save()
    destination = downloads / filename
    shutil.copyfile(path, destination)
    print(destination.relative_to(ROOT))


if __name__ == "__main__":
    main()
