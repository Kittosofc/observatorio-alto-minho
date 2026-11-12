// Página Comparar: resumo, KPIs, barras por município, evolução e leitura rápida.
// Reutiliza do app.js: catalog, territoryNames, selectedTerritory, format, formattedValue, niceStep,
// compareSelect (#compare-indicator, já preenchido e guardado pelo app.js) e onTerritoryChange.
(function () {
  if (!compareSelect) return;
  const $ = id => document.getElementById(id);
  const yearSel = $("cmp-year"), orderSel = $("cmp-order");
  const munis = territoryNames.slice(1), AVG = "Alto Minho";
  const hidden = new Set();               // linhas escondidas na legenda: "dest" | "avg" | "others"
  const WARN = "—";

  // ----- ícones (traço simples) -----
  const ico = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const icons = {
    chart: ico('<path d="M5 20V10M12 20V4M19 20v-7"/>'),
    pin: ico('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.800 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
    people: ico('<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3.500 19c0-3 2.500-5 5.500-5s5.500 2 5.500 5M15 14.500c3 0 5.500 1.500 5.500 4.500"/>'),
    layers: ico('<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>'),
    up: ico('<path d="M4 17 10 11l4 4 6-7M15 8h5v5"/>'),
    down: ico('<path d="M4 7l6 6 4-4 6 7M15 16h5v-5"/>'),
    info: ico('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.500v.01"/>'),
  };

  // ----- dados -----
  const seriesOf = item => ({ ...item.history, [item.year]: item.values });
  const yearsOf = s => Object.keys(s).filter(y => munis.some(n => s[y]?.[n] != null)).sort((a, b) => a - b);
  const avgOf = (s, y) => {
    const v = s[y]?.[AVG];
    if (v != null) return v;
    const a = munis.map(n => s[y]?.[n]).filter(x => x != null);
    return a.length ? a.reduce((p, c) => p + c, 0) / a.length : null;
  };
  const num = (item, v) => (v == null ? WARN : `${item.prefix || ""}${format(v)}`);
  const unitOf = item => (item.suffix || item.unit || "").trim();
  const lower = t => (/^.[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1));
  const dest = () => (munis.includes(selectedTerritory) ? selectedTerritory : null);

  // ----- 1. resumo + KPIs -----
  function renderTop(c) {
    const { item, s, year, d } = c;
    $("cmp-summary").innerHTML =
      `<div>${icons.chart}<span><small>Indicador</small><b>${item.name}</b></span></div>` +
      `<div>${icons.pin}<span><small>Município em destaque</small><b>${d || "Nenhum selecionado"}</b></span></div>`;

    const vals = year ? munis.map(n => [n, s[year]?.[n]]).filter(r => r[1] != null) : [];
    const hi = vals.reduce((m, r) => (m == null || r[1] > m[1] ? r : m), null);
    const lo = vals.reduce((m, r) => (m == null || r[1] < m[1] ? r : m), null);
    const avg = year ? avgOf(s, year) : null;
    const dv = d && year ? s[year]?.[d] : null;
    const big = v => `<span class="v">${num(item, v)}<span>${unitOf(item)}</span></span>`;

    let msg = "Escolha um município no menu lateral para o destacar.";
    if (d && dv != null && avg != null)
      msg = `${d} ${dv < avg ? "abaixo da" : dv > avg ? "acima da" : "em linha com a"} média sub-regional.`;
    else if (d) msg = `Sem dados de ${d} para este ano.`;

    $("cmp-kpis").innerHTML =
      `<div class="cmp-kpi main">${icons.people}<span><small>${d || "Município em destaque"}</small>${big(dv)}</span></div>` +
      `<div class="cmp-kpi">${icons.layers}<span><small>Média do Alto Minho</small>${big(avg)}</span></div>` +
      `<div class="cmp-kpi up">${icons.up}<span><small>Valor mais alto<strong>${hi ? hi[0] : WARN}</strong></small>${big(hi?.[1])}</span></div>` +
      `<div class="cmp-kpi down">${icons.down}<span><small>Valor mais baixo<strong>${lo ? lo[0] : WARN}</strong></small>${big(lo?.[1])}</span></div>` +
      `<div class="cmp-kpi note">${icons.info}<span>${msg}</span></div>`;
  }

  // ----- 2. barras -----
  function renderBars(c) {
    const { item, s, year, d } = c;
    const box = $("cmp-bars");
    $("cmp-bars-title").textContent = `Municípios do Alto Minho por ${lower(item.name)}${year ? ` (${year})` : ""}`;
    if (!year) { box.innerHTML = `<p class="cmp-empty">Sem dados municipais para este indicador.</p>`; return; }
    const rows = munis.map(n => [n, s[year]?.[n]]);
    const order = orderSel.value;
    rows.sort(
      order === "asc" ? (a, b) => (a[1] ?? Infinity) - (b[1] ?? Infinity)
      : order === "az" ? (a, b) => a[0].localeCompare(b[0], "pt")
      : (a, b) => (b[1] ?? -Infinity) - (a[1] ?? -Infinity));
    const max = Math.max(...rows.map(r => Math.abs(r[1] ?? 0))) || 1;
    box.setAttribute("role", "img");
    box.setAttribute("aria-label", `${item.name}, ${year}, por município`);
    box.innerHTML = rows.map(([n, v]) => {
      const w = v == null ? 0 : Math.max(1.5, (Math.abs(v) / max) * 100);
      return `<div class="cmp-bar${n === d ? " dest" : ""}"><span class="cmp-bar-label" title="${n}">${n}</span>` +
        `<span class="cmp-bar-track"><span class="cmp-bar-fill${v < 0 ? " neg" : ""}" style="--w:${w}%;display:block"></span></span>` +
        `<span class="cmp-bar-value">${v == null ? WARN : formattedValue(item, v)}</span></div>`;
    }).join("");
  }

  // ----- 3. evolução -----
  function renderLine(c) {
    const { item, s, years, d } = c;
    const box = $("cmp-line");
    $("cmp-line-title").textContent = `Evolução ${lower(item.name)}${years.length ? ` (${years[0]} – ${years[years.length - 1]})` : ""}`;
    if (years.length < 2) {
      box.innerHTML = `<p class="cmp-empty">Este indicador só tem dados de um ano${years[0] ? ` (${years[0]})` : ""}, por isso não há evolução para mostrar.</p>`;
      return;
    }
    const W = 900, H = 290, L = 52, R = 22, T = 26, B = 34;
    const showDest = d && !hidden.has("dest"), showAvg = !hidden.has("avg"), showOthers = !hidden.has("others");
    const others = munis.filter(n => n !== d);
    const pool = [];
    years.forEach(y => {
      if (showDest) pool.push(s[y]?.[d]);
      if (showAvg) pool.push(avgOf(s, y));
      if (showOthers) others.forEach(n => pool.push(s[y]?.[n]));
    });
    const all = pool.filter(v => v != null);
    const lo = Math.min(0, ...(all.length ? all : [0])), hi = Math.max(0, ...(all.length ? all : [1]));
    const step = niceStep(hi - lo || 1);
    const min = Math.floor(lo / step) * step, max = Math.ceil(hi / step) * step || step;
    const y = v => T + ((max - v) * (H - T - B)) / (max - min || 1);
    const x = yr => L + (years.indexOf(yr) * (W - L - R)) / (years.length - 1);

    let grid = "";
    for (let v = min; v <= max + step / 2; v += step) {
      const vv = Number(v.toFixed(6));
      grid += `<line class="${vv === 0 ? "zero" : "grid"}" x1="${L}" x2="${W - R}" y1="${y(vv)}" y2="${y(vv)}"/><text class="axis" x="${L - 8}" y="${y(vv) + 4}" text-anchor="end">${format(vv)}</text>`;
    }
    const every = Math.max(1, Math.ceil(years.length / 17));
    const xl = years.map((yr, i) =>
      (i % every === 0 && years.length - 1 - i >= Math.ceil(every / 2)) || i === years.length - 1
        ? `<text class="axis" x="${x(yr)}" y="${H - B + 20}" text-anchor="middle">${yr}</text>` : "").join("");

    // Caminho com quebra onde faltam dados.
    const path = get => {
      let p = "", pen = false;
      years.forEach(yr => {
        const v = get(yr);
        if (v == null) { pen = false; return; }
        p += `${pen ? "L" : "M"}${x(yr).toFixed(1)} ${y(v).toFixed(1)} `; pen = true;
      });
      return p;
    };
    let svgLines = "";
    if (showOthers) others.forEach(n => { svgLines += `<path d="${path(yr => s[yr]?.[n])}" fill="none" stroke="var(--cmp-line-other)" stroke-width="1.6" stroke-linejoin="round"/>`; });
    if (showAvg) svgLines += `<path d="${path(yr => avgOf(s, yr))}" fill="none" stroke="var(--forest)" stroke-width="2" stroke-dasharray="6 5"/>`;
    if (showDest) {
      svgLines += `<path d="${path(yr => s[yr]?.[d])}" fill="none" stroke="var(--cmp-accent)" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>`;
      const lastYr = [...years].reverse().find(yr => s[yr]?.[d] != null);
      years.forEach(yr => {
        const v = s[yr]?.[d];
        if (v == null) return;
        svgLines += yr === lastYr
          ? `<circle cx="${x(yr)}" cy="${y(v)}" r="5.5" fill="#fff" stroke="var(--cmp-accent)" stroke-width="3"/>`
          : `<circle cx="${x(yr)}" cy="${y(v)}" r="3.5" fill="var(--cmp-accent)"/>`;
      });
    }
    const bw = (W - L - R) / (years.length - 1);
    const bands = years.map(yr => `<rect class="band" data-year="${yr}" x="${x(yr) - bw / 2}" y="${T}" width="${bw}" height="${H - T - B}" fill="transparent"/>`).join("");

    const sw = (extra, dash) => `<svg viewBox="0 0 34 10" aria-hidden="true"><line x1="1" x2="33" y1="5" y2="5" stroke="${extra}" stroke-width="3" ${dash ? 'stroke-dasharray="6 4"' : ""} stroke-linecap="round"/></svg>`;
    const btn = (k, label, svg, off) => `<button type="button" data-k="${k}" class="${hidden.has(k) ? "off" : ""}" aria-pressed="${!hidden.has(k)}"${off ? " disabled" : ""}>${svg}${label}</button>`;
    const legend = `<div class="cmp-legend">` +
      btn("dest", d || "Município em destaque", sw("var(--cmp-accent)"), !d) +
      btn("avg", "Média do Alto Minho", sw("var(--forest)", true)) +
      btn("others", "Outros municípios", sw("var(--cmp-line-other)")) +
      `<span class="hint">Clique na legenda para ocultar/mostrar linhas.</span></div>`;

    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolução de ${item.name}, ${years[0]} a ${years[years.length - 1]}">` +
      `<text class="unit" x="4" y="${T - 10}">${unitOf(item) || ""}</text>${grid}${xl}${svgLines}` +
      `<line class="hover-line" y1="${T}" y2="${H - B}" hidden/>${bands}</svg><div class="line-tip" hidden></div>${legend}`;

    // Legenda clicável
    box.querySelector(".cmp-legend").addEventListener("click", e => {
      const b = e.target.closest("button[data-k]");
      if (!b || b.disabled) return;
      hidden.has(b.dataset.k) ? hidden.delete(b.dataset.k) : hidden.add(b.dataset.k);
      renderLine(c);
      box.querySelector(`[data-k="${b.dataset.k}"]`)?.focus();
    });
    // Tooltip por ano
    const tip = box.querySelector(".line-tip"), svg = box.querySelector("svg"), vline = box.querySelector(".hover-line");
    svg.addEventListener("mousemove", e => {
      const band = e.target.closest(".band");
      if (!band) { tip.hidden = vline.hidden = true; return; }
      const yr = band.dataset.year;
      const row = (label, v, cls = "") => (v == null ? "" : `<div class="${cls}"><span>${label}</span><b>${formattedValue(item, v)}</b></div>`);
      const rest = others.map(n => [n, s[yr]?.[n]]).filter(r => r[1] != null).sort((a, b) => b[1] - a[1]);
      tip.innerHTML = `<strong>${yr}</strong>` +
        (d ? row(d, s[yr]?.[d], "sel") : "") + row("Média do Alto Minho", avgOf(s, yr), "sel") +
        rest.map(([n, v]) => row(n, v)).join("");
      vline.setAttribute("x1", x(yr)); vline.setAttribute("x2", x(yr));
      vline.hidden = tip.hidden = false;
      const r = box.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
      tip.style.left = (px > r.width / 2 ? px - tip.offsetWidth - 14 : px + 14) + "px";
      tip.style.top = Math.max(0, Math.min(py, r.height - tip.offsetHeight)) + "px";
    });
    svg.addEventListener("mouseleave", () => { tip.hidden = vline.hidden = true; });
  }

  // ----- 4. leitura rápida -----
  function renderReading(c) {
    const { item, s, years, year, d } = c;
    const ul = $("cmp-reading"), li = [];
    if (!year) { ul.innerHTML = `<li>Sem dados municipais para este indicador.</li>`; return; }
    const avg = avgOf(s, year);
    if (!d) {
      li.push(`Média do Alto Minho: <strong>${formattedValue(item, avg)}</strong> em ${year}.`);
      li.push("Escolha um município no menu lateral para o destacar e ver a leitura.");
    } else {
      const dv = s[year]?.[d];
      if (dv == null) li.push(`Sem dados de <strong>${d}</strong> em ${year}.`);
      else {
        li.push(`${d} apresenta <strong>${formattedValue(item, dv)}</strong> em ${year}.`);
        if (avg != null)
          li.push(`Situa-se <strong>${dv < avg ? "abaixo da" : dv > avg ? "acima da" : "em linha com a"} média do Alto Minho</strong>${dv === avg ? "" : ` (${formattedValue(item, avg)})`}.`);
        const rank = munis.map(n => s[year]?.[n]).filter(v => v != null).sort((a, b) => b - a).indexOf(dv) + 1;
        const total = munis.filter(n => s[year]?.[n] != null).length;
        if (rank) li.push(`Ocupa o <strong>${rank}.º lugar</strong> entre ${total} municípios (do maior para o menor valor).`);
      }
      const pts = years.filter(yr => s[yr]?.[d] != null);
      if (pts.length >= 2) {
        const a = s[pts[0]][d], b = s[pts[pts.length - 1]][d], rel = a ? (b - a) / Math.abs(a) : 0;
        const trend = !a || Math.abs(rel) < 0.1 ? "tendência relativamente estável" : rel > 0 ? "tendência crescente" : "tendência decrescente";
        li.push(`Mantém <strong>${trend}</strong> ao longo da série (${pts[0]}–${pts[pts.length - 1]}).`);
      }
    }
    ul.innerHTML = li.map(t => `<li>${t}</li>`).join("");
  }

  // ----- desenho geral -----
  let lastKey = null;
  function draw() {
    const item = catalog.find(e => e.key === compareSelect.value) || catalog[0];
    const s = seriesOf(item), years = yearsOf(s);
    if (lastKey !== item.key || !years.includes(yearSel.value)) {
      lastKey = item.key;
      yearSel.innerHTML = years.slice().reverse().map(y => `<option>${y}</option>`).join("");
      yearSel.value = years[years.length - 1] || "";
    }
    yearSel.disabled = years.length < 2;
    const c = { item, s, years, year: yearSel.value || null, d: dest() };
    renderTop(c); renderBars(c); renderLine(c); renderReading(c);
  }

  compareSelect.addEventListener("change", draw);
  yearSel.addEventListener("change", draw);
  orderSel.addEventListener("change", draw);
  onTerritoryChange(draw);
  draw();
})();