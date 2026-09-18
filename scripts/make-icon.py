#!/usr/bin/env python3
"""Generate the BelowTrace icon in the house style shared with TokNotch and Softfold:
a near-black concentric frame with the name and REFFWU engraved along it (Optima, tracked),
around a lit inner panel. The mark is a section through the ground: a small house, a glowing
private sewer line tracing down beneath it, and the city sewer it connects to.

Requires Pillow and NumPy. Usage: python3 scripts/make-icon.py
Writes: src/app/icon.png (512), src/app/apple-icon.png (180), public/brand/icon-{1024,256,128}.png
"""
import math
import os

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = 2048
K = 2  # supersampling for masks

# House geometry (identical to TokNotch / Softfold)
INNER = (176, 176, 1872, 1872)
INNER_R = 392
F = 132
OUTER = (INNER[0] - F, INNER[1] - F, INNER[2] + F, INNER[3] + F)
OUTER_R = INNER_R + F
FRAME_RGB = (26, 26, 28)
ENGRAVING = (128, 128, 134, 255)
FONT_PATH = "/System/Library/Fonts/Optima.ttc"
FONT_SIZE = 46
TRACKING = 16
NAME = "BELOWTRACE"
SIGNATURE = "REFFWU"

GROUND_Y = 812


def blank():
    return Image.new("RGBA", (S, S), (0, 0, 0, 0))


def rr_mask(box, radius):
    m = Image.new("L", (S * K, S * K), 0)
    ImageDraw.Draw(m).rounded_rectangle([v * K for v in box], radius=radius * K, fill=255)
    return m.resize((S, S), Image.LANCZOS)


def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(len(a)))


def vertical_gradient(box, stops):
    """stops: [(t, rgb)], t in 0..1 across the box height."""
    x0, y0, x1, y1 = box
    g = Image.new("RGBA", (1, 256))
    for y in range(256):
        t = y / 255
        for (ta, ca), (tb, cb) in zip(stops, stops[1:]):
            if ta <= t <= tb:
                g.putpixel((0, y), lerp(ca, cb, (t - ta) / (tb - ta or 1)) + (255,))
                break
    g = g.resize((x1 - x0, y1 - y0), Image.BICUBIC)
    out = blank()
    out.paste(g, (x0, y0))
    return out


def clip(layer, mask):
    out = blank()
    out.paste(layer, (0, 0), ImageChops.multiply(layer.getchannel("A"), mask))
    return out


def stroke_path(points, width, fill, curve=None):
    """Draw a polyline with round joins at K× and downsample. `curve` adds a quarter arc."""
    im = Image.new("RGBA", (S * K, S * K), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    pts = [(x * K, y * K) for x, y in points]
    d.line(pts, fill=fill, width=int(width * K), joint="curve")
    r = width * K / 2
    for x, y in (pts[0], pts[-1]):
        d.ellipse((x - r, y - r, x + r, y + r), fill=fill)
    return im.resize((S, S), Image.LANCZOS)


LIGHT = np.array([-0.5, -0.62, 0.6])
LIGHT = LIGHT / np.linalg.norm(LIGHT)
HALF = (LIGHT + np.array([0, 0, 1.0])) / np.linalg.norm(LIGHT + np.array([0, 0, 1.0]))


def shade(nx, ny, nz, base, ambient=0.34, diffuse=0.78, spec_power=38, spec=0.75):
    """Blinn-Phong on per-pixel normals; returns float RGB in 0..255."""
    lam = np.clip(nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2], 0, 1)
    sp = np.clip(nx * HALF[0] + ny * HALF[1] + nz * HALF[2], 0, 1) ** spec_power
    rgb = np.array(base, dtype=float)[None, None, :] * (ambient + diffuse * lam)[..., None] + 255 * spec * sp[..., None]
    return np.clip(rgb, 0, 255)


