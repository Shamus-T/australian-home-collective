"""Original cavity diagram for AHC's printable appliance worksheets.

The helper draws directly on a ReportLab canvas; it does not create a PDF.
Coordinates use ReportLab's bottom-left origin, unlike the worksheet builders'
top-down convenience helpers. The diagram contains no installation dimensions.
"""

from math import atan2, cos, sin


_BASE_WIDTH = 250.0
_BASE_HEIGHT = 180.0
_LABEL_SIZE = 11.0


def draw_cavity_diagram(c, x, y, width=250, height=180):
    """Draw an empty opening and writable width, height and depth fields.

    ``x`` and ``y`` are the bottom-left corner of the available rectangle.
    Reserve at least 250 x 180 points so labels remain at least 11 points.
    Larger rectangles keep the diagram centred and scale it proportionally.
    Smaller rectangles raise ValueError rather than make the labels too small.

    The front view is a tall rectangle with a 600:850 *proportion*, without
    displaying those values or implying a required opening size. The top view
    labels the back and front, so depth runs from the opening towards the back.
    All marks, labels and writing lines remain inside the reserved rectangle.
    """
    width, height = float(width), float(height)
    if width < _BASE_WIDTH or height < _BASE_HEIGHT:
        raise ValueError("The cavity diagram needs at least 250 x 180 points.")
    scale = min(width / _BASE_WIDTH, height / _BASE_HEIGHT)

    def label(px, py, value, bold=False, centred=False):
        c.setFont("Helvetica-Bold" if bold else "Helvetica", _LABEL_SIZE)
        if centred:
            c.drawCentredString(px, py, value)
        else:
            c.drawString(px, py, value)

    def arrow(ax, ay, bx, by):
        """Two inward-facing arrowheads on the true measurement endpoints."""
        c.setLineWidth(1.15)
        c.line(ax, ay, bx, by)
        angle = atan2(by - ay, bx - ax)
        for tx, ty, direction in ((ax, ay, angle), (bx, by, angle + 3.141592653589793)):
            base_x = tx + 4.3 * cos(direction)
            base_y = ty + 4.3 * sin(direction)
            side_x = 2.0 * sin(direction)
            side_y = -2.0 * cos(direction)
            head = c.beginPath()
            head.moveTo(tx, ty)
            head.lineTo(base_x + side_x, base_y + side_y)
            head.lineTo(base_x - side_x, base_y - side_y)
            head.close()
            c.drawPath(head, fill=1, stroke=0)

    def upright_axis_label(px, py, value):
        c.saveState()
        c.translate(px, py)
        c.rotate(90)
        label(0, 0, value, centred=True)
        c.restoreState()

    def writing_field(left, value):
        label(left, 21, value, bold=True)
        c.setLineWidth(0.9)
        c.line(left, 6, left + 48, 6)
        label(left + 52, 7, "mm")

    c.saveState()
    try:
        c.translate(x + (width - _BASE_WIDTH * scale) / 2,
                    y + (height - _BASE_HEIGHT * scale) / 2)
        c.scale(scale, scale)
        c.setStrokeGray(0.18)
        c.setFillGray(0.12)
        c.setLineCap(0)
        c.setLineJoin(0)
        c.setDash()

        # A clear, empty front opening. Its outline is deliberately tall.
        front_x, front_y = 40.0, 65.0
        front_w, front_h = 51.0, 72.25
        label(front_x + front_w / 2, 164, "Front view", bold=True, centred=True)
        c.setLineWidth(1.7)
        c.rect(front_x, front_y, front_w, front_h, fill=0, stroke=1)

        # Width: left to right across the same opening shown above.
        c.setLineWidth(0.7)
        c.line(front_x, 47, front_x, 62)
        c.line(front_x + front_w, 47, front_x + front_w, 62)
        arrow(front_x, 51, front_x + front_w, 51)
        label(front_x + front_w / 2, 36, "Width", centred=True)

        # Height: floor to underside above. Label reads up the vertical axis.
        c.setLineWidth(0.7)
        c.line(24, front_y, 37, front_y)
        c.line(24, front_y + front_h, 37, front_y + front_h)
        arrow(28, front_y, 28, front_y + front_h)
        upright_axis_label(16, front_y + front_h / 2, "Height")

        # Top view: solid back/sides; a dashed front marks the open entrance.
        plan_x, plan_y, plan_w, plan_d = 157.0, 82.0, 56.0, 56.0
        label(plan_x + plan_w / 2, 164, "Top view", bold=True, centred=True)
        label(plan_x + plan_w / 2, 147, "Back", centred=True)
        c.setLineWidth(1.7)
        boundary = c.beginPath()
        boundary.moveTo(plan_x, plan_y)
        boundary.lineTo(plan_x, plan_y + plan_d)
        boundary.lineTo(plan_x + plan_w, plan_y + plan_d)
        boundary.lineTo(plan_x + plan_w, plan_y)
        c.drawPath(boundary, stroke=1, fill=0)
        c.setLineWidth(0.9)
        c.setDash(3, 2)
        c.line(plan_x, plan_y, plan_x + plan_w, plan_y)
        c.setDash()
        label(plan_x + plan_w / 2, 67, "Front", centred=True)

        # Depth: front to back in the top view, never a diagonal height arrow.
        c.setLineWidth(0.7)
        c.line(216, plan_y, 230, plan_y)
        c.line(216, plan_y + plan_d, 230, plan_y + plan_d)
        arrow(226, plan_y, 226, plan_y + plan_d)
        upright_axis_label(243, plan_y + plan_d / 2, "Depth")

        # The handwriting lines are separate from the drawing's dimension lines.
        writing_field(5, "Width")
        writing_field(88, "Height")
        writing_field(171, "Depth")
    finally:
        c.restoreState()
