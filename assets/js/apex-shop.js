/* ApexSx product page redesign: shared pieces (catalogue, product drawer, preview cart, Blender stages). */
(function () {
  const D = window.APEX;
  const BY = Object.fromEntries(D.products.map(p => [p.slug, p]));
  const IMG = (document.currentScript && document.currentScript.dataset.img) || "../assets/img/";
  const STAGE = (document.currentScript && document.currentScript.dataset.stage) || "../assets/stage/";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const h = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") e.className = v; else if (k === "html") e.innerHTML = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v);
    }
    for (const k of kids.flat()) if (k != null) e.append(k.nodeType ? k : document.createTextNode(k));
    return e;
  };
  const money = n => "฿" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const ICON = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  };
  const units = (p, k = 2.1) => k * Math.pow(p.cm / 14, 0.75);

  /* ---------- preview cart (stands in for WooCommerce until IT wires it up) ---------- */
  const Cart = {
    key: "axcart",
    items: (() => { try { return JSON.parse(localStorage.getItem("axcart")) || {}; } catch (e) { return {}; } })(),
    save() { try { localStorage.setItem(this.key, JSON.stringify(this.items)); } catch (e) {} this.sync(); },
    add(slug, q = 1, quiet) { const p = BY[slug]; if (!p || !p.price) return; this.items[slug] = (this.items[slug] || 0) + q; this.save(); if (!quiet) toast(p, q); },
    addMany(slugs) { slugs.forEach(s => this.add(s, 1, true)); toast(BY[slugs[0]], slugs.length, true); },
    remove(slug) { delete this.items[slug]; this.save(); renderCart(); },
    count() { return Object.values(this.items).reduce((a, b) => a + b, 0); },
    total() { return Object.entries(this.items).reduce((a, [s, q]) => a + (BY[s] ? BY[s].price * q : 0), 0); },
    sync() {
      $$(".elementor-button-icon-qty").forEach(e => { e.textContent = this.count(); e.dataset.counter = this.count(); });
      $$(".elementor-menu-cart__toggle_button .woocommerce-Price-amount bdi").forEach(e => e.innerHTML = '<span class="woocommerce-Price-currencySymbol">฿</span>' + this.total().toLocaleString("en-US", { minimumFractionDigits: 2 }));
    },
  };

  let toastEl, toastT;
  function toast(p, q, routine) {
    if (!toastEl) {
      toastEl = h("div", { class: "ax-toast", role: "status" });
      document.body.append(toastEl);
    }
    toastEl.innerHTML = "";
    toastEl.append(h("img", { src: IMG + p.img, alt: "" }),
      h("span", {}, routine ? `Added ${q} items` : `${p.name} × ${q}`),
      h("button", { onclick: openCart }, "Cart"));
    toastEl.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("show"), 3200);
  }

  /* ---------- drawers ---------- */
  function drawer(cls) {
    const d = h("div", { class: "ax-drawer " + cls, "aria-hidden": "true" },
      h("div", { class: "scrim" }), h("div", { class: "panel ax", role: "dialog", "aria-modal": "true", tabindex: "-1" },
        h("button", { class: "close", "aria-label": "Close", html: ICON.x }), h("div", { class: "scroll" })));
    document.body.append(d);
    const close = () => { d.classList.remove("open"); d.setAttribute("aria-hidden", "true"); document.documentElement.style.overflow = ""; };
    $(".scrim", d).onclick = close; $(".close", d).onclick = close;
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
    d.show = () => { d.classList.add("open"); d.setAttribute("aria-hidden", "false"); document.documentElement.style.overflow = "hidden"; setTimeout(() => $(".panel", d).focus({ preventScroll: true }), 50); };
    d.close = close;
    return d;
  }
  let prodD, cartD, zoomEl;
  function openProduct(slug) {
    const p = BY[slug]; if (!p) return;
    prodD = prodD || drawer("ax-prod");
    const s = $(".scroll", prodD); s.innerHTML = ""; s.scrollTop = 0;
    let q = 1; const qn = h("span", {}, "1");
    const sec = (title, lines) => lines && lines.length ? h("details", title === "รายละเอียด" ? { open: "" } : {}, h("summary", {}, title), lines.map(l => h("p", {}, l))) : null;
    s.append(
      h("div", { class: "hero" }, h("img", { src: IMG + p.img, alt: p.name })),
      h("div", { class: "body" },
        h("div", { class: "cat" }, p.cat),
        h("h3", {}, p.name),
        h("div", { class: "price" }, p.priceText || "สอบถามราคา"),
        h("p", { class: "short" }, p.short),
        p.fda ? h("div", { class: "fda" }, "หมายเลขใบอนุญาต/อย. " + p.fda) : null,
        h("div", { class: "buy" },
          p.price ? h("div", { class: "qty" },
            h("button", { "aria-label": "Less", onclick: () => { q = Math.max(1, q - 1); qn.textContent = q; } }, "−"), qn,
            h("button", { "aria-label": "More", onclick: () => { q++; qn.textContent = q; } }, "+")) : null,
          p.price ? h("button", { class: "btn solid", onclick: () => { Cart.add(p.slug, q); prodD.close(); } }, "หยิบใส่ตะกร้า")
            : h("a", { class: "btn solid", href: "https://page.line.me/ahl0535g", target: "_blank", rel: "noopener" }, "Buy Via Line Chat")),
        p.posters.length ? h("div", { class: "posters" }, p.posters.map(src => h("img", { src: IMG + src, alt: p.name, loading: "lazy", onclick: () => zoom(IMG + src) }))) : null,
        sec("รายละเอียด", p.desc),
        sec("ส่วนผสมสำคัญ (Key Ingredients)", p.key),
        sec("วิธีใช้ (How to Use)", p.how),
        h("a", { class: "full", href: p.url, target: "_blank", rel: "noopener" }, "Full product page →")
      ));
    prodD.show();
  }
  function zoom(src) {
    zoomEl = zoomEl || (() => { const z = h("div", { class: "ax-zoom", onclick: () => z.classList.remove("open") }, h("img", { alt: "" })); document.body.append(z); return z; })();
    $("img", zoomEl).src = src; zoomEl.classList.add("open");
  }
  function renderCart() {
    if (!cartD) return;
    const s = $(".scroll", cartD); s.innerHTML = "";
    const body = h("div", { class: "body" }, h("h3", {}, "Cart"));
    const lines = Object.entries(Cart.items).filter(([sl]) => BY[sl]);
    if (!lines.length) body.append(h("p", { class: "empty" }, "ตะกร้าว่าง"));
    lines.forEach(([sl, q]) => {
      const p = BY[sl];
      body.append(h("div", { class: "line" }, h("img", { src: IMG + p.img, alt: "" }),
        h("div", {}, h("div", { class: "nm" }, p.name), h("div", { class: "q" }, `${q} × ${p.priceText}`)),
        h("button", { class: "rm", onclick: () => Cart.remove(sl) }, "Remove")));
    });
    if (lines.length) body.append(h("div", { class: "sum" }, h("span", {}, "Subtotal"), h("span", {}, money(Cart.total()))),
      h("a", { class: "btn solid", style: "width:100%", href: "https://www.apexsxskin.com/cart/", target: "_blank", rel: "noopener" }, "Checkout"));
    s.append(body);
  }
  function openCart(e) {
    if (e) e.preventDefault();
    cartD = cartD || drawer("ax-prod ax-cart");
    renderCart(); cartD.show();
  }

  /* ---------- catalogue (all products, same filters as the live page) ---------- */
  function card(p, i) {
    const c = h("article", { class: "card in", style: `animation-delay:${Math.min(i, 12) * 40}ms` },
      h("div", { class: "ph", onclick: () => openProduct(p.slug) }, h("img", { src: IMG + p.img, alt: p.name, loading: "lazy" })),
      h("div", { class: "info" },
        h("div", { class: "c" }, p.cat),
        h("div", { class: "nm", onclick: () => openProduct(p.slug) }, p.name),
        h("div", { class: "row" }, h("span", { class: "pr" }, p.priceText || "สอบถามราคา"),
          p.price ? h("button", { class: "add", "aria-label": "หยิบใส่ตะกร้า " + p.name, html: ICON.plus, onclick: () => Cart.add(p.slug) }) : null)));
    return c;
  }
  function catalogue(root) {
    const prices = D.products.filter(p => p.price).map(p => p.price);
    const lo = Math.min(...prices), hi = Math.max(...prices);
    const st = { cats: new Set(), min: lo, max: hi, sort: "" };
    const grid = h("div", { class: "grid" });
    const count = h("span", { class: "count" });
    const chips = h("div", { class: "chips scroll", role: "group", "aria-label": "Categories" },
      h("button", { class: "chip", "aria-pressed": "true", "data-c": "" }, "All", h("span", { class: "n" }, D.products.length)),
      D.cats.map(c => h("button", { class: "chip", "aria-pressed": "false", "data-c": c }, c, h("span", { class: "n" }, D.products.filter(p => p.cat === c).length))));
    chips.addEventListener("click", e => {
      const b = e.target.closest(".chip"); if (!b) return;
      const c = b.dataset.c;
      if (!c) st.cats.clear(); else st.cats.has(c) ? st.cats.delete(c) : st.cats.add(c);
      $$(".chip", chips).forEach(x => x.setAttribute("aria-pressed", x.dataset.c ? st.cats.has(x.dataset.c) : !st.cats.size));
      draw();
    });
    const a = h("input", { type: "range", min: lo, max: hi, step: 10, value: lo, "aria-label": "Lowest price" });
    const b = h("input", { type: "range", min: lo, max: hi, step: 10, value: hi, "aria-label": "Highest price" });
    const fill = h("div", { class: "fill" }); const lbl = h("span", {});
    const upd = () => {
      let x = +a.value, y = +b.value; if (x > y) [x, y] = [y, x];
      st.min = x; st.max = y; lbl.textContent = `${x} — ${y}`;
      fill.style.left = (x - lo) / (hi - lo) * 100 + "%"; fill.style.right = (100 - (y - lo) / (hi - lo) * 100) + "%";
    };
    a.oninput = b.oninput = () => { upd(); draw(); }; upd();
    const sort = h("select", { class: "sort", "aria-label": "Sort" },
      h("option", { value: "" }, "Sort..."),
      h("option", { value: "ta" }, "By title from lowest to highest"), h("option", { value: "td" }, "By title from highest to lowest"),
      h("option", { value: "da" }, "By date from lowest to highest"), h("option", { value: "dd" }, "By date from highest to lowest"),
      h("option", { value: "pa" }, "By price from lowest to highest"), h("option", { value: "pd" }, "By price from highest to lowest"));
    sort.onchange = () => { st.sort = sort.value; draw(); };
    function draw() {
      let list = D.products.map((p, i) => ({ p, i })).filter(({ p }) => (!st.cats.size || st.cats.has(p.cat)) && (!p.price || (p.price >= st.min && p.price <= st.max)));
      const by = { ta: (x, y) => x.p.name.localeCompare(y.p.name), td: (x, y) => y.p.name.localeCompare(x.p.name),
        da: (x, y) => y.i - x.i, dd: (x, y) => x.i - y.i, pa: (x, y) => (x.p.price || 1e9) - (y.p.price || 1e9), pd: (x, y) => (y.p.price || 0) - (x.p.price || 0) }[st.sort];
      if (by) list.sort(by);
      grid.innerHTML = "";
      list.forEach(({ p }, i) => grid.append(card(p, i)));
      if (!list.length) grid.append(h("div", { class: "none" }, "No products match these filters."));
      count.textContent = `${list.length} products`;
    }
    root.append(h("section", { class: "catalogue", id: "all" }, h("div", { class: "wrap" },
      h("div", { class: "cat-head" }, h("h2", {}, "Browse all products"), count),
      h("div", { class: "cat-tools" }, chips,
        h("label", { class: "range" }, "Price", h("div", { class: "track" }, h("div", { class: "rail" }), fill, a, b), lbl), sort),
      grid)));
    draw();
  }

  /* ---------- Blender stages ---------- */
  const stageCache = {};
  async function spots(name) {
    if (!stageCache[name]) stageCache[name] = window.APEX_STAGES && window.APEX_STAGES[name] ? Promise.resolve(window.APEX_STAGES[name]) : fetch(STAGE + name + ".json").then(r => r.json());
    return stageCache[name];
  }
  function stageEl(name, size) {
    const st = h("div", { class: "stage", style: `aspect-ratio:${size[0]}/${size[1]}` },
      h("img", { class: "bg", src: STAGE + name + ".webp", alt: "", decoding: "async" }));
    return st;
  }
  function itemEl(p) {
    const el = h("div", { class: "item", tabindex: "0", role: "button", "aria-label": p.name },
      h("div", { class: "shadow" }), h("img", { src: IMG + p.img, alt: "" }));
    el.style.aspectRatio = p.ratio;
    return el;
  }
  // place an item so its base sits on foot=[x,y] (0-1 of stage), height = unit_h * units
  function put(el, p, foot, unitH, k = 2.1, extra = "", maxW = 0, topPad = 0) {
    let u = units(p, k);
    if (maxW && u * p.ratio > maxW) u = maxW / p.ratio; // wide jars and boxes: keep them on the surface
    let hh = unitH * u * 100;
    if (topPad && hh > (foot[1] - topPad) * 100) hh = (foot[1] - topPad) * 100; // never taller than the frame
    el.style.height = hh + "%";
    el.style.left = foot[0] * 100 + "%";
    el.style.top = foot[1] * 100 + "%";
    el.style.transform = `translate(-50%,-100%) ${extra}`;
  }
  // Ring: products travel along the platform's rim (72 sampled points from Blender's camera)
  // Ring: products glide along the platform rim (72 points sampled from Blender's camera).
  // The ring never snaps: it turns slowly and keeps moving, easing down as each product reaches the front.
  function ring(host, opts) {
    const api = { items: [], theta: 0, onFront: opts.onFront || (() => {}) };
    let data, st, raf, front = -1, hover = false, drag = null, tween = null, inertia = 0, speedK = 1, last = 0, built = false;
    const secPerItem = opts.secPerItem || 5.5;
    const pick = () => matchMedia("(max-width:767px)").matches ? opts.tall : opts.wide;
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    async function build() {
      const name = pick(); api.tall = name === opts.tall; data = await spots(name);
      host.innerHTML = ""; st = stageEl(name, data.size); host.append(st);
      api.stage = st; set(api.list || opts.list, true); bindDrag();
      if (!built) { built = true; loop(); }
    }
    function sample(a) {
      const n = data.ring.length, t = ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / (2 * Math.PI) * n;
      const i = Math.floor(t) % n, j = (i + 1) % n, f = t - Math.floor(t);
      const A = data.ring[i], B = data.ring[j];
      return { x: A.foot[0] + (B.foot[0] - A.foot[0]) * f, y: A.foot[1] + (B.foot[1] - A.foot[1]) * f, u: A.unit_h + (B.unit_h - A.unit_h) * f };
    }
    function set(list, instant) {
      api.list = list;
      const old = api.items; api.items = [];
      old.forEach(it => { const an = it.el.animate([{ opacity: 1 }, { opacity: 0, transform: it.el.style.transform + " translateY(-4%)" }], { duration: instant ? 0 : 380, easing: "ease-in", fill: "forwards" }); an.onfinish = () => it.el.remove(); });
      setTimeout(() => {
        list.forEach((slug, i) => {
          const p = BY[slug], el = itemEl(p);
          el.onclick = () => { if (!api.dragged) go(i); };
          el.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(i); } };
          el.style.opacity = "0";
          st.append(el); api.items.push({ p, el, i });
          el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 650, delay: i * 60, easing: "ease-out", fill: "forwards" });
        });
        api.theta = 0; tween = null; front = -1; frame();
      }, instant ? 0 : 380);
    }
    const step = () => 2 * Math.PI / Math.max(api.items.length, 1);
    function go(i) { // ease item i to the front the shortest way round
      if (!api.items.length) return;
      let d = -i * step() - api.theta; d = Math.atan2(Math.sin(d), Math.cos(d));
      tween = { from: api.theta, to: api.theta + d, t0: performance.now(), dur: 900 + Math.abs(d) * 420 };
    }
    api.go = go;
    api.next = d => { const n = api.items.length; if (!n) return; go((front + d + n) % n); };
    function frame() {
      const n = api.items.length;
      api.items.forEach((it, i) => {
        const a = api.theta + i * step(), s = sample(a);
        const depth = (Math.cos(a) + 1) / 2; // 1 = front
        put(it.el, it.p, [s.x, s.y], s.u, (api.tall ? opts.kTall : opts.k) || 2.1, "", api.tall ? opts.maxWTall : opts.maxW);
        it.el.style.zIndex = 10 + Math.round(s.y * 1000);
        it.el.style.filter = `brightness(${0.93 + depth * 0.07})`;
      });
      if (n) {
        const f = ((Math.round(-api.theta / step()) % n) + n) % n;
        if (f !== front) { front = f; api.front = api.items[f]; api.onFront(api.items[f].p, f); }
      }
    }
    function loop() {
      const tick = now => {
        const dt = Math.min((now - (last || now)) / 1000, 0.05); last = now;
        if (data && api.items.length) {
          if (tween) {
            const t = Math.min((now - tween.t0) / tween.dur, 1);
            api.theta = tween.from + (tween.to - tween.from) * ease(t);
            if (t >= 1) { tween = null; speedK = 0; }
          } else if (drag) {
            // the pointer moves the ring directly
          } else if (Math.abs(inertia) > 0.0005) {
            api.theta += inertia * dt; inertia *= Math.pow(0.04, dt);
          } else if (api.items.length > 1 && !document.hidden) {
            // slow continuous turn that lingers as each product passes the front
            const want = hover ? 0 : 1; speedK += (want - speedK) * Math.min(dt * 1.6, 1);
            const ph = ((-api.theta / step()) % 1 + 1) % 1, linger = 0.28 + 0.72 * Math.pow(Math.sin(Math.PI * ph), 2);
            api.theta -= step() / secPerItem * linger * speedK * dt * 1.55;
          }
          frame();
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    function bindDrag() {
      st.addEventListener("pointerdown", e => { drag = { x: e.clientX, th: api.theta, lx: e.clientX, lt: performance.now(), v: 0 }; tween = null; api.dragged = false; });
      st.addEventListener("mouseenter", () => hover = true);
      st.addEventListener("mouseleave", () => hover = false);
    }
    addEventListener("pointermove", e => {
      if (!drag || !st) return;
      const dx = e.clientX - drag.x; if (Math.abs(dx) > 6) api.dragged = true;
      const now = performance.now(), k = Math.PI * 1.3 / st.clientWidth;
      drag.v = (e.clientX - drag.lx) * k / Math.max((now - drag.lt) / 1000, 0.008); drag.lx = e.clientX; drag.lt = now;
      api.theta = drag.th + dx * k;
    });
    addEventListener("pointerup", () => { if (!drag) return; inertia = Math.max(-6, Math.min(6, drag.v)); drag = null; speedK = 0; setTimeout(() => api.dragged = false, 0); });
    let w = matchMedia("(max-width:767px)").matches;
    addEventListener("resize", () => { const m = matchMedia("(max-width:767px)").matches; if (m !== w) { w = m; build(); } });
    api.set = l => set(l);
    api.ready = build();
    return api;
  }

  function reveal() {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("seen"); io.unobserve(e.target); } }), { threshold: .15 });
    $$("[data-reveal]").forEach(e => io.observe(e));
  }

  function init() {
    Cart.sync();
    $$(".elementor-menu-cart__toggle_button").forEach(b => b.addEventListener("click", e => { e.preventDefault(); e.stopImmediatePropagation(); openCart(); }, true));
    reveal();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();

  window.AX = { D, BY, IMG, STAGE, $, $$, h, ICON, money, units, Cart, openProduct, openCart, catalogue, ring, spots, stageEl, itemEl, put };
})();