def shaded_tube(points, radius, base, ss=2):
    """A cylinder along a polyline, lit per pixel: no seams at joints, true highlights."""
    pts = np.array(points, dtype=float) * ss
    R = radius * ss
    x0, y0 = pts.min(0) - R - 4
    x1, y1 = pts.max(0) + R + 4
    xs, ys = np.meshgrid(np.arange(int(x0), int(x1)), np.arange(int(y0), int(y1)))
    px, py = xs + 0.5, ys + 0.5
    best_d = np.full(px.shape, np.inf)
    vx = np.zeros(px.shape)
    vy = np.zeros(px.shape)
    for (ax, ay), (bx, by) in zip(pts[:-1], pts[1:]):
        dx, dy = bx - ax, by - ay
        t = np.clip(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy), 0, 1)
        ox, oy = px - (ax + t * dx), py - (ay + t * dy)
        d = np.hypot(ox, oy)
        m = d < best_d
        best_d = np.where(m, d, best_d)
        vx = np.where(m, ox, vx)
        vy = np.where(m, oy, vy)
    inside = np.clip(R - best_d + 0.5, 0, 1)
    r = np.clip(best_d / R, 0, 0.999)
    nz = np.sqrt(1 - r * r)
    with np.errstate(invalid="ignore", divide="ignore"):
        nx = np.where(best_d > 0, vx / best_d * r, 0)
        ny = np.where(best_d > 0, vy / best_d * r, 0)
    rgb = shade(nx, ny, nz, base)
    rgba = np.dstack([rgb, inside * 255]).astype(np.uint8)
    tile = Image.fromarray(rgba, "RGBA")
    big = Image.new("RGBA", (S * ss, S * ss), (0, 0, 0, 0))
    big.paste(tile, (int(x0), int(y0)))
    return big.resize((S, S), Image.LANCZOS)


def shaded_ring(cx, cy, r_outer, r_inner, base, ss=2):
    """A concrete pipe section seen end-on: the wall is lit like a rounded bevel."""
    c = np.array([cx, cy]) * ss
    ro, ri = r_outer * ss, r_inner * ss
    x0, y0 = (c - ro - 4).astype(int)
    size = int(2 * ro + 8)
    xs, ys = np.meshgrid(np.arange(x0, x0 + size), np.arange(y0, y0 + size))
    dx, dy = xs + 0.5 - c[0], ys + 0.5 - c[1]
    d = np.hypot(dx, dy)
    mid, half = (ro + ri) / 2, (ro - ri) / 2
    t = np.clip((d - mid) / half, -0.999, 0.999)
    alpha = np.clip(ro - d + 0.5, 0, 1) * np.clip(d - ri + 0.5, 0, 1)
    nz = np.sqrt(1 - t * t)
    with np.errstate(invalid="ignore", divide="ignore"):
        nx = np.where(d > 0, dx / d * t, 0)
        ny = np.where(d > 0, dy / d * t, 0)
    rgb = shade(nx, ny, nz, base, ambient=0.42, diffuse=0.7, spec_power=24, spec=0.45)
    tile = Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), "RGBA")
    big = Image.new("RGBA", (S * ss, S * ss), (0, 0, 0, 0))
    big.paste(tile, (int(x0), int(y0)))
    return big.resize((S, S), Image.LANCZOS)


def pipe_centerline():
    """Down from under the house, a quarter bend, then across to the city sewer."""
    x0, top, bend_r, y_run, x_end = 700, GROUND_Y - 60, 250, 1520, 1360
    pts = [(x0, top), (x0, y_run - bend_r)]
    for i in range(1, 41):
        a = math.pi - (math.pi / 2) * (i / 40)  # 180° → 90° around the bend centre
        cx, cy = x0 + bend_r, y_run - bend_r
        pts.append((cx + bend_r * math.cos(a), cy + bend_r * math.sin(a)))
    pts.append((x_end, y_run))
    return pts, y_run


# ---- engraving along the frame (same algorithm as TokNotch) ----
def ring_point(distance, box, radius):
    x0, y0, x1, y1 = box
    width, height = x1 - x0 - 2 * radius, y1 - y0 - 2 * radius
    arc = math.pi * radius / 2
    segments = [
        ("line", (x0 + radius + width / 2, y0), (x1 - radius, y0), width / 2),
        ("arc", (x1 - radius, y0 + radius), -90, 0, arc),
        ("line", (x1, y0 + radius), (x1, y1 - radius), height),
        ("arc", (x1 - radius, y1 - radius), 0, 90, arc),
        ("line", (x1 - radius, y1), (x0 + radius, y1), width),
        ("arc", (x0 + radius, y1 - radius), 90, 180, arc),
        ("line", (x0, y1 - radius), (x0, y0 + radius), height),
        ("arc", (x0 + radius, y0 + radius), 180, 270, arc),
        ("line", (x0 + radius, y0), (x0 + radius + width / 2, y0), width / 2),
    ]
    distance %= sum(s[-1] for s in segments)
    for seg in segments:
        if distance <= seg[-1]:
            share = distance / seg[-1]
            if seg[0] == "line":
                (ax, ay), (bx, by) = seg[1], seg[2]
                return ax + (bx - ax) * share, ay + (by - ay) * share, math.degrees(math.atan2(by - ay, bx - ax))
            (cx, cy), start, end = seg[1], seg[2], seg[3]
            angle = math.radians(start + (end - start) * share)
            return cx + radius * math.cos(angle), cy + radius * math.sin(angle), math.degrees(angle) + 90
        distance -= seg[-1]
    raise ValueError


