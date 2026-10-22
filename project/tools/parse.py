import json, re, sys, os
from bs4 import BeautifulSoup
SRC = sys.argv[1]; OUT = sys.argv[2]
import html as H
API=json.load(open("/home/claude/apexsx/src/store_api.json"))
order=[p["slug"] for p in API]
_old = ["double-cleanser","face-wash-foam","acne-pro-powder-lotion","acne-pro-sunscreen-spf50-pa","acne-pro-serum-plus","acne-pro-whip-foam","gluta-o","femm-serum","white-up-cream","anti-cellulite-cream","body-focus-cream","moist-up-cream","ultimate-sun-protection-spf50-pa","peptides-sunscreen-spf50-pa","clear-dark-spot-cream","white-focus-serum"]
def local(u):
    u = re.sub(r'-\d+x\d+(\.\w+)$', r'\1', u)
    return u.split("/uploads/")[1].replace("/", "_")
out = []
for slug in order:
    raw = open(os.path.join(SRC, slug + ".html"), encoding="utf-8").read()
    s = BeautifulSoup(raw, "html.parser")
    prod = s.select_one("div.product[id^=product-]") or s.select_one("[class*=product_cat-]")
    cls = prod.get("class", []) if prod else []
    cats = [c[len("product_cat-"):] for c in cls if c.startswith("product_cat-")]
    pid = prod.get("id","").replace("product-","") if prod else None
    gallery = []
    for d in s.select(".woocommerce-product-gallery__image"):
        a = d.find("a"); img = d.find("img")
        u = (img.get("data-large_image") if img else None) or (a.get("href") if a else None)
        if u and local(u) not in gallery: gallery.append(local(u))
    for t in s(["script","style","noscript","svg"]): t.decompose()
    lines = [l.replace("\xa0"," ").strip() for l in s.body.get_text("\n", strip=True).split("\n")]
    name_i = max(i for i,l in enumerate(lines) if l.startswith("/ "))
    name = lines[name_i+1]
    crumb = lines[name_i-1]
    price = None
    for j in range(name_i+2, name_i+8):
        if lines[j] == "฿": price = "฿" + lines[j+1]; break
    k = (lines.index(price[1:], name_i) + 1) if price else name_i + 2
    short = []
    while k < len(lines) and not lines[k].startswith("จำนวน") and lines[k] not in ("ติดต่อสอบถาม","รายละเอียด"): short.append(lines[k]); k += 1
    fda = next((l for l in lines if l.startswith("หมายเลขใบอนุญาต")), None)
    def section(start, ends):
        try: a = lines.index(start) + 1
        except ValueError: return None
        b = a
        while b < len(lines) and lines[b] not in ends: b += 1
        return lines[a:b]
    ends = {"ส่วนผสมสำคัญ (Key Ingredients)","วิธีใช้ (How to Use)","ผลิตภัณฑ์ใกล้เคียงที่น่าสนใจ","สกินแคร์ที่พัฒนาจากความเข้าใจในผิว"}
    desc = section("รายละเอียด", ends)
    key = section("ส่วนผสมสำคัญ (Key Ingredients)", ends)
    how = section("วิธีใช้ (How to Use)", ends)
    rel = section("ผลิตภัณฑ์ใกล้เคียงที่น่าสนใจ", {"สกินแคร์ที่พัฒนาจากความเข้าใจในผิว"}) or []
    related = [rel[i] for i in range(len(rel)) if i+1 < len(rel) and rel[i+1] == "฿"]
    api = next(a for a in API if a["slug"]==slug)
    main_img = local(api["images"][0]["src"]) if api["images"] else (gallery[0] if gallery else None)
    if main_img and main_img not in gallery: gallery.insert(0, main_img)
    out.append(dict(main_image=main_img, price_num=int(api["prices"]["price"])//100, categories=[c["name"] for c in api["categories"]], slug=slug, id=pid, url=f"https://www.apexsxskin.com/product/{slug}/", name=H.unescape(api["name"]), price=price,
        category_crumb=crumb, category_slugs=cats, short_description="\n".join(short), fda=fda,
        description=desc, key_ingredients=key, how_to_use=how, related=related, gallery=gallery))
json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for p in out:
    print(p["slug"], "|", p["name"], p["price"], "|", p["category_crumb"], p["category_slugs"], "| desc", len(p["description"] or []), "key", bool(p["key_ingredients"]), "how", bool(p["how_to_use"]), "| gal", len(p["gallery"]), "| rel", len(p["related"]))
