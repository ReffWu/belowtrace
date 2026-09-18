#!/usr/bin/env python3
"""Link-preview image (1200x630) for social sharing: the icon plus the one-line promise.
Requires Pillow and public/brand/icon-1024.png (scripts/make-icon.py). Writes src/app/opengraph-image.png."""
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1200, 630
BOLD = "/Library/Fonts/SF-Pro-Display-Bold.otf"
REGULAR = "/Library/Fonts/SF-Pro-Display-Regular.otf"

im = Image.new("RGB", (W, H), (246, 243, 236))
d = ImageDraw.Draw(im)
icon = Image.open(os.path.join(ROOT, "public/brand/icon-1024.png")).convert("RGBA").resize((400, 400), Image.LANCZOS)
im.paste(icon, (70, 115), icon)

x = 520
d.text((x, 150), "BELOWTRACE DETROIT", font=ImageFont.truetype(BOLD, 26), fill=(180, 95, 6))
title = ImageFont.truetype(BOLD, 66)
d.text((x, 196), "Sewage in your", font=title, fill=(21, 33, 43))
d.text((x, 272), "basement?", font=title, fill=(21, 33, 43))
d.text((x, 348), "Start here.", font=title, fill=(13, 92, 107))
body = ImageFont.truetype(REGULAR, 28)
d.text((x, 446), "Who's responsible, which City programs", font=body, fill=(70, 83, 94))
d.text((x, 484), "might pay, and your deadlines, for any", font=body, fill=(70, 83, 94))
d.text((x, 522), "Detroit address.", font=body, fill=(70, 83, 94))
im.save(os.path.join(ROOT, "src/app/opengraph-image.png"), optimize=True)
print("src/app/opengraph-image.png")
