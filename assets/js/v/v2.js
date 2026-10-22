/* Version 2: routine shelf by skin concern */
(function () {
  const { h, catalogue } = window.AX;
  const root = document.getElementById("ax-root");
  const sec = h("section", { class: "feature" }, h("div", { class: "wrap" }));
  const w = sec.firstChild;
  w.append(h("div", { class: "top" }, h("div", {}, h("h1", {}, "All Products"),
    h("p", { class: "lede", style: "margin:10px 0 0" }, "Pick what you want to work on and the shelf shows the routine in the order you use it."))));
  root.append(sec);
  AXP.shelfBlock(w);
  catalogue(root);
})();
