"""Simple 3D cavity outline for AHC's printable appliance worksheets.

Draws directly on an existing ReportLab canvas, using bottom-left coordinates.
The proportions are illustrative; dimensions and clearances are left blank.
"""

from math import atan2, cos, sin, pi

_BASE_WIDTH = 250.0
_BASE_HEIGHT = 180.0
_LABEL_SIZE = 11.0


def draw_cavity_diagram(c, x, y, width=250, height=180):
    """Draw one uncluttered 3D opening with three measurement arrows.

    The front opening has a tall 600:850 proportion. A smaller rear rectangle
    and four receding edges show depth without construction details. Width
    and height measure the clear opening; depth runs along the cavity floor.
    """
    width, height = float(width), float(height)
    if width < _BASE_WIDTH or height < _BASE_HEIGHT:
        raise ValueError("The cavity diagram needs at least 250 x 180 points.")
    scale = min(width / _BASE_WIDTH, height / _BASE_HEIGHT)

    def label(px, py, value, bold=False, centred=False):
        c.setFillGray(0.12)
        c.setFont("Helvetica-Bold" if bold else "Helvetica", _LABEL_SIZE)
        if centred:
            c.drawCentredString(px, py, value)
        else:
            c.drawString(px, py, value)

    def arrow(ax, ay, bx, by):
        c.setStrokeGray(0.12)
        c.setFillGray(0.12)
        c.setLineWidth(1.1)
        c.line(ax, ay, bx, by)
        angle = atan2(by - ay, bx - ax)
        for tx, ty, direction in ((ax, ay, angle), (bx, by, angle + pi)):
            base_x = tx + 4.1 * cos(direction)
            base_y = ty + 4.1 * sin(direction)
            side_x = 1.85 * sin(direction)
            side_y = -1.85 * cos(direction)
            head = c.beginPath()
            head.moveTo(tx, ty)
            head.lineTo(base_x + side_x, base_y + side_y)
            head.lineTo(base_x - side_x, base_y - side_y)
            head.close()
            c.drawPath(head, fill=1, stroke=0)

    def guide(ax, ay, bx, by):
        c.setStrokeGray(0.42)
        c.setLineWidth(0.65)
        c.line(ax, ay, bx, by)

    def writing_field(left, value):
        label(left, 21, value, bold=True)
        c.setStrokeGray(0.18)
        c.setLineWidth(0.9)
        c.line(left, 6, left + 48, 6)
        label(left + 52, 7, "mm")

    c.saveState()
    try:
        c.translate(x + (width - _BASE_WIDTH * scale) / 2,
                    y + (height - _BASE_HEIGHT * scale) / 2)
        c.scale(scale, scale)
        c.setLineCap(0)
        c.setLineJoin(0)
        c.setDash()

        fl, fr, floor, underside = 78.0, 150.0, 62.0, 164.0
        rl, rr, rear_floor, rear_top = 99.0, 129.0, 90.5, 133.0

        # Thin receding edges give the empty opening depth. Keep the interior
        # white so the measurement arrows have a clear visual priority.
        for front, rear in (
            ((fl, floor), (rl, rear_floor)),
            ((fr, floor), (rr, rear_floor)),
            ((fl, underside), (rl, rear_top)),
            ((fr, underside), (rr, rear_top)),
        ):
            guide(*front, *rear)
        c.setStrokeGray(0.42)
        c.setLineWidth(0.65)
        c.rect(rl, rear_floor, rr - rl, rear_top - rear_floor, stroke=1, fill=0)
        c.setStrokeGray(0.20)
        c.setLineWidth(1.2)
        c.rect(fl, floor, fr - fl, underside - floor, stroke=1, fill=0)

        guide(fl, 59, fl, 46)
        guide(fr, 59, fr, 46)
        arrow(fl, 49, fr, 49)
        label((fl + fr) / 2, 35, "Width", centred=True)

        guide(47, floor, 74, floor)
        guide(47, underside, 74, underside)
        arrow(51, floor, 51, underside)
        c.saveState()
        c.translate(38, (floor + underside) / 2)
        c.rotate(90)
        label(0, 0, "Height", centred=True)
        c.restoreState()

        # Corresponding points on the front and rear edges describe the same
        # front-to-back direction; the arrow stays clear of the side seam.
        arrow(130, floor, 120.6667, rear_floor)
        label(171, 80, "Depth")
        guide(165, 76.25, 125.3334, 76.25)

        writing_field(5, "Width")
        writing_field(88, "Height")
        writing_field(171, "Depth")
    finally:
        c.restoreState()
