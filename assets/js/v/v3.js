/* Version 3: scroll spotlight, one product per category on the plinth */
(function () {
  const { D, BY, h, $$, catalogue, spots, stageEl, itemEl, put } = window.AX;
  const root = document.getElementById("ax-root");
  const picks = ["acne-pro-serum-plus", "white-focus-serum", "body-focus-cream", "double-cleanser", "total-hair-serum", "moist-up-cream", "peptides-sunscreen-spf50-pa", "clear-dark-spot-cream"];
  const n = picks.length;
  const rail = h("div", { class: "rail", role: "tablist", "aria-label": "Featured products" });
  const host = h("div", {});
  const info = AXP.infoPanel({ key: true });
  const head = h("section", { class: "feature", style: "padding-bottom:0" }, h("div", { class: "wrap" }, h("h1", {}, "All Products")));
  const sec = h("section", { class: "spot", style: `height:${n * 60 + 40}vh` },
    h("div", { class: "sticky" }, h("div", { class: "wrap", style: "width:100%" },
      h("div", { class: "spot-grid" }, rail, host, info)), h("div", { class: "hint" }, "Scroll")));
  root.append(head, sec);
  let data, st, cur = -1, el = null;
  const name = () => matchMedia("(max-width:900px)").matches ? "plinth-tall" : "plinth-wide";
  picks.forEach((s, i) => rail.append(h("button", { role: "tab", "aria-label": BY[s].name, onclick: () => jump(i) },
    h("img", { src: AX.IMG + BY[s].img, alt: "" }), h("span", {}, h("small", {}, BY[s].cat), BY[s].name))));
  // jumping lands straight on the product: no long scroll through the ones in between
  function jump(i) { const top = sec.getBoundingClientRect().top + scrollY; scrollTo({ top: top + (i + 0.5) * (sec.offsetHeight - innerHeight) / n, behavior: Math.abs(i - cur) > 1 ? "auto" : "smooth" }); }
  async function build() {
    data = await spots(name()); host.innerHTML = ""; st = stageEl(name(), data.size); host.append(st); cur = -1; el = null; onScroll();
  }
  function show(i) {
    if (i === cur) return; cur = i;
    const p = BY[picks[i]];
    if (el) { const old = el; old.classList.add("out"); setTimeout(() => old.remove(), 600); }
    el = itemEl(p); put(el, p, data.foot, data.unit_h, 3.3, "", 2.2, 0.07); el.classList.add("in"); el.style.zIndex = 20;
    el.onclick = () => AX.openProduct(p.slug); st.append(el);
    info.show(p, i, n);
    $$("button", rail).forEach((b, k) => b.setAttribute("aria-current", k === i));
  }
  function onScroll() {
    if (!data) return;
    const r = sec.getBoundingClientRect(), span = sec.offsetHeight - innerHeight;
    const t = Math.min(Math.max(-r.top / span, 0), 0.9999);
    show(Math.floor(t * n));
  }
  addEventListener("scroll", onScroll, { passive: true });
  let m = name(); addEventListener("resize", () => { if (name() !== m) { m = name(); build(); } });
  build();
  catalogue(root);
})();
