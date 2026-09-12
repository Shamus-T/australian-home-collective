"""Original appliance line drawings for AHC's measuring worksheets.

The angled view explains dimension directions only. It contains no model
specifications: readers record their measured cavity in the blank fields.
"""
from math import atan2, cos, sin, pi


def draw_appliance_diagram(c, x, y, width=250, height=180, dishwasher=False, fridge=False):
    """Draw a tall appliance, three dimension arrows and blank cavity fields."""
    if width < 250 or height < 180:
        raise ValueError("The appliance diagram needs at least 250 x 180 points.")
    scale = min(width / 250, height / 180)

    def label(px, py, value, bold=False, centred=False):
        c.setFillGray(0.12)
        c.setFont("Helvetica-Bold" if bold else "Helvetica", 11)
        if centred:
            c.drawCentredString(px, py, value)
        else:
            c.drawString(px, py, value)

    def stroke(ax, ay, bx, by, weight=0.65, shade=0.32):
        c.setStrokeGray(shade)
        c.setLineWidth(weight)
        c.line(ax, ay, bx, by)

    def arrow(ax, ay, bx, by):
        stroke(ax, ay, bx, by, 0.9, 0.12)
        c.setFillGray(0.12)
        angle = atan2(by - ay, bx - ax)
        for tx, ty, direction in ((ax, ay, angle), (bx, by, angle + pi)):
            base_x, base_y = tx + 3.5 * cos(direction), ty + 3.5 * sin(direction)
            side_x, side_y = 1.5 * sin(direction), -1.5 * cos(direction)
            p = c.beginPath()
            p.moveTo(tx, ty)
            p.lineTo(base_x + side_x, base_y + side_y)
            p.lineTo(base_x - side_x, base_y - side_y)
            p.close()
            c.drawPath(p, fill=1, stroke=0)

    c.saveState()
    try:
        c.translate(x + (width - 250 * scale) / 2, y + (height - 180 * scale) / 2)
        c.scale(scale, scale)
        c.setLineJoin(1)
        c.setLineCap(1)
        c.setDash()
        left, right, bottom = 76, 138, 41
        top = bottom + (right-left) * 850 / 600
        dx, dy = 32, 17
        if fridge:
            left, right, top = 84, 131, 138

        # Tall front face, top and side in a simple angled line drawing.
        c.setStrokeGray(0.25)
        c.setLineWidth(0.95)
        c.rect(left, bottom, right-left, top-bottom, stroke=1, fill=0)
        for a, b in (
            ((left, top), (left+dx, top+dy)),
            ((left+dx, top+dy), (right+dx, top+dy)),
            ((right, top), (right+dx, top+dy)),
            ((right+dx, top+dy), (right+dx, bottom+dy)),
            ((right, bottom), (right+dx, bottom+dy)),
        ):
            stroke(*a, *b, weight=0.95, shade=0.25)
        if not fridge:
            stroke(left, top-14, right, top-14)
        stroke(left, bottom+7, right, bottom+7)
        if not fridge:
            stroke(right, top-14, right+dx, top+dy-14)

        # A few recognisable features, without branding or service details.
        c.setStrokeGray(0.32)
        c.setLineWidth(0.65)
        if fridge:
            stroke(left, top-31, right, top-31)
            stroke(left+7, top-23, left+7, top-13, weight=1.4)
            stroke(left+7, top-49, left+7, top-37, weight=1.4)
        elif dishwasher:
            c.roundRect(left+7, bottom+12, 48, 54, 2, stroke=1, fill=0)
            stroke(left+16, top-25, right-16, top-25, weight=1.4)
            for cx in (left+7, left+12, left+17):
                c.circle(cx, top-7, 0.9, stroke=1, fill=0)
            c.rect(right-20, top-9, 12, 4, stroke=1, fill=0)
        else:
            c.circle(107, 84, 24, stroke=1, fill=0)
            c.circle(107, 84, 20, stroke=1, fill=0)
            c.rect(left+6, top-10, 19, 6, stroke=1, fill=0)
            c.circle(110, top-7, 3.1, stroke=1, fill=0)
            c.rect(right-19, top-9, 12, 4, stroke=1, fill=0)

        # Width across the top; depth follows the receding top edge.
        for px in (left, right):
            stroke(px, top+3, px, 157, shade=0.48)
        arrow(left, 153, right, 153)
        label((left+right)/2, 166, "Width", centred=True)
        stroke(right+2, top+2, 150, 152, shade=0.48)
        stroke(right+dx+2, top+dy+2, 182, 171, shade=0.48)
        arrow(150, 150, 182, 167)
        label(187, 165, "Depth")

        # Height is parallel to the tall front face.
        stroke(49, bottom, left-4, bottom, shade=0.48)
        stroke(49, top, left-4, top, shade=0.48)
        arrow(53, bottom, 53, top)
        c.saveState()
        c.translate(40, (bottom+top)/2)
        c.rotate(90)
        label(0, 0, "Height", centred=True)
        c.restoreState()

        for px, value in ((5, "Width"), (88, "Height"), (171, "Depth")):
            label(px, 21, value, bold=True)
            stroke(px, 6, px+48, 6, weight=0.9, shade=0.18)
            label(px+52, 7, "mm")
    finally:
        c.restoreState()
