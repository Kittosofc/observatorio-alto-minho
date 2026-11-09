// Filtro "Ano inicial / Ano final / Aplicar" do gráfico de evolução (página Comparar).
(function () {
  const form = document.getElementById("year-filter"), from = document.getElementById("year-from"), to = document.getElementById("year-to");
  if (!form || !compareSelect) return;
  const munis = territoryNames.slice(1);
  let key = null, range = null;
  const itemNow = () => catalog.find(e => e.key === compareSelect.value) || catalog[0];
  const seriesOf = item => ({ ...item.history, [item.year]: item.values });
  const yearsOf = item => { const s = seriesOf(item); return Object.keys(s).filter(y => munis.some(n => s[y]?.[n] != null)).sort((a, b) => a - b); };

  function fill(item) {
    const ys = yearsOf(item);
    if (key !== item.key) { key = item.key; range = null; }
    from.innerHTML = to.innerHTML = ys.map(y => `<option>${y}</option>`).join("");
    from.value = range ? range[0] : ys[0]; to.value = range ? range[1] : ys[ys.length - 1];
    [from, to, form.querySelector("button")].forEach(e => { e.disabled = ys.length < 2; });
  }
  // Antes de cada desenho: atualiza os anos disponíveis e diz ao gráfico que intervalo usar.
  onBeforeYearChart(item => { fill(item); yearRange = range; });
  form.addEventListener("submit", e => {
    e.preventDefault();
    let a = +from.value, b = +to.value; if (a > b) [a, b] = [b, a];
    range = [String(a), String(b)]; renderYearComparison();
  });
  renderYearComparison();
})();