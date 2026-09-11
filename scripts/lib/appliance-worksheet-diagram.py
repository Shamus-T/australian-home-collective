"""Original 3D empty-cavity diagram for AHC appliance worksheets.

This helper draws vectors on an existing ReportLab canvas. It creates no PDF.
Its coordinates use the canvas's bottom-left origin. No dimensions or clearances
are assumed: the front opening has a tall illustrative proportion only.
"""

from math import atan2, cos, sin, pi

_BASE_WIDTH = 250.0
_BASE_HEIGHT = 180.0
_LABEL_SIZE = 11.0


def draw_cavity_diagram(c, x, y, width=250, height=180):
    """Draw one open cabinet cavity and three writable millimetre fields.

    Reserve at least 250 x 180 points. Larger allocations centre and scale the
    complete diagram; smaller ones are rejected to keep every label readable.
    The opening is a 72 x 102 point rectangle (600:850 proportion). A smaller,
    similarly proportioned rear wall makes the floor, sides and underside
    visible. Width and height follow the front opening. Depth follows the
    floor from its front edge to the recessed rear wall.
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

    def polygon(points, shade, line_width=0.85):
        c.setFillGray(shade)
        c.setStrokeGray(0.28)
        c.setLineWidth(line_width)
        shape = c.beginPath()
        shape.moveTo(*points[0])
        for point in points[1:]:
            shape.lineTo(*point)
        shape.close()
        c.drawPath(shape, fill=1, stroke=1)

    def arrow(ax, ay, bx, by):
        """Dimension arrowheads point to the two actual endpoints."""
        c.setStrokeGray(0.12)
        c.setFillGray(0.12)
        c.setLineWidth(1.15)
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

    def leader(points):
        c.setStrokeGray(0.28)
        c.setLineWidth(0.75)
        for start, end in zip(points, points[1:]):
            c.line(*start, *end)

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

        # Front opening corners; the entire face remains open and empty.
        fl, fr, floor, underside = 78.0, 150.0, 62.0, 164.0
        # The inset rear rectangle shares the front opening's tall proportion.
        rl, rr, rear_floor, rear_top = 99.0, 129.0, 90.5, 133.0

        # Restrained grayscale separates the recessed rear wall and four inner
        # surfaces. There is no opaque front face or appliance inside.
        polygon([(rl, rear_floor), (rr, rear_floor), (rr, rear_top), (rl, rear_top)], 0.91)
        polygon([(fl, floor), (fr, floor), (rr, rear_floor), (rl, rear_floor)], 0.97)
        polygon([(fl, floor), (rl, rear_floor), (rl, rear_top), (fl, underside)], 0.94)
        polygon([(fr, floor), (rr, rear_floor), (rr, rear_top), (fr, underside)], 0.85)
        polygon([(fl, underside), (fr, underside), (rr, rear_top), (rl, rear_top)], 0.88)

        # Side-panel front edges and a visibly thick benchtop lip frame the
        # cavity. The floor continues through the opening, without a plinth.
        polygon([(70, floor), (fl, floor), (fl, underside), (70, underside)], 0.83, 1.05)
        polygon([(fr, floor), (158, floor), (158, underside), (fr, underside)], 0.83, 1.05)
        polygon([(66, underside), (162, underside), (162, 173), (66, 173)], 0.77, 1.05)
        c.setStrokeGray(0.18)
        c.setLineWidth(1.35)
        c.line(64, floor, 164, floor)
        c.line(fl, floor, fl, underside)
        c.line(fr, floor, fr, underside)

        # Width is horizontal between the clear inner sides at the front.
        leader([(fl, 59), (fl, 46)])
        leader([(fr, 59), (fr, 46)])
        arrow(fl, 49, fr, 49)
        label((fl + fr) / 2, 35, "Width", centred=True)

        # Height is vertical from the floor to the underside of the benchtop.
        leader([(47, floor), (67, floor)])
        leader([(47, underside), (67, underside)])
        arrow(51, floor, 51, underside)
        c.saveState()
        c.translate(38, (floor + underside) / 2)
        c.rotate(90)
        label(0, 0, "Height", centred=True)
        c.restoreState()

        # The depth arrow follows one front-to-back line on the cavity floor.
        # Corresponding points sit near the right side in both perspective
        # rectangles; this is not a diagonal from one side of the width to the other.
        arrow(130, floor, 120.6667, rear_floor)
        label(177, 79, "Depth")
        leader([(172, 76), (147, 76), (125.3334, 76.25)])

        # Small practical callouts help the reader recognise the empty recess.
        label(177, 158, "Benchtop")
        leader([(172, 155), (162, 168)])
        label(177, 120, "Rear wall")
        leader([(172, 117), (144, 111), (122, 111)])

        writing_field(5, "Width")
        writing_field(88, "Height")
        writing_field(171, "Depth")
    finally:
        c.restoreState()
