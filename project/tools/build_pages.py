"""Assemble the five preview pages: the live page's own header and footer, with the new product section in <main>.

python3 build_pages.py [render_dir]
"""
import json, os, sys, shutil
from PIL import Image

ROOT = "/home/claude/apexsx"
SITE = f"{ROOT}/site"
RENDERS = sys.argv[1] if len(sys.argv) > 1 else f"{ROOT}/renders/final"
shell = json.load(open(f"{ROOT}/data/shell.json", encoding="utf-8"))

# stage renders -> webp
os.makedirs(f"{SITE}/assets/stage", exist_ok=True)
for name in ["ring-wide", "ring-tall", "steps-wide", "plinth-wide", "plinth-tall"]:
    png = f"{RENDERS}/{name}.png"
    if not os.path.exists(png):
        print("missing", name); continue
    im = Image.open(png).convert("RGB")
    im.save(f"{SITE}/assets/stage/{name}.webp", "WEBP", quality=86, method=6)
    shutil.copy(f"{RENDERS}/{name}.json", f"{SITE}/assets/stage/{name}.json")

# stage spots and body mesh as plain scripts, so the preview also opens straight from the folder (file://)
import base64, glob
stages = {os.path.basename(f)[:-5]: json.load(open(f)) for f in glob.glob(f"{SITE}/assets/stage/*.json")}
open(f"{SITE}/assets/stage/stages.js", "w").write("window.APEX_STAGES=" + json.dumps(stages) + ";\n")
b64 = base64.b64encode(open(f"{SITE}/assets/data/bodies.bin", "rb").read()).decode()
open(f"{SITE}/assets/data/bodies.js", "w").write("/* MakeHuman CC0 mesh, same file as the Apex Surgery body map */\nwindow.APEX_BODY_B64='" + b64 + "';\n")

VERSIONS = [
    ("v1-category-ring", "v1.js", "Category ring"),
    ("v2-routine-shelf", "v2.js", "Routine shelf"),
    ("v3-scroll-spotlight", "v3.js", "Scroll spotlight"),
    ("v4-skin-map", "v4.js", "Skin map"),
    ("v5-ring-and-routine", "v5.js", "Featured ring and routine shelf"),
]

VER = "20261022"


def page(folder, script):
    r = "../"
    before = shell["before"].replace("{{ROOT}}", r).replace("{{ROOTESC}}", r.replace("/", "\\/"))
    after = shell["after"].replace("{{ROOT}}", r).replace("{{ROOTESC}}", r.replace("/", "\\/"))
    before = before.replace("</head>", f'<link rel="stylesheet" href="{r}assets/css/apex-shop.css?v={VER}">\n'
                                       '<meta name="robots" content="noindex, nofollow">\n</head>', 1)
    main = '<main id="content" class="site-main"><div class="ax" id="ax-root"></div></main>'
    scripts = (f'<script src="{r}assets/js/products.js?v={VER}"></script>\n'
               f'<script src="{r}assets/stage/stages.js?v={VER}"></script>\n'
               + (f'<script src="{r}assets/data/bodies.js?v={VER}"></script>\n' if script == "v4.js" else "") +
               f'<script src="{r}assets/js/apex-shop.js?v={VER}" data-img="{r}assets/img/" data-stage="{r}assets/stage/"></script>\n'
               f'<script src="{r}assets/js/v/parts.js?v={VER}"></script>\n'
               f'<script src="{r}assets/js/v/{script}?v={VER}" data-bin="{r}assets/data/bodies.bin"></script>\n')
    after = after.replace("</body>", scripts + "</body>", 1)
    os.makedirs(f"{SITE}/{folder}", exist_ok=True)
    open(f"{SITE}/{folder}/index.html", "w", encoding="utf-8").write(before + main + after)


for folder, script, _ in VERSIONS:
    page(folder, script)

# original page for side-by-side comparison
o = (shell["before"] + shell["main"] + shell["after"]).replace("{{ROOT}}", "../").replace("{{ROOTESC}}", "..\\/")
os.makedirs(f"{SITE}/original", exist_ok=True)
open(f"{SITE}/original/index.html", "w", encoding="utf-8").write(o)
if os.path.exists(f"{SITE}/original.html"):
    os.remove(f"{SITE}/original.html")
print("built", [v[0] for v in VERSIONS])
