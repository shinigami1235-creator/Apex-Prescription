"""Build shared assets for the ApexSx product page previews.

- product cutouts -> site/assets/img/p/<slug>.webp (max 900px tall)
- gallery posters -> site/assets/img/g/<file>.webp (max 1080px)
- data          -> site/assets/js/products.js (all 28 products, Thai text verbatim)
"""
import json, os, re
from PIL import Image

ROOT = "/home/claude/apexsx"
SITE = f"{ROOT}/site"
os.makedirs(f"{SITE}/assets/img/p", exist_ok=True)
os.makedirs(f"{SITE}/assets/img/g", exist_ok=True)
os.makedirs(f"{SITE}/assets/js", exist_ok=True)

P = json.load(open(f"{ROOT}/data/products.json", encoding="utf-8"))
SIZES = json.load(open(f"{ROOT}/data/sizes.json"))

# Curation for the preview. None of this comes from the live site: Apex should confirm it.
FEATURED = ["acne-pro-serum-plus", "white-focus-serum", "peptides-sunscreen-spf50-pa", "age-focus-serum-plus",
            "moist-up-cream", "double-cleanser"]

ROUTINES = [
    {"id": "acne", "label": "Acne", "th": "สิว",
     "steps": [("Cleanse", "acne-pro-whip-foam"), ("Treat", "acne-pro-serum-plus"),
               ("Spot", "acne-pro-powder-lotion"), ("Protect", "acne-pro-sunscreen-spf50-pa")]},
    {"id": "spots", "label": "Dark spots", "th": "ฝ้า กระ จุดด่างดำ",
     "steps": [("Cleanse", "face-wash-foam"), ("Serum", "white-focus-serum"),
               ("Spot", "clear-dark-spot-cream"), ("Protect", "peptides-sunscreen-spf50-pa")]},
    {"id": "aging", "label": "Anti-aging", "th": "ริ้วรอย",
     "steps": [("Tone", "a-reju-water"), ("Serum", "age-focus-serum-plus"),
               ("Cream", "age-focus-cream"), ("Protect", "ultimate-sun-protection-spf50-pa")]},
    {"id": "dry", "label": "Dry skin", "th": "ผิวแห้ง",
     "steps": [("Cleanse", "double-cleanser"), ("Serum", "a-reju-serum"),
               ("Moisturize", "moist-up-cream"), ("Protect", "ultimate-sun-protection-spf50-pa")]},
    {"id": "body", "label": "Body", "th": "ผิวกาย",
     "steps": [("Inside", "gluta-o"), ("Brighten", "white-up-cream"),
               ("Firm", "body-focus-cream"), ("Smooth", "anti-cellulite-cream")]},
    {"id": "hair", "label": "Hair loss", "th": "ผมร่วง",
     "steps": [("Shampoo", "pro-clarifying-shampoo"), ("Condition", "pro-densifying-conditioner"),
               ("Serum", "total-hair-serum"), ("Inside", "h-10")]},
]

# Skin-map areas: which products each body area shows, taken from each product's own "how to use".
AREAS = [
    {"id": "face", "label": "Face", "regions": [1], "part": "face",
     "groups": [("Cleanse", ["double-cleanser", "face-wash-foam", "clear-toner"]),
                ("Acne", ["acne-pro-whip-foam", "acne-pro-serum-plus", "acne-pro-powder-lotion", "acne-pro-sunscreen-spf50-pa"]),
                ("Dark spots", ["white-focus-serum", "clear-dark-spot-cream"]),
                ("Anti-aging", ["a-reju-water", "a-reju-serum", "advance-night-serum", "age-focus-serum-plus", "age-focus-cream"]),
                ("Eyes", ["total-eye-serum"]),
                ("Moisture", ["moist-up-cream"]),
                ("Sun", ["ultimate-sun-protection-spf50-pa", "peptides-sunscreen-spf50-pa"])]},
    {"id": "hair", "label": "Hair and scalp", "regions": [1], "part": "scalp",
     "groups": [("", ["pro-clarifying-shampoo", "pro-densifying-conditioner", "revitalizer-cleanser", "total-hair-serum", "h-10"])]},
    {"id": "arms", "label": "Underarms and elbows", "regions": [5],
     "groups": [("", ["white-up-cream"])]},
    {"id": "body", "label": "Body", "regions": [3, 4, 6],
     "groups": [("", ["body-focus-cream", "gluta-o"])]},
    {"id": "hips", "label": "Hips, thighs and intimate area", "regions": [7, 8],
     "groups": [("", ["anti-cellulite-cream", "femm-serum", "white-up-cream"])]},
]


def save_cutout(slug):
    src = f"{ROOT}/cutouts/{slug}.png"
    dst = f"{SITE}/assets/img/p/{slug}.webp"
    im = Image.open(src).convert("RGBA")
    if im.height > 900:
        im = im.resize((round(im.width * 900 / im.height), 900), Image.LANCZOS)
    im.save(dst, "WEBP", quality=88, method=6)
    return im.width / im.height


def save_poster(fn):
    src = f"{ROOT}/src/images/{fn}"
    out = re.sub(r"^\d{4}_\d{2}_", "", fn).rsplit(".", 1)[0] + ".webp"
    dst = f"{SITE}/assets/img/g/{out}"
    if not os.path.exists(dst):
        im = Image.open(src).convert("RGB")
        if max(im.size) > 1080:
            im.thumbnail((1080, 1080), Image.LANCZOS)
        im.save(dst, "WEBP", quality=82, method=6)
    return out


def money(n):
    return f"฿{n:,.2f}"


out = []
for p in P:
    ratio = save_cutout(p["slug"])
    posters = [save_poster(f) for f in p["gallery"] if f != p["main_image"]]
    out.append({
        "id": int(p["id"]) if p["id"] else None,
        "slug": p["slug"],
        "name": p["name"],
        "price": p["price_num"] or None,
        "priceText": money(p["price_num"]) if p["price_num"] else None,
        "cat": p["categories"][0],
        "short": p["short_description"].split("\nหมายเลขใบอนุญาต")[0].strip(),
        "fda": (p["fda"] or "").replace("หมายเลขใบอนุญาต/อย.", "").strip() or None,
        "desc": p["description"] or [],
        "key": p["key_ingredients"] or [],
        "how": p["how_to_use"] or [],
        "related": p["related"],
        "url": p["url"],
        "img": f"p/{p['slug']}.webp",
        "ratio": round(ratio, 4),
        "cm": SIZES[p["slug"]],
        "posters": [f"g/{x}" for x in posters],
    })

# Short descriptions sometimes carry the FDA line inside them on the live site; pull it out.
for o, p in zip(out, P):
    m = re.search(r"หมายเลขใบอนุญาต/อย\.\s*([\d\-]+)", p["short_description"])
    if m and not o["fda"]:
        o["fda"] = m.group(1)

CATS = ["Acne Care", "Anti-Aging", "Body Care", "Cleansing", "Hair Care", "Moisturizer", "Protection", "Whitening"]
data = {"products": out, "cats": CATS, "featured": FEATURED, "routines": ROUTINES, "areas": AREAS,
        "liveBase": "https://www.apexsxskin.com"}
js = "/* Generated by tools/build_assets.py from the live apexsxskin.com product pages. Thai text is verbatim. */\n"
js += "window.APEX = " + json.dumps(data, ensure_ascii=False, indent=0) + ";\n"
open(f"{SITE}/assets/js/products.js", "w", encoding="utf-8").write(js)

slugs = {o["slug"] for o in out}
for r in ROUTINES:
    for _, s in r["steps"]:
        assert s in slugs, s
for a in AREAS:
    for _, g in a["groups"]:
        for s in g:
            assert s in slugs, s
for s in FEATURED:
    assert s in slugs, s
print("products", len(out), "posters", len(os.listdir(f"{SITE}/assets/img/g")),
      "js KB", round(os.path.getsize(f"{SITE}/assets/js/products.js") / 1024))
