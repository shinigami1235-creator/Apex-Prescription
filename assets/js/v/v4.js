/* Version 4: skin map. Same MakeHuman mesh and dot-and-line look as the Apex Surgery body map. */
(function () {
  const { D, BY, IMG, h, $$, catalogue, openProduct, Cart } = window.AX;
  const root = document.getElementById("ax-root");
  const BIN = (document.currentScript && document.currentScript.dataset.bin) || "../assets/data/bodies.bin";
  const sec = h("section", { class: "feature" }, h("div", { class: "wrap" }));
  const w = sec.firstChild;
  w.append(h("div", { class: "top" }, h("div", {}, h("h1", {}, "All Products"),
    h("p", { class: "lede", style: "margin:10px 0 0" }, "Tap an area to see the products made for it."))));
  const cv = h("canvas", { "aria-label": "Body map" });
  const areasEl = h("div", { class: "areas", role: "group", "aria-label": "Areas" });
  const list = h("div", { class: "list", "aria-live": "polite" });
  const fig = h("div", { class: "fig" }, cv);
  w.append(h("div", { class: "map" }, h("div", {}, areasEl, fig), list));
  root.append(sec);
  catalogue(root);

  let area = D.areas[0].id, hover = null;
  D.areas.forEach(a => areasEl.append(h("button", { "aria-pressed": a.id === area ? "true" : "false", "data-a": a.id, onclick: () => pick(a.id), onmouseenter: () => hover = a.id, onmouseleave: () => hover = null }, a.label)));
  function pick(id) {
    area = id; $$("button", areasEl).forEach(b => b.setAttribute("aria-pressed", b.dataset.a === id));
    const a = D.areas.find(x => x.id === id);
    list.innerHTML = "";
    list.append(h("h2", { class: "swap" }, a.label));
    a.groups.forEach(([g, slugs]) => {
      if (g) list.append(h("div", { class: "sub" }, g));
      slugs.forEach(s => {
        const p = BY[s];
        list.append(h("button", { class: "mini swap", onclick: () => openProduct(s) }, h("img", { src: IMG + p.img, alt: "" }),
          h("div", {}, h("div", { class: "n" }, p.name), h("div", { class: "s" }, p.short)), h("div", { class: "p" }, p.priceText || "สอบถามราคา")));
      });
    });
    zoomTo(id === "face" || id === "hair" ? 1 : 0);
  }

  // ---- mesh ----
  let V, E, R, AR, N, NE, H; // positions, edges, region, area index per vertex, normals
  const getBin = () => window.APEX_BODY_B64 ? Promise.resolve(Uint8Array.from(atob(window.APEX_BODY_B64), c => c.charCodeAt(0)).buffer) : fetch(BIN).then(r => r.arrayBuffer());
  getBin().then(buf => {
    const dv = new DataView(buf); N = dv.getUint32(0, true); NE = dv.getUint32(4, true);
    const f = new Float32Array(buf, 8, 18); const [cx, cy, cz, s] = f; H = { eyeX: f[4], eyeY: f[5], eyeZ: f[6], chinY: f[7], crownY: f[8], faceZ: f[9], faceW: f[10] };
    const q = new Int16Array(buf, 80, 3 * N);
    V = new Float32Array(3 * N); for (let i = 0; i < N; i++) { V[3 * i] = q[3 * i] / 32767 * s + cx; V[3 * i + 1] = q[3 * i + 1] / 32767 * s + cy; V[3 * i + 2] = q[3 * i + 2] / 32767 * s + cz; }
    E = new Uint16Array(buf, 80 + 12 * N, 2 * NE);
    const no = new Uint8Array(buf, 80 + 12 * N + 4 * NE, 2 * N);
    N3 = new Float32Array(3 * N);
    for (let i = 0; i < N; i++) { // octahedral decode
      let x = no[2 * i] / 255 * 2 - 1, y = no[2 * i + 1] / 255 * 2 - 1, z = 1 - Math.abs(x) - Math.abs(y);
      if (z < 0) { const ox = x; x = (1 - Math.abs(y)) * Math.sign(ox || 1); y = (1 - Math.abs(ox)) * Math.sign(y || 1); }
      const l = Math.hypot(x, y, z) || 1; N3[3 * i] = x / l; N3[3 * i + 1] = y / l; N3[3 * i + 2] = z / l;
    }
    R = new Uint8Array(buf, 80 + 16 * N + 4 * NE, N);
    const ids = D.areas.map(a => a.id); AR = new Int8Array(N).fill(-1);
    const scalpY = H.eyeY + 0.22 * (H.crownY - H.eyeY), backZ = H.eyeZ - 0.55 * H.faceW;
    for (let i = 0; i < N; i++) {
      const r = R[i], y = V[3 * i + 1], z = V[3 * i + 2];
      if (r === 1) AR[i] = (y > scalpY || z < backZ) ? ids.indexOf("hair") : ids.indexOf("face");
      else D.areas.forEach((a, k) => { if (a.id !== "face" && a.id !== "hair" && a.regions.includes(r)) AR[i] = k; });
    }
    bounds(); pick(area); requestAnimationFrame(draw);
  });
  let N3, minY, maxY, midX, midZ;
  function bounds() { minY = 1e9; maxY = -1e9; let sx = 0, sz = 0; for (let i = 0; i < N; i++) { const y = V[3 * i + 1]; minY = Math.min(minY, y); maxY = Math.max(maxY, y); sx += V[3 * i]; sz += V[3 * i + 2]; } midX = sx / N; midZ = sz / N; }

  // camera: z=0 full body, z=1 head close-up
  let zoom = 0, zoomT = 0; const zoomTo = z => zoomT = z;
  const glow = new Float32Array(D.areas.length);
  let t0 = performance.now(), P = null, vis = null;
  function draw(now) {
    const dpr = Math.min(devicePixelRatio || 1, 2), W = fig.clientWidth, Hh = fig.clientHeight;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(Hh * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr); }
    const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, Hh);
    zoom += (zoomT - zoom) * 0.06;
    const ai = D.areas.findIndex(a => a.id === area), hi = D.areas.findIndex(a => a.id === hover);
    for (let k = 0; k < glow.length; k++) glow[k] += ((k === ai ? 1 : k === hi ? 0.45 : 0) - glow[k]) * 0.12;
    const yaw = Math.sin((now - t0) / 4200) * 0.55;
    const cyw = Math.cos(yaw), syw = Math.sin(yaw);
    const bodyH = maxY - minY, headH = (H.crownY - H.chinY) * 1.9;
    const viewH = bodyH * 1.06 * (1 - zoom) + headH * zoom;
    const cyF = (minY + maxY) / 2 * (1 - zoom) + ((H.crownY + H.chinY) / 2 + 0.05 * headH) * zoom;
    const sc = Hh / viewH, ox = W / 2, oy = Hh / 2;
    P = P || new Float32Array(2 * N); vis = vis || new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const x = V[3 * i] - midX, y = V[3 * i + 1], z = V[3 * i + 2] - midZ;
      const rx = x * cyw + z * syw, rz = -x * syw + z * cyw;
      P[2 * i] = ox + rx * sc; P[2 * i + 1] = oy - (y - cyF) * sc;
      const nz = -N3[3 * i] * syw + N3[3 * i + 2] * cyw; vis[i] = 0.25 + 0.75 * Math.max(0, nz) ** 0.7;
      void rz;
    }
    c.globalCompositeOperation = "lighter";
    c.lineWidth = 0.6;
    for (let pass = 0; pass < 2; pass++) {
      c.beginPath();
      for (let e = 0; e < NE; e++) {
        const a = E[2 * e], b = E[2 * e + 1], la = AR[a], lb = AR[b];
        const hot = la >= 0 && la === lb && glow[la] > 0.02;
        if ((pass === 1) !== hot) continue;
        c.moveTo(P[2 * a], P[2 * a + 1]); c.lineTo(P[2 * b], P[2 * b + 1]);
      }
      c.strokeStyle = pass ? `rgba(255,255,255,${0.1 + 0.35 * Math.max(...glow)})` : "rgba(190,160,235,0.10)";
      c.stroke();
    }
    for (let i = 0; i < N; i++) {
      const g = AR[i] >= 0 ? glow[AR[i]] : 0, v = vis[i];
      const r = (0.7 + g * 0.9) * (0.6 + zoom * 0.6);
      c.fillStyle = g > 0.02 ? `rgba(${200 + 55 * g | 0},${170 + 85 * g | 0},255,${(0.35 + 0.65 * g) * v})` : `rgba(180,150,230,${0.38 * v})`;
      c.fillRect(P[2 * i] - r, P[2 * i + 1] - r, r * 2, r * 2);
    }
    c.globalCompositeOperation = "source-over";
    requestAnimationFrame(draw);
  }
  function nearest(ev) {
    const b = cv.getBoundingClientRect(), x = ev.clientX - b.left, y = ev.clientY - b.top;
    let best = -1, bd = 26 * 26;
    for (let i = 0; i < N; i++) { if (vis[i] < 0.5 || AR[i] < 0) continue; const dx = P[2 * i] - x, dy = P[2 * i + 1] - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = i; } }
    return best < 0 ? null : D.areas[AR[best]].id;
  }
  cv.addEventListener("click", e => { if (!P) return; const a = nearest(e); if (a) pick(a); else if (zoomT) zoomTo(0); });
  cv.addEventListener("mousemove", e => { if (!P) return; hover = nearest(e); cv.style.cursor = hover ? "pointer" : "default"; });
  cv.addEventListener("mouseleave", () => hover = null);
})();
