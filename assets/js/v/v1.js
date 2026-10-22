/* Version 1: category ring (Doctor Younger showroom, split by category) */
(function () {
  const { D, h, $$, catalogue } = window.AX;
  const root = document.getElementById("ax-root");
  const sec = h("section", { class: "feature" }, h("div", { class: "wrap" }));
  const w = sec.firstChild;
  const list = c => D.products.filter(p => p.cat === c).map(p => p.slug);
  let cat = "Acne Care";
  const chips = h("div", { class: "chips scroll", role: "group", "aria-label": "Categories" },
    D.cats.map(c => h("button", { class: "chip", "aria-pressed": c === cat ? "true" : "false", "data-c": c }, c, h("span", { class: "n" }, list(c).length))));
  w.append(h("div", { class: "top" }, h("h1", {}, "All Products")));
  root.append(sec);
  const r = AXP.ringBlock(w, list(cat), chips);
  chips.addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    cat = b.dataset.c; $$(".chip", chips).forEach(x => x.setAttribute("aria-pressed", x === b));
    r.set(list(cat));
  });
  catalogue(root);
})();
