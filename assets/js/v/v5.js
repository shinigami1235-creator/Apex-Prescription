/* Version 5 (recommended): featured ring, then the routine on the same platform, then every product */
(function () {
  const { D, h, catalogue } = window.AX;
  const root = document.getElementById("ax-root");
  const a = h("section", { class: "feature" }, h("div", { class: "wrap" }));
  a.firstChild.append(h("div", { class: "top" }, h("h1", {}, "All Products")));
  root.append(a);
  AXP.ringBlock(a.firstChild, D.featured);
  const b = h("section", { class: "feature pair" }, h("div", { class: "wrap" }));
  root.append(b);
  AXP.shelfBlock(b.firstChild, { flip: true });
  catalogue(root);
})();
