"""Build the one-page A4 fridge measurement worksheet.

Requires ReportLab. Run from any directory with:
    python scripts/build-fridge-measurement-worksheet.py

Uses the same branded layout and drawing helpers as the washing machine
and dishwasher worksheets. Dimensions remain blank for the exact model and kitchen.
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
    c.setSubject("Revision 3. Printable A4 fridge measurement record. All dimensions in millimetres.")
    c.setCreator("Australian Home Collective")

    style.revision2.draw_sheet(c, "Fridge", "kitchen", fridge=True)
    c.showPage()
    c.save()
    destination = downloads / filename
    shutil.copyfile(path, destination)
    print(destination.relative_to(ROOT))


if __name__ == "__main__":
    main()
