/*
 * Indicadores — modal de leitura detalhada.
 * Depende do núcleo partilhado (app.js), que disponibiliza catalog,
 * selectedIndicatorKey, selectedTerritory e formattedValue.
 */
(function () {
  const page = document.body.dataset.page;
  if (page !== "indicadores") return;
  // ---------- Modal "Leitura do indicador" ----------
  if (page === "indicadores") {
    const m = document.createElement("div");
    m.className = "ind-modal"; m.hidden = true;
    m.innerHTML = '<div class="ind-dialog" role="dialog" aria-modal="true" aria-labelledby="im-name"><p class="overline" id="im-cat"></p><h2 id="im-name"></h2><dl><div><dt>Ano do dado mais recente</dt><dd id="im-year"></dd></div><div><dt id="im-tdt"></dt><dd id="im-val"></dd></div><div><dt>Fonte</dt><dd><a id="im-src" target="_blank" rel="noopener"></a></dd></div><div class="full"><dt>Leitura do indicador</dt><dd id="im-read"></dd></div></dl><button type="button" class="ind-close">Fechar</button></div>';
    document.body.appendChild(m);
    const close = () => { m.hidden = true; };
    const open = () => {
      const it = catalog.find(x => x.key === selectedIndicatorKey) || catalog[0], $ = id => document.getElementById(id);
      $("im-cat").textContent = it.area; $("im-name").textContent = it.name; $("im-year").textContent = it.year || "—";
      $("im-tdt").textContent = "Valor · " + selectedTerritory; $("im-val").textContent = formattedValue(it, it.values?.[selectedTerritory]);
      $("im-src").textContent = it.source + " ↗"; $("im-src").href = it.sourceUrl || "#";
      $("im-read").textContent = [it.dimension, it.description].filter(Boolean).join(". ");
      m.hidden = false; m.querySelector(".ind-close").focus();
    };
    m.addEventListener("click", e => { if (e.target === m || e.target.closest(".ind-close")) close(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
    const body = document.getElementById("catalog-body");
    if (body) {
      body.addEventListener("click", e => { if (e.target.closest(".catalog-row")) open(); });
      body.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.closest(".catalog-row")) open(); });
    }
  }


})();
