"""Build the AHC A4 robot mower yard-assessment worksheet.
Run: python scripts/build-robot-lawn-mower-yard-assessment.py
Requires ReportLab and Pillow. Uses the existing AHC logo.
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
WIDTH = W - 2*M
INK = HexColor('#26372e')
FOREST = HexColor('#244c3d')
RULE = HexColor('#87978e')

def text(c,x,y,value,size=10.5,bold=False):
    c.setFillColor(FOREST if bold else INK)
    c.setFont('Helvetica-Bold' if bold else 'Helvetica',size)
    c.drawString(x,H-y,value)

def line(c,x1,y1,x2,y2):
    c.setStrokeColor(RULE);c.setLineWidth(.6)
    c.line(x1,H-y1,x2,H-y2)

def heading(c,y,n,label):
    text(c,M,y,f'{n}  {label}',12,True)
    line(c,M,y+6,W-M,y+6)

def fields(c,y,labels,height=36):
    fw=WIDTH/len(labels)
    for i,label in enumerate(labels):
        x=M+i*fw
        c.setStrokeColor(RULE);c.setLineWidth(.6)
        c.rect(x,H-y-height,fw,height,stroke=1,fill=0)
        text(c,x+8,y+14,label,10)

def main():
    out=ROOT/'output/pdf/robot-lawn-mower-yard-assessment.pdf'
    out.parent.mkdir(parents=True,exist_ok=True)
    c=canvas.Canvas(str(out),pagesize=A4,pageCompression=1,invariant=1)
    c.setTitle('Robot Lawn Mower Yard Assessment | Australian Home Collective')
    c.setAuthor('Australian Home Collective')
    c.setSubject('Revision 1. Reviewed 13 September 2026. Planning record, not installation or safety approval.')
    with Image.open(ROOT/'public/images/header-title.png') as source:
        logo=source.convert('RGBA');logo=logo.crop(logo.getchannel('A').getbbox())
    lw=126;lh=lw*logo.height/logo.width
    c.drawImage(ImageReader(logo),M,H-8-lh,width=lw,height=lh,mask='auto')
    label='FREE A4 WORKSHEET'
    text(c,W-M-c.stringWidth(label,'Helvetica',9),30,label,9)
    text(c,M,72,'Robot mower yard assessment',22,True)
    text(c,M,90,'Map the lawn before comparing machines.',11,True)
    text(c,M,106,'Record what you measure. Copy model requirements separately; leave unknowns blank.')
    fields(c,118,['Yard / date','Supplier / full mower model'])

    heading(c,175,'01','Sketch every lawn section and the route between them')
    text(c,M,194,'Label lawn areas A, B and C. Mark gates, steps, trees, beds, slopes and water.')
    c.setStrokeColor(RULE);c.rect(M,H-208-119,WIDTH,119,stroke=1,fill=0)
    text(c,M+9,224,'Sketch: include proposed dock, power and areas to exclude',9)
    text(c,M,343,'A path or closed gate may separate lawns. Confirm how the mower will reach each area.',10)

    heading(c,365,'02','Measure your yard')
    fields(c,378,['Lawn A (m2)','Lawn B (m2)','Lawn C / total (m2)'])
    fields(c,414,['Narrowest passage + location (cm)','Steepest lawn / boundary slope (%)'])
    fields(c,450,['Grass variety / desired height (mm)','Available mowing hours / days'])
    text(c,M,501,'Slope (%) = vertical rise / horizontal run x 100, using the same units.',10)
    text(c,M,515,'20 cm rise over 100 cm horizontal run = 20%, not 20 degrees. Avoid unsafe access.',10)

    heading(c,537,'03','Copy the exact model requirements')
    fields(c,550,['Navigation / signal requirements','Capacity (m2) + schedule assumptions'])
    fields(c,586,['Passage width / edge setbacks (cm)','Slope limits: inside / boundary (%)'])
    fields(c,622,['Cutting height range (mm)','Manual version / page / date checked'])

    heading(c,680,'04','Resolve installation, safety and ownership')
    for y,label in [(698,'Dock / power / drainage / barriers / children, pets and wildlife:'),
                    (731,'Installed cost / blades / battery / subscriptions / local service:')]:
        text(c,M,y,label,10.5);line(c,M,y+19,W-M,y+19)
    text(c,M,770,'Unresolved checks / who will confirm: __________________________________________',10)
    text(c,M,790,'Planning record only. Not installation or safety approval.',9.5)
    line(c,M,802,W-M,802)
    text(c,M,817,'australianhomecollective.com.au',9.5)
    c.linkURL('https://australianhomecollective.com.au/guides/robot-lawn-mower-buying-guide-australia/',(M,H-822,M+205,H-805),relative=0)
    rev='Revision 1 / 13 September 2026 / 1 of 1'
    text(c,W-M-c.stringWidth(rev,'Helvetica',9.5),817,rev,9.5)
    c.showPage();c.save()
    target=ROOT/'public/downloads'/out.name
    shutil.copyfile(out,target)
    print(target.relative_to(ROOT))

if __name__=='__main__':
    main()