def engrave(canvas, text, position, upright):
    k = 2
    font = ImageFont.truetype(FONT_PATH, FONT_SIZE * k)
    box = (OUTER[0] + F / 2, OUTER[1] + F / 2, OUTER[2] - F / 2, OUTER[3] - F / 2)
    radius = (OUTER_R + INNER_R) / 2
    perimeter = 2 * (box[2] - box[0] - 2 * radius) + 2 * (box[3] - box[1] - 2 * radius) + 2 * math.pi * radius
    widths = [font.getlength(ch) / k for ch in text]
    total = sum(widths) + TRACKING * (len(text) - 1)
    direction = -1 if upright else 1
    cursor = position * perimeter - direction * total / 2
    layer = Image.new("RGBA", (S * k, S * k), (0, 0, 0, 0))
    for ch, w in zip(text, widths):
        x, y, angle = ring_point(cursor + direction * w / 2, box, radius)
        if upright:
            angle += 180
        side = FONT_SIZE * 2 * k
        glyph = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        ImageDraw.Draw(glyph).text((side / 2, side / 2), ch, font=font, fill=ENGRAVING, anchor="mm")
        glyph = glyph.rotate(-angle, resample=Image.BICUBIC)
        layer.alpha_composite(glyph, (int(x * k - side / 2), int(y * k - side / 2)))
        cursor += direction * (w + TRACKING)
    return Image.alpha_composite(canvas, layer.resize((S, S), Image.LANCZOS))


