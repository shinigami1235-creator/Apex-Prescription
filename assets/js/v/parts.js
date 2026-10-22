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
    const info = infoPanel({ nav: d => r.next(d) });
    const stageHost = h("div", {});
    host.append(h("div", { class: "ring-grid" }, h("div", {}, chips || null, chips ? h("div", { style: "height:16px" }) : null, stageHost), info));
    r = ring(stageHost, { wide: "ring-wide", tall: "ring-tall", list, secPerItem: 5.5, k: 2.35, kTall: 3.1, maxW: 1.9, maxWTall: 2.1,
      onFront: (p, i) => info.show(p, i, r ? r.items.length : list.length) });
    return r;
  }

  // Routine shelf: four Blender steps, one product per step
  // Routine: four pedestals on the same platform as the ring, details on the right like the ring's info panel
  function shelfBlock(host, opts = {}) {
    let cur = D.routines[0], data, st, thread;
    const chips = h("div", { class: "chips", role: "group", "aria-label": "Skin concern" },
      D.routines.map((r, i) => h("button", { class: "chip", "aria-pressed": i ? "false" : "true", "data-r": r.id }, r.label)));
    const pan = h("div", { class: "pan" });
    const steps = h("div", { class: "steps" });
    const total = h("div", { class: "v" });
    const addAll = h("button", { class: "btn solid" }, h("span", { html: ICON.bag, style: "width:18px;display:inline-flex" }), "Add routine to cart");
    const side = h("div", { class: "panel-info routine-side" },
      opts.title ? h("div", { class: "c" }, opts.title) : null,
      h("div", { class: "nm" }, "Build your routine"),
      chips, steps,
      h("div", { class: "routine-total" }, h("div", {}, h("div", { class: "t" }, "Full routine"), total), addAll));
    host.append(h("div", { class: "ring-grid routine-grid" + (opts.flip ? " flip" : "") }, h("div", { class: "shelf-wrap" }, pan), side));
    chips.addEventListener("click", e => {
      const b = e.target.closest(".chip"); if (!b) return;
      cur = D.routines.find(r => r.id === b.dataset.r);
      $$(".chip", chips).forEach(x => x.setAttribute("aria-pressed", x === b));
      fill();
    });
    addAll.onclick = () => Cart.addMany(cur.steps.map(s => s[1]).filter(s => BY[s].price));
    async function build() {
      data = await spots("steps-wide");
      st = stageEl("steps-wide", data.size); pan.append(st);
      st.classList.add("sweep");
      data.steps.forEach(s => st.append(h("div", { class: "snap", style: `left:${s.foot[0] * 100 - 12}%` })));
      thread = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      thread.setAttribute("class", "thread"); thread.setAttribute("viewBox", "0 0 1000 1000"); thread.setAttribute("preserveAspectRatio", "none");
      st.append(thread);
      fill();
    }
    function fill() {
      $$(".item,.tag", st).forEach(e => e.remove()); steps.innerHTML = "";
      const tops = [];
      cur.steps.forEach(([label, slug], i) => {
        const p = BY[slug], s = data.steps[i], el = itemEl(p);
        put(el, p, s.foot, s.unit_h, 2.75, "", 1.6);
        el.classList.add("drop", "float"); el.style.animationDelay = `${i * 120}ms, ${700 + i * 400}ms`; el.style.zIndex = 50 + i;
        el.onclick = () => openProduct(slug);
        el.onkeydown = e => { if (e.key === "Enter") openProduct(slug); };
        const card = h("button", { class: "step", onclick: () => openProduct(slug) }, h("span", { class: "num" }, i + 1), h("img", { src: IMG + p.img, alt: "" }),
          h("div", {}, h("div", { class: "s" }, label), h("div", { class: "n" }, p.name)), h("div", { class: "p" }, p.priceText || "สอบถามราคา"));
        el.onmouseenter = () => card.classList.add("lit"); el.onmouseleave = () => card.classList.remove("lit");
        card.onmouseenter = () => el.classList.add("lit"); card.onmouseleave = () => el.classList.remove("lit");
        st.append(el); steps.append(card);
        st.append(h("div", { class: "tag", style: `left:${s.face[0] * 100}%;top:${s.face[1] * 100}%` }, h("b", {}, i + 1), label));
        tops.push([s.foot[0] * 1000, (s.foot[1] + s.unit_h * 0.3) * 1000]); // front of the pedestal rim
      });
      // light thread that runs from step to step along the pedestal tops
      let d = `M${tops[0][0]},${tops[0][1]}`;
      for (let i = 1; i < tops.length; i++) { const [x0, y0] = tops[i - 1], [x1, y1] = tops[i]; d += ` C${x0 + (x1 - x0) * .5},${y0 + 40} ${x0 + (x1 - x0) * .5},${y1 + 40} ${x1},${y1}`; }
      thread.innerHTML = `<defs><linearGradient id="axg" x1="0" x2="1"><stop offset="0" stop-color="#C2B9CE" stop-opacity=".2"/><stop offset=".5" stop-color="#A06DC6"/><stop offset="1" stop-color="#C2B9CE" stop-opacity=".2"/></linearGradient></defs>
        <path d="${d}" fill="none" stroke="url(#axg)" stroke-width="3" vector-effect="non-scaling-stroke" class="base"/>
        <path d="${d}" fill="none" stroke="#fff" stroke-width="2.5" vector-effect="non-scaling-stroke" class="spark" pathLength="100"/>`;
      tops.forEach(([x, y], i) => thread.insertAdjacentHTML("beforeend", `<ellipse cx="${x}" cy="${y}" rx="${18}" ry="${7}" fill="#fff" class="dot" style="animation-delay:${i * .4}s"/>`));
      const sum = cur.steps.reduce((a, [, s]) => a + (BY[s].price || 0), 0);
      total.textContent = AX.money(sum);
      pan.scrollLeft = 0;
    }
    return build();
  }

  window.AXP = { infoPanel, ringBlock, shelfBlock };
})();
