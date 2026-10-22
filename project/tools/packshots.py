"""Replace cutouts with Apex's official packshots (Google Drive APEX-SX_Live_PackShot) where one exists."""
import os, numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
SRC = "/mnt/user-data/uploads/Websites/Apex SX Skin/source/packshots"
OUT = "/home/claude/apexsx/cutouts"
MAP = {"01_White Up Cream.png": "white-up-cream", "02_A-Reju Water.png": "a-reju-water", "03_Acne Pro Powder Lotion.png": "acne-pro-powder-lotion",
 "05_Gluta-O.png": "gluta-o", "07_A-Reju Serum.png": "a-reju-serum", "08_Total Eye Serum.png": "total-eye-serum", "09_Femm Serum.png": "femm-serum",
 "10_Clear Dark Spot Cream.png": "clear-dark-spot-cream", "11_Body Focus Cream.png": "body-focus-cream", "12_Age Focus Cream.png": "age-focus-cream",
 "13_Total Hair Serum.png": "total-hair-serum", "14_Anti-Cellulite Cream.png": "anti-cellulite-cream", "15_Ultimate Sun Protection.png": "ultimate-sun-protection-spf50-pa",
 "16_H10.png": "h-10", "17_Age Focus Serum Plus.png": "age-focus-serum-plus", "18_Peptides Sunscreen.png": "peptides-sunscreen-spf50-pa",
 "19_Moist Up Cream.png": "moist-up-cream", "20_White Focus Serum.png": "white-focus-serum", "21_Acne Pro Serum Plus.png": "acne-pro-serum-plus",
 "22_Advance Night Serum.png": "advance-night-serum", "23_Acne Pro Sunscreen.png": "acne-pro-sunscreen-spf50-pa", "24_Acne Pro Wipe Foam.png": "acne-pro-whip-foam",
 "25_Face Wash Foam.png": "face-wash-foam", "26_Pro-Clarifying Shampoo.png": "pro-clarifying-shampoo", "27_Pro-Densifying Conditioner.png": "pro-densifying-conditioner"}
NO_STRAIGHTEN = {"gluta-o", "h-10"}
for f, slug in MAP.items():
    im = Image.open(os.path.join(SRC, f)).convert("RGBA")
    if max(im.size) > 2400: im.thumbnail((2400, 2400), Image.LANCZOS)
    im = im.crop(im.getchannel("A").point(lambda x: 255 if x > 8 else 0).getbbox())
    a = np.array(im)[:, :, 3]; ys, xs = np.nonzero(a > 128)
    pts = np.stack([xs, ys], 1).astype(float); pts -= pts.mean(0)
    w, v = np.linalg.eigh(np.cov(pts.T)); ax = v[:, np.argmax(w)]
    ang = np.degrees(np.arctan2(ax[0], ax[1])); ang = ang - 180 if ang > 90 else ang + 180 if ang < -90 else ang
    elong = np.sqrt(w.max() / w.min()); rot = 0.0
    if slug not in NO_STRAIGHTEN and elong > 1.6 and 3 < abs(ang) < 60:
        rot = -ang; im = im.rotate(rot, resample=Image.BICUBIC, expand=True)
        im = im.crop(im.getchannel("A").point(lambda x: 255 if x > 8 else 0).getbbox())
    if im.height > 1400: im = im.resize((round(im.width * 1400 / im.height), 1400), Image.LANCZOS)
    im.save(os.path.join(OUT, slug + ".png"))
    print(f"{slug:36s} {im.size} rot {rot:.1f}")