def build():
    frame_mask = rr_mask(OUTER, OUTER_R)
    inner_mask = rr_mask(INNER, INNER_R)
    cv = blank()
    cv.paste(Image.new("RGBA", (S, S), FRAME_RGB + (255,)), (0, 0), frame_mask)

    # Panel: dusk above ground, deep water-teal below.
    sky = vertical_gradient((INNER[0], INNER[1], INNER[2], GROUND_Y), [(0, (58, 84, 100)), (1, (30, 50, 62))])
    earth = vertical_gradient((INNER[0], GROUND_Y, INNER[2], INNER[3]), [(0, (16, 78, 90)), (0.55, (9, 52, 61)), (1, (5, 30, 36))])
    panel = Image.alpha_composite(sky, earth)
    cv = Image.alpha_composite(cv, clip(panel, inner_mask))

    # Faint strata underground.
    strata = blank()
    sd = ImageDraw.Draw(strata)
    for i, y in enumerate((1010, 1230, 1690)):
        sd.line((INNER[0], y, INNER[2], y), fill=(160, 214, 222, 16 - i * 3), width=4)
    cv = Image.alpha_composite(cv, clip(strata, inner_mask))

    # Ground line with a warm glow.
    glow = blank()
    ImageDraw.Draw(glow).rectangle((INNER[0], GROUND_Y - 8, INNER[2], GROUND_Y + 8), fill=(246, 222, 180, 150))
    glow = glow.filter(ImageFilter.GaussianBlur(26))
    cv = Image.alpha_composite(cv, clip(glow, inner_mask))
    ground = blank()
    ImageDraw.Draw(ground).rectangle((INNER[0], GROUND_Y - 6, INNER[2], GROUND_Y + 6), fill=(244, 233, 213, 255))
    cv = Image.alpha_composite(cv, clip(ground, inner_mask))

    pts, y_run = pipe_centerline()
    mx, my, mr = 1490, 1520, 196
    W = 118

    # The trace: warm glow under the ground, then the lit tube (drawn before the house covers its top).
    trace_glow = stroke_path(pts, W + 90, (255, 150, 60, 110)).filter(ImageFilter.GaussianBlur(56))
    below = rr_mask((INNER[0], GROUND_Y + 8, INNER[2], INNER[3]), 0)
    cv = Image.alpha_composite(cv, clip(clip(trace_glow, inner_mask), below))
    cv = Image.alpha_composite(cv, shaded_tube(pts, W / 2, (232, 136, 44)))

    # House: cream silhouette standing on the ground line, with a soft top-to-bottom falloff.
    hx0, hx1, body_h, roof_h = 520, 880, 250, 200
    house = blank()
    hd = ImageDraw.Draw(house)
    hd.polygon([(hx0 - 34, GROUND_Y - body_h + 6), ((hx0 + hx1) / 2, GROUND_Y - body_h - roof_h), (hx1 + 34, GROUND_Y - body_h + 6)], fill=(255, 255, 255, 255))
    hd.rectangle((hx0, GROUND_Y - body_h, hx1, GROUND_Y - 4), fill=(255, 255, 255, 255))
    tint = vertical_gradient((hx0 - 40, GROUND_Y - body_h - roof_h, hx1 + 40, GROUND_Y), [(0, (252, 247, 238)), (1, (222, 210, 190))])
    house = clip(tint, house.getchannel("A"))
    door = blank()
    ImageDraw.Draw(door).rounded_rectangle(((hx0 + hx1) / 2 - 42, GROUND_Y - 150, (hx0 + hx1) / 2 + 42, GROUND_Y - 4), radius=10, fill=(30, 50, 62, 255))
    cv = Image.alpha_composite(cv, house)
    cv = Image.alpha_composite(cv, door)
    # Ground line drawn again over the tube and house base so everything sits on it.
    cv = Image.alpha_composite(cv, clip(ground, inner_mask))

    # City sewer, end-on: dark bore, water, then the lit concrete wall over the tube's end.
    bore_r = mr * 0.7
    bore = blank()
    ImageDraw.Draw(bore).ellipse((mx - bore_r, my - bore_r, mx + bore_r, my + bore_r), fill=(7, 21, 27, 255))
    cv = Image.alpha_composite(cv, bore)
    water = vertical_gradient((int(mx - bore_r), int(my + 22), int(mx + bore_r), int(my + bore_r)), [(0, (70, 176, 190)), (1, (10, 70, 82))])
    cv = Image.alpha_composite(cv, clip(water, bore.getchannel("A")))
    meniscus = blank()
    ImageDraw.Draw(meniscus).line((mx - bore_r, my + 24, mx + bore_r, my + 24), fill=(160, 232, 240, 230), width=6)
    cv = Image.alpha_composite(cv, clip(meniscus, bore.getchannel("A")))
    cv = Image.alpha_composite(cv, shaded_ring(mx, my, mr, bore_r, (196, 206, 209)))

    # Soft top-left highlight and rim light on the panel.
    hl = blank()
    ImageDraw.Draw(hl).ellipse((INNER[0] - 300, INNER[1] - 520, INNER[0] + 1180, INNER[1] + 900), fill=(255, 255, 255, 30))
    cv = Image.alpha_composite(cv, clip(hl.filter(ImageFilter.GaussianBlur(210)), inner_mask))
    rim_light = blank()
    ImageDraw.Draw(rim_light).rounded_rectangle(INNER, radius=INNER_R, outline=(255, 255, 255, 64), width=4)
    cv = Image.alpha_composite(cv, rim_light)

    cv = engrave(cv, NAME, 0.875, False)
    cv = engrave(cv, SIGNATURE, 0.375, True)
    cv = Image.composite(cv, blank(), frame_mask)

    shadow = blank()
    shadow.paste(Image.new("RGBA", (S, S), (0, 0, 0, 85)), (0, 0), frame_mask)
    shadow = shadow.filter(ImageFilter.GaussianBlur(42)).transform(shadow.size, Image.AFFINE, (1, 0, 0, 0, 1, -20))
    return Image.alpha_composite(shadow, cv)


if __name__ == "__main__":
    icon = build()
    os.makedirs(os.path.join(ROOT, "public/brand"), exist_ok=True)
    outputs = {
        "src/app/icon.png": 512,
        "src/app/apple-icon.png": 180,
        "public/brand/icon-1024.png": 1024,
        "public/brand/icon-256.png": 256,
        "public/brand/icon-128.png": 128,
    }
    for path, size in outputs.items():
        icon.resize((size, size), Image.LANCZOS).save(os.path.join(ROOT, path), optimize=True)
        print(f"{path} ({size}px)")
