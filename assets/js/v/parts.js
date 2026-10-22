/* Feature parts shared by the five versions. */
(function () {
  const { D, BY, IMG, $, $$, h, ICON, Cart, openProduct, ring, spots, stageEl, itemEl, put } = window.AX;

  // Info panel that follows whichever product is in focus
  function infoPanel(opts = {}) {
    const el = h("div", { class: "panel-info", "aria-live": "polite" });
    el.show = (p, i, n) => {
      el.innerHTML = "";
      const inner = h("div", { class: "swap", style: "display:flex;flex-direction:column;gap:12px" },
        n ? h("div", { class: "idx" }, String(i + 1).padStart(2, "0") + " / " + String(n).padStart(2, "0")) : null,
        h("div", { class: "c" }, p.cat),
        h("div", { class: "nm" }, p.name),
        h("div", { class: "pr" }, p.priceText || "สอบถามราคา"),
        h("p", { class: "sh" }, p.short),
        opts.key && p.key[0] ? h("div", { class: "key" }, h("b", {}, "Key Ingredients  "), p.key[0].length > 150 ? p.key[0].slice(0, 150) + "…" : p.key[0]) : null,
        h("div", { class: "acts" },
          h("button", { class: "btn", onclick: () => openProduct(p.slug) }, "Details"),
          p.price ? h("button", { class: "btn solid", onclick: () => Cart.add(p.slug) }, h("span", { html: ICON.bag, style: "width:18px;display:inline-flex" }), "หยิบใส่ตะกร้า") : null),
        opts.nav ? h("div", { class: "nav" },
          h("button", { class: "icon-btn", "aria-label": "Previous", html: ICON.left, onclick: () => opts.nav(-1) }),
          h("button", { class: "icon-btn", "aria-label": "Next", html: ICON.right, onclick: () => opts.nav(1) })) : null);
      el.append(inner);
    };
    return el;
  }

  // Ring of products on the Blender platform + info panel
  function ringBlock(host, list, chips) {
    let r;
    const info = infoPanel({ nav: d => r.next(-d) });
    const stageHost = h("div", {});
    host.append(h("div", { class: "ring-grid" }, h("div", {}, chips || null, chips ? h("div", { style: "height:16px" }) : null, stageHost), info));
    r = ring(stageHost, { wide: "ring-wide", tall: "ring-tall", list, auto: 6000, k: 3.2, kTall: 4.6, maxW: 2.5, maxWTall: 3.3,
      onFront: (p, i) => info.show(p, i, r ? r.items.length : list.length) });
    return r;
  }

  // Routine shelf: four Blender steps, one product per step
  function shelfBlock(host) {
    let cur = D.routines[0], data, st;
    const chips = h("div", { class: "chips scroll", role: "group", "aria-label": "Skin concern" },
      D.routines.map((r, i) => h("button", { class: "chip", "aria-pressed": i ? "false" : "true", "data-r": r.id }, r.label)));
    const pan = h("div", { class: "pan" });
    const steps = h("div", { class: "steps" });
    const total = h("div", { class: "v" });
    const addAll = h("button", { class: "btn" }, "Add routine to cart");
    host.append(chips, h("div", { style: "height:18px" }), h("div", { class: "shelf-wrap" }, pan), steps,
      h("div", { class: "routine-bar" }, h("div", {}, h("div", { class: "t" }, "Full routine"), total), addAll));
    chips.addEventListener("click", e => {
      const b = e.target.closest(".chip"); if (!b) return;
      cur = D.routines.find(r => r.id === b.dataset.r);
      $$(".chip", chips).forEach(x => x.setAttribute("aria-pressed", x === b));
      fill();
    });
    addAll.onclick = () => Cart.addMany(cur.steps.map(s => s[1]).filter(s => BY[s].price));
    async function build() {
      data = await spots("shelf-wide");
      st = stageEl("shelf-wide", data.size); pan.append(st);
      [0, 1, 2, 3].forEach(i => st.append(h("div", { class: "snap", style: `left:${i * 25}%` })));
      fill();
    }
    function fill() {
      $$(".item,.tag", st).forEach(e => e.remove()); steps.innerHTML = "";
      cur.steps.forEach(([label, slug], i) => {
        const p = BY[slug], s = data.steps[i], el = itemEl(p);
        put(el, p, s.foot, s.unit_h, 2.55, "", 2.0);
        el.classList.add("drop"); el.style.animationDelay = i * 110 + "ms"; el.style.zIndex = 50;
        el.onclick = () => openProduct(slug);
        el.onkeydown = e => { if (e.key === "Enter") openProduct(slug); };
        st.append(el);
        st.append(h("div", { class: "tag", style: `left:${s.face[0] * 100}%;top:${s.face[1] * 100}%` }, h("b", {}, i + 1), label));
        steps.append(h("button", { class: "step", onclick: () => openProduct(slug) }, h("img", { src: IMG + p.img, alt: "" }),
          h("div", {}, h("div", { class: "s" }, `Step ${i + 1} · ${label}`), h("div", { class: "n" }, p.name), h("div", { class: "p" }, p.priceText || "สอบถามราคา"))));
      });
      const sum = cur.steps.reduce((a, [, s]) => a + (BY[s].price || 0), 0);
      total.textContent = AX.money(sum);
      pan.scrollLeft = 0;
    }
    return build();
  }

  window.AXP = { infoPanel, ringBlock, shelfBlock };
})();
