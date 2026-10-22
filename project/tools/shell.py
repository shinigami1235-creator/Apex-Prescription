"""Split the live listing page into head / header / footer with local asset paths."""
import re, json, sys
SRC="/mnt/user-data/uploads/Websites/Apex SX Skin/source/pages/_listing.html"
h=open(SRC,encoding="utf-8").read()
h=re.sub(r"https://www\.apexsxskin\.com/(wp-content|wp-includes)/", r"{{ROOT}}\1/", h)
h=re.sub(r"(\{\{ROOT\}\}[^'\"\s\)]+?)\?ver=[^'\"\s\)&]+", r"\1", h)
h=h.replace("https:\\/\\/www.apexsxskin.com\\/wp-content\\/plugins\\/", "{{ROOTESC}}wp-content\\/plugins\\/")
a=h.index('<main id="content"'); b=h.index("</main>")+len("</main>")
shell={"before":h[:a], "after":h[b:], "main":h[a:b]}
json.dump(shell, open("data/shell.json","w",encoding="utf-8"), ensure_ascii=False)
print(len(shell["before"]), len(shell["main"]), len(shell["after"]))
