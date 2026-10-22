/* Version 5 (recommended): featured ring on top, routine shelf, then every product */
(function () {
  const { D, h, catalogue } = window.AX;
  const root = document.getElementById("ax-root");
  const a = h("section", { class: "feature" }, h("div", { class: "wrap" }));
  a.firstChild.append(h("div", { class: "top" }, h("h1", {}, "All Products")));
  root.append(a);
  AXP.ringBlock(a.firstChild, D.featured);
  const b = h("section", { class: "feature", style: "padding-top:70px" }, h("div", { class: "wrap" }));
  b.firstChild.append(h("div", { class: "top", "data-reveal": "" }, h("div", {}, h("h2", {}, "Build your routine"),
    h("p", { class: "lede", style: "margin:10px 0 0" }, "Pick what you want to work on and the shelf shows the routine in the order you use it."))));
  root.append(b);
  AXP.shelfBlock(b.firstChild);
  catalogue(root);
})();
