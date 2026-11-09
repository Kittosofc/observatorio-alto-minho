// Carrega, por ordem, os scripts comuns a todas as páginas.
// Uso: <script src="…/shared/boot.js" data-page="comparar" data-values="1"></script>
//  data-page   -> ficheiro em js/pages/ (opcional; aceita vários separados por vírgula)
//  data-values -> "1" carrega indicator-values.js (só onde é necessário)
(function () {
  const me = document.currentScript;
  const js = me.src.replace(/shared\/boot\.js.*$/, "");
  const list = [
    "data/catalog-data.js",
    ...(me.dataset.values === "1" ? ["data/indicator-values.js"] : []),
    "data/catalog-overrides.js",
    "data/map-data.js",
    "shared/app.js",
    "shared/footer.js",
    "shared/admin.js",
    ...(me.dataset.page || "").split(",").filter(Boolean).map(p => `pages/${p}.js`),
  ];
  list.forEach(f => document.write(`<script src="${js}${f}"><\/script>`));
})();