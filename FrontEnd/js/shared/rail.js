// Barra lateral partilhada (marca, território, menu e nota das fontes).
// Usar como 1.º elemento do <body>: o <script> é substituído pela barra, sem "salto" no ecrã.
// A página ativa vem de <body data-page="...">. Carregar ANTES de app.js (ele procura #territory-select).
(function () {
  const script = document.currentScript;
  const root = new URL("../../../", script.src).href;           // raiz do site (funciona em qualquer página)
  const page = document.body.dataset.page;
  const active = page === "municipio" ? "retrato" : page;       // o município conta como "Retrato"
  const pages = "FrontEnd/html/";

  // [id da página, ficheiro, número, texto]
  const menu = [
    ["retrato", "index.html", "01", "Retrato"],
    ["indicadores", pages + "indicadores.html", "02", "Indicadores"],
    ["comparar", pages + "comparar.html", "03", "Comparar"],
    ["metodologia", pages + "metodologia.html", "04", "Metodologia"],
    ["forms", pages + "forms.html", "05", "Metas"],
    ["transferencias", pages + "transferencias.html", "06", "Documentos"]
  ];

  const links = menu.map(([id, file, num, label]) =>
    `<a${id === active ? ' class="active" aria-current="page"' : ""} href="${root}${file}"><span>${num}</span>${label}</a>`).join("");

  // No Retrato o seletor de território existe (app.js precisa dele) mas fica escondido.
  const hideTerritory = page === "retrato";

  const rail = document.createElement("header");
  rail.className = "rail";
  rail.innerHTML = `
    <a class="brand" href="${root}index.html" aria-label="Observatório Alto Minho — início">
      <span class="brand-symbol" aria-hidden="true"><img src="${root}FrontEnd/imgs/cim-alto-minho.svg" alt=""></span>
      <span><b>Alto Minho</b><small>Observatório territorial</small></span>
    </a>
    <div class="rail-territory${hideTerritory ? " rail-territory--hidden" : ""}"${hideTerritory ? ' aria-hidden="true"' : ""}>
      <label for="territory-select">Território em análise</label>
      <select id="territory-select" aria-label="Escolha o território"></select>
      <p>10 municípios · NUTS III Alto Minho</p>
    </div>
    <nav aria-label="Navegação principal">${links}</nav>
    <div class="rail-note">
      <span class="source-dot"></span>
      <p>Dados estatísticos<br><strong>INE · Pordata</strong></p>
    </div>`;
  script.replaceWith(rail);
})();