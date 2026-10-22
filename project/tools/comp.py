"""Composite product cutouts onto a stage render using the exported spots (draft previews)."""
import json, sys, math
from PIL import Image, ImageFilter, ImageDraw
CUT="/home/claude/apexsx/cutouts/"
def shadow(base, cx, fy, w):
    sh=Image.new("L", base.size, 0); d=ImageDraw.Draw(sh)
    d.ellipse([cx-w*0.62, fy-w*0.14, cx+w*0.62, fy+w*0.12], fill=120)
    sh=sh.filter(ImageFilter.GaussianBlur(w*0.10))
    dark=Image.new("RGBA", base.size, (40,25,70,255)); dark.putalpha(sh)
    base.alpha_composite(dark)
SIZES=json.load(open("/home/claude/apexsx/data/sizes.json"))
def units(slug, k=2.1): return k*(SIZES[slug]/14)**0.75
def place(base, slug, foot, unit_h, height_units):
    height_units = units(slug, height_units)
    W,H=base.size
    c=Image.open(CUT+slug+".png").convert("RGBA")
    ph=int(unit_h*H*height_units); pw=int(c.width*ph/c.height)
    c=c.resize((pw,ph), Image.LANCZOS)
    fx,fy=foot[0]*W, foot[1]*H
    shadow(base, fx, fy, pw)
    base.alpha_composite(c, (int(fx-pw/2), int(fy-ph+ph*0.01)))
if __name__=="__main__":
    stage, png, out = sys.argv[1], sys.argv[2], sys.argv[3]
    sp=json.load(open(png.replace(".png",".json")))
    base=Image.open(png).convert("RGBA")
    if stage=="ring":
        slugs=["acne-pro-serum-plus","white-focus-serum","moist-up-cream","peptides-sunscreen-spf50-pa","double-cleanser","age-focus-cream","acne-pro-whip-foam"]
        n=len(slugs); items=[]
        for i,s in enumerate(slugs):
            a=2*math.pi*i/n
            k=int(round(a/(2*math.pi)*72))%72; pt=sp["ring"][k]
            items.append((pt["foot"][1], s, pt))
        for _,s,pt in sorted(items):
            place(base, s, pt["foot"], pt["unit_h"], 2.1)
    elif stage=="shelf":
        for s,st in zip(["acne-pro-whip-foam","acne-pro-serum-plus","acne-pro-powder-lotion","acne-pro-sunscreen-spf50-pa"], sp["steps"]):
            place(base, s, st["foot"], st["unit_h"], 1.9)
    elif stage=="plinth":
        place(base, "white-focus-serum", sp["foot"], sp["unit_h"], 2.4)
    base.convert("RGB").save(out, quality=88)
