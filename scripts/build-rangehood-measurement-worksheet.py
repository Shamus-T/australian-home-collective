"""Build AHC's one-page A4 rangehood planning worksheet.

Run: python scripts/build-rangehood-measurement-worksheet.py
Requires ReportLab and Pillow. Uses the existing AHC header logo.
All installation values remain blank for the exact Australian manuals and installer.
"""
from pathlib import Path
import shutil
from PIL import Image
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
W, H = A4
M = 34
WIDTH = W - 2 * M
INK = HexColor("#26372e")
FOREST = HexColor("#244c3d")
RULE = HexColor("#87978e")


def text(c, x, y, value, size=10.5, bold=False, color=INK):
    c.setFillColor(color)
    c.setFont("Helvetica-Bold" if bold else "Helvetica", size)
    c.drawString(x, H-y, value)


def line(c, x1, y1, x2, y2, width=0.6):
    c.setStrokeColor(RULE)
    c.setLineWidth(width)
    c.line(x1, H-y1, x2, H-y2)


def box(c, x, y, w, h):
    c.setStrokeColor(RULE)
    c.setLineWidth(0.6)
    c.rect(x, H-y-h, w, h, stroke=1, fill=0)


def heading(c, y, number, title):
    text(c, M, y, f"{number}  {title}", size=12, bold=True, color=FOREST)
    line(c, M, y+6, W-M, y+6, 0.8)


def fields(c, y, labels, height=37, fractions=None):
    fractions = fractions or [1/len(labels)] * len(labels)
    x = M
    for label, fraction in zip(labels, fractions):
        width = WIDTH*fraction
        box(c, x, y, width, height)
        text(c, x+8, y+14, label)
        x += width


def arrow(c, x1, y1, x2, y2):
    from math import atan2, sin, cos, pi
    line(c, x1, y1, x2, y2, 0.9)
    angle = atan2(y2-y1, x2-x1)
    for x, y, direction in ((x1,y1,angle),(x2,y2,angle+pi)):
        for offset in (-0.45,0.45):
            line(c,x,y,x+4*cos(direction+offset),y+4*sin(direction+offset),0.9)


def diagram(c):
    # Cabinet opening and hood in front view. No distances are prescribed.
    box(c, 90, 241, 155, 62)
    box(c, 100, 270, 135, 24)
    for x in (112,122,132,142,152,162,172,182,192,202,212,222):
        line(c,x,281,x+5,281)
    line(c,90,303,245,303,1)
    line(c,100,341,235,341,1.2)
    for x in (122,192):
        line(c,x,338,x+24,338)
    arrow(c,90,229,245,229)
    text(c,132,220,"Opening width",size=10)
    line(c,90,232,90,238)
    line(c,245,232,245,238)
    arrow(c,76,241,76,303)
    c.saveState()
    c.translate(64,H-295)
    c.rotate(90)
    c.setFillColor(INK)
    c.setFont("Helvetica",10)
    c.drawString(0,0,"Opening height")
    c.restoreState()
    text(c,111,320,"Measure depth separately",size=8.5)
    text(c,107,354,"Cooktop shown for context",size=8.5)
    for x, label in ((M,"Width"),(M+88,"Height"),(M+176,"Depth")):
        text(c,x,375,label,size=11,bold=True)
        line(c,x,389,x+49,389,0.9)
        text(c,x+53,390,"mm",size=10)


def main():
    out = ROOT / "output" / "pdf" / "rangehood-measurement-worksheet.pdf"
    out.parent.mkdir(parents=True,exist_ok=True)
    c = canvas.Canvas(str(out),pagesize=A4,pageCompression=1,invariant=1)
    c.setTitle("Rangehood Measurement Worksheet | Australian Home Collective")
    c.setAuthor("Australian Home Collective")
    c.setCreator("Australian Home Collective")
    c.setSubject("Revision 1. Reviewed 12 September 2026. A4 planning record; not installation approval.")
    with Image.open(ROOT / "public" / "images" / "header-title.png") as source:
        logo = source.convert("RGBA")
        logo = logo.crop(logo.getchannel("A").getbbox())
    lw = 126
    lh = lw*logo.height/logo.width
    c.drawImage(ImageReader(logo),M,H-8-lh,width=lw,height=lh,mask="auto")
    label = "FREE A4 WORKSHEET"
    text(c,W-M-c.stringWidth(label,"Helvetica",9),30,label,size=9)
    text(c,M,72,"Rangehood measurement sheet",size=22,bold=True,color=FOREST)
    text(c,M,88,"Measure the kitchen; confirm the installation requirements.",size=11,bold=True)
    text(c,M,104,"Write dimensions in millimetres (mm). Leave unknowns blank.")
    fields(c,116,["Rangehood brand + full model code","Cooktop model + fuel / type"],height=35)

    heading(c,171,"01","Measure the space in your kitchen")
    text(c,M,190,"Record the actual opening. Compare it with the exact installation drawing.")
    text(c,M,204,"Illustrative only; no clearance is specified by this diagram.")
    diagram(c)
    sx = M+276
    box(c,sx,217,WIDTH-276,176)
    text(c,sx+10,235,"Duct route / layout sketch",size=11,bold=True)
    text(c,sx+10,252,"Mark outlet, bends, power and",size=10.5)
    text(c,sx+10,265,"obstructions. Note route length.",size=10.5)
    text(c,M,409,"Cooktop width (mm): __________   Cooktop depth (mm): __________")

    heading(c,437,"02","Copy requirements from the exact Australian manuals")
    fields(c,450,["Hood overall W x H x D (mm)","Required cutout W x H x D (mm)"])
    fields(c,487,["Measured cooktop-to-hood gap (mm)","Required gap + measuring points (mm)"])
    fields(c,524,["Specified duct size + material","Manual / page / date checked"])
    text(c,M,576,"Installer to confirm measuring points, clearances and all local requirements.",size=10)

    heading(c,597,"03","Confirm the air route and access")
    for y,label in [
        (616,"Outside outlet OR recirculation return-air position / replacement air:"),
        (644,"Mounting support / power / filter and motor access / approvals:"),
        (672,"Installer / unresolved checks / who will confirm:"),
    ]:
        text(c,M,y,label)
        line(c,M,y+17,W-M,y+17)

    heading(c,709,"04","Check ownership and total cost")
    fields(c,721,["Odour filter part / care / interval","Filter price / full installation quote"],height=35)
    text(c,M,775,"Confirm coverage, noise and lighting before ordering.")
    text(c,M,790,"Planning record only. Not installation approval.",size=9.5)
    line(c,M,802,W-M,802)
    url="australianhomecollective.com.au"
    text(c,M,817,url,size=9.5,color=FOREST)
    c.linkURL("https://"+url+"/guides/rangehood-buying-guide-australia/",(M,H-821,M+205,H-805),relative=0)
    rev="Revision 1 / 12 September 2026 / 1 of 1"
    text(c,W-M-c.stringWidth(rev,"Helvetica",9.5),817,rev,size=9.5)
    c.showPage()
    c.save()
    target=ROOT / "public" / "downloads" / out.name
    target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(out,target)
    print(target.relative_to(ROOT))


if __name__ == "__main__":
    main()
