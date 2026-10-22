/* Version 2: routine on the platform pedestals */
(function () {
  const { h, catalogue } = window.AX;
  const root = document.getElementById("ax-root");
  const sec = h("section", { class: "feature" }, h("div", { class: "wrap" }));
  const w = sec.firstChild;
  w.append(h("div", { class: "top" }, h("h1", {}, "All Products")));
  root.append(sec);
  AXP.shelfBlock(w);
  catalogue(root);
})();
