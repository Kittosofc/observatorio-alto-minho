// Página Comparar: resumo, KPIs, barras por município, evolução e leitura rápida.
// Reutiliza do app.js: catalog, territoryNames, selectedTerritory, format, formattedValue, niceStep,
// compareSelect (#compare-indicator, já preenchido e guardado pelo app.js) e onTerritoryChange.
(function () {
  if (!compareSelect) return;
  const $ = (id) => document.getElementById(id);
  const yearSel = $("cmp-year"),
    orderSel = $("cmp-order");
  const munis = territoryNames.slice(1),
    AVG = "Alto Minho";
  const hidden = new Set(); // linhas escondidas na legenda: "dest" | "avg" | "others"
  const WARN = "—";

  // ----- ícones (traço simples) -----
  const ico = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const icons = {
    chart: ico('<path d="M5 20V10M12 20V4M19 20v-7"/>'),
    pin: ico(
      '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.800 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    ),
    people: ico(
      '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3.500 19c0-3 2.500-5 5.500-5s5.500 2 5.500 5M15 14.500c3 0 5.500 1.500 5.500 4.500"/>',
    ),
    layers: ico('<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>'),
    up: ico('<path d="M4 17 10 11l4 4 6-7M15 8h5v5"/>'),
    down: ico('<path d="M4 7l6 6 4-4 6 7M15 16h5v-5"/>'),
    info: ico(
      '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.500v.01"/>',
    ),
  };

  // ----- dados -----
  const seriesOf = (item) => ({ ...item.history, [item.year]: item.values });
  const yearsOf = (s) =>
    Object.keys(s)
      .filter((y) => munis.some((n) => s[y]?.[n] != null))
      .sort((a, b) => a - b);
  const avgOf = (s, y) => {
    const v = s[y]?.[AVG];
    if (v != null) return v;
    const a = munis.map((n) => s[y]?.[n]).filter((x) => x != null);
    return a.length ? a.reduce((p, c) => p + c, 0) / a.length : null;
  };
  const num = (item, v) =>
    v == null ? WARN : `${item.prefix || ""}${format(v)}`;
  const unitOf = (item) => (item.suffix || item.unit || "").trim();
  const lower = (t) =>
    /^.[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1);
  const dest = () =>
    munis.includes(selectedTerritory) ? selectedTerritory : null;
  // Indicador 2: copia as opções do seletor principal e acrescenta "Nenhum".
  const ind2Sel = $("cmp-ind2");
  ind2Sel.innerHTML =
    `<option value="">Nenhum</option>` + compareSelect.innerHTML;
  ind2Sel.value = "";
  const pearson = (s1, s2, y) => {
    const p = munis
      .map((n) => [s1[y]?.[n], s2[y]?.[n]])
      .filter((r) => r[0] != null && r[1] != null);
    if (p.length < 4) return null;
    const mx = p.reduce((a, r) => a + r[0], 0) / p.length,
      my = p.reduce((a, r) => a + r[1], 0) / p.length;
    let sxy = 0,
      sxx = 0,
      syy = 0;
    p.forEach(([a, b]) => {
      sxy += (a - mx) * (b - my);
      sxx += (a - mx) ** 2;
      syy += (b - my) ** 2;
    });
    return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
  };

  // ----- 1. resumo + KPIs -----
  function renderTop(c) {
    const { item, s, year, d, item2, s2 } = c;
    $("cmp-summary").classList.toggle("has-2", !!item2);
    $("cmp-summary").innerHTML =
      `<div>${icons.chart}<span><small>Indicador</small><b>${item.name}</b></span></div>` +
      (item2
        ? `<div>${icons.chart}<span><small>Indicador 2</small><b>${item2.name}</b></span></div>`
        : "") +
      `<div>${icons.pin}<span><small>Município em destaque</small><b>${d || "Nenhum selecionado"}</b></span></div>`;

    const big = (it, v) =>
      `<span class="v">${num(it, v)}<span>${unitOf(it)}</span></span>`;
    const avg = year ? avgOf(s, year) : null;
    const dv = d && year ? s[year]?.[d] : null;
    const rel = (v, a) =>
      v == null || a == null
        ? null
        : v < a
          ? "abaixo"
          : v > a
            ? "acima"
            : "em linha";

    if (item2) {
      const avg2 = year ? avgOf(s2, year) : null,
        dv2 = d && year ? s2[year]?.[d] : null;
      let msg = "Escolha um município no menu lateral para o destacar.";
      if (d) {
        const r1 = rel(dv, avg),
          r2 = rel(dv2, avg2);
        msg =
          r1 && r2
            ? `${d}: ${r1} da média em ${item.name} e ${r2} da média em ${item2.name}.`
            : `Sem dados de ${d} para um dos indicadores neste ano.`;
      }
      $("cmp-kpis").innerHTML =
        `<div class="cmp-kpi main">${icons.people}<span><small>${item.name}<strong>${d || "Município em destaque"}</strong></small>${big(item, dv)}</span></div>` +
        `<div class="cmp-kpi second">${icons.people}<span><small>${item2.name}<strong>${d || "Município em destaque"}</strong></small>${big(item2, dv2)}</span></div>` +
        `<div class="cmp-kpi">${icons.layers}<span><small>Média do Alto Minho<strong>${item.name}</strong></small>${big(item, avg)}</span></div>` +
        `<div class="cmp-kpi">${icons.layers}<span><small>Média do Alto Minho<strong>${item2.name}</strong></small>${big(item2, avg2)}</span></div>` +
        `<div class="cmp-kpi note">${icons.info}<span>${msg}</span></div>`;
      return;
    }

    const vals = year
      ? munis.map((n) => [n, s[year]?.[n]]).filter((r) => r[1] != null)
      : [];
    const hi = vals.reduce((m, r) => (m == null || r[1] > m[1] ? r : m), null);
    const lo = vals.reduce((m, r) => (m == null || r[1] < m[1] ? r : m), null);
    let msg = "Escolha um município no menu lateral para o destacar.";
    if (d && dv != null && avg != null)
      msg = `${d} ${dv < avg ? "abaixo da" : dv > avg ? "acima da" : "em linha com a"} média sub-regional.`;
    else if (d) msg = `Sem dados de ${d} para este ano.`;

    $("cmp-kpis").innerHTML =
      `<div class="cmp-kpi main">${icons.people}<span><small>${d || "Município em destaque"}</small>${big(item, dv)}</span></div>` +
      `<div class="cmp-kpi">${icons.layers}<span><small>Média do Alto Minho</small>${big(item, avg)}</span></div>` +
      `<div class="cmp-kpi up">${icons.up}<span><small>Valor mais alto<strong>${hi ? hi[0] : WARN}</strong></small>${big(item, hi?.[1])}</span></div>` +
      `<div class="cmp-kpi down">${icons.down}<span><small>Valor mais baixo<strong>${lo ? lo[0] : WARN}</strong></small>${big(item, lo?.[1])}</span></div>` +
      `<div class="cmp-kpi note">${icons.info}<span>${msg}</span></div>`;
  }

  // ----- 2. barras -----
  function renderBars(c) {
    const { item, s, year, d, item2, s2 } = c;
    const box = $("cmp-bars");
    $("cmp-bars-title").textContent = item2
      ? `${item.name} e ${item2.name} por município${year ? ` (${year})` : ""}`
      : `Municípios do Alto Minho por ${lower(item.name)}${year ? ` (${year})` : ""}`;
    if (!year) {
      box.innerHTML = `<p class="cmp-empty">Sem dados municipais ${item2 ? "comuns aos dois indicadores" : "para este indicador"}.</p>`;
      return;
    }
    const rows = munis.map((n) => [n, s[year]?.[n], s2 ? s2[year]?.[n] : null]);
    const order = orderSel.value;
    rows.sort(
      order === "asc"
        ? (a, b) => (a[1] ?? Infinity) - (b[1] ?? Infinity)
        : order === "az"
          ? (a, b) => a[0].localeCompare(b[0], "pt")
          : (a, b) => (b[1] ?? -Infinity) - (a[1] ?? -Infinity),
    );
    const mx = (i) => Math.max(...rows.map((r) => Math.abs(r[i] ?? 0))) || 1;
    const max = mx(1),
      max2 = item2 ? mx(2) : 1;
    const w = (v, m) =>
      v == null ? 0 : Math.max(1.5, (Math.abs(v) / m) * 100);
    box.setAttribute("role", "img");
    box.setAttribute(
      "aria-label",
      `${item.name}${item2 ? ` e ${item2.name}` : ""}, ${year}, por município`,
    );

    if (!item2) {
      box.innerHTML = rows
        .map(
          ([n, v]) =>
            `<div class="cmp-bar${n === d ? " dest" : ""}"><span class="cmp-bar-label" title="${n}">${n}</span>` +
            `<span class="cmp-bar-track"><span class="cmp-bar-fill${v < 0 ? " neg" : ""}" style="--w:${w(v, max)}%;display:block"></span></span>` +
            `<span class="cmp-bar-value">${v == null ? WARN : formattedValue(item, v)}</span></div>`,
        )
        .join("");
      return;
    }
    const key =
      `<div class="cmp-bars-key"><span><i style="--k:var(--cmp-accent)"></i>${item.name}</span>` +
      `<span><i style="--k:var(--cmp-accent2)"></i>${item2.name}</span></div>`;
    box.innerHTML =
      key +
      rows
        .map(
          ([n, v, v2]) =>
            `<div class="cmp-bar two${n === d ? " dest" : ""}"><span class="cmp-bar-label" title="${n}">${n}</span>` +
            `<span class="cmp-bar-tracks">` +
            `<span class="cmp-bar-track"><span class="cmp-bar-fill f1" style="--w:${w(v, max)}%;display:block"></span></span>` +
            `<span class="cmp-bar-track"><span class="cmp-bar-fill f2" style="--w:${w(v2, max2)}%;display:block"></span></span></span>` +
            `<span class="cmp-bar-values"><span>${v == null ? WARN : formattedValue(item, v)}</span><span>${v2 == null ? WARN : formattedValue(item2, v2)}</span></span></div>`,
        )
        .join("");
  }

  // ----- 3. evolução -----
  // Com dois indicadores usa dois eixos (esquerda: indicador 1; direita: indicador 2).
  function renderLine(c) {
    const { item, s, years, d, item2, s2 } = c;
    const box = $("cmp-line");
    $("cmp-line-title").textContent = item2
      ? `Evolução: ${item.name} e ${item2.name}${years.length ? ` (${years[0]} – ${years[years.length - 1]})` : ""}`
      : `Evolução ${lower(item.name)}${years.length ? ` (${years[0]} – ${years[years.length - 1]})` : ""}`;
    if (years.length < 2) {
      box.innerHTML = `<p class="cmp-empty">${item2 ? "Os dois indicadores não têm pelo menos dois anos em comum" : "Este indicador só tem dados de um ano"}${years[0] ? ` (${years[0]})` : ""}, por isso não há evolução para mostrar.</p>`;
      return;
    }
    const W = 900,
      H = 290,
      L = 52,
      R = item2 ? 58 : 22,
      T = 26,
      B = 34;
    const on = (k) => !hidden.has(k);
    const showDest = d && on("dest"),
      showAvg = on("avg"),
      showOthers = on("others");
    const showDest2 = item2 && d && on("dest2"),
      showAvg2 = item2 && on("avg2");
    const others = munis.filter((n) => n !== d);

    // escala (mín., máx., passo) para um conjunto de valores
    const scaleOf = (pool) => {
      const all = pool.filter((v) => v != null);
      const lo = Math.min(0, ...(all.length ? all : [0])),
        hi = Math.max(0, ...(all.length ? all : [1]));
      const step = niceStep(hi - lo || 1);
      const min = Math.floor(lo / step) * step,
        max = Math.ceil(hi / step) * step || step;
      return {
        min,
        max,
        step,
        y: (v) => T + ((max - v) * (H - T - B)) / (max - min || 1),
      };
    };
    const pool1 = [],
      pool2 = [];
    years.forEach((yr) => {
      if (showDest) pool1.push(s[yr]?.[d]);
      if (showAvg) pool1.push(avgOf(s, yr));
      if (showOthers) others.forEach((n) => pool1.push(s[yr]?.[n]));
      if (showDest2) pool2.push(s2[yr]?.[d]);
      if (showAvg2) pool2.push(avgOf(s2, yr));
    });
    const sc1 = scaleOf(pool1),
      sc2 = item2 ? scaleOf(pool2) : null;
    const x = (yr) =>
      L + (years.indexOf(yr) * (W - L - R)) / (years.length - 1);

    let grid = "";
    for (let v = sc1.min; v <= sc1.max + sc1.step / 2; v += sc1.step) {
      const vv = Number(v.toFixed(6));
      grid += `<line class="${vv === 0 ? "zero" : "grid"}" x1="${L}" x2="${W - R}" y1="${sc1.y(vv)}" y2="${sc1.y(vv)}"/><text class="axis" x="${L - 8}" y="${sc1.y(vv) + 4}" text-anchor="end">${format(vv)}</text>`;
    }
    if (sc2)
      for (let v = sc2.min; v <= sc2.max + sc2.step / 2; v += sc2.step) {
        const vv = Number(v.toFixed(6));
        grid += `<text class="axis" x="${W - R + 8}" y="${sc2.y(vv) + 4}" text-anchor="start" fill="var(--cmp-accent2)">${format(vv)}</text>`;
      }
    const every = Math.max(1, Math.ceil(years.length / 17));
    const xl = years
      .map((yr, i) =>
        (i % every === 0 && years.length - 1 - i >= Math.ceil(every / 2)) ||
        i === years.length - 1
          ? `<text class="axis" x="${x(yr)}" y="${H - B + 20}" text-anchor="middle">${yr}</text>`
          : "",
      )
      .join("");

    // Caminho com quebra onde faltam dados.
    const path = (get, y) => {
      let p = "",
        pen = false;
      years.forEach((yr) => {
        const v = get(yr);
        if (v == null) {
          pen = false;
          return;
        }
        p += `${pen ? "L" : "M"}${x(yr).toFixed(1)} ${y(v).toFixed(1)} `;
        pen = true;
      });
      return p;
    };
    const thick = (get, y, color) => {
      let out = `<path d="${path(get, y)}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>`;
      const lastYr = [...years].reverse().find((yr) => get(yr) != null);
      years.forEach((yr) => {
        const v = get(yr);
        if (v == null) return;
        out +=
          yr === lastYr
            ? `<circle cx="${x(yr)}" cy="${y(v)}" r="5.5" fill="#fff" stroke="${color}" stroke-width="3"/>`
            : `<circle cx="${x(yr)}" cy="${y(v)}" r="3.5" fill="${color}"/>`;
      });
      return out;
    };
    const ACC = "var(--cmp-accent)",
      ACC2 = "var(--cmp-accent2)";
    let svgLines = "";
    if (showOthers)
      others.forEach((n) => {
        svgLines += `<path d="${path((yr) => s[yr]?.[n], sc1.y)}" fill="none" stroke="var(--cmp-line-other)" stroke-width="1.6" stroke-linejoin="round"/>`;
      });
    if (showAvg)
      svgLines += `<path d="${path((yr) => avgOf(s, yr), sc1.y)}" fill="none" stroke="${item2 ? ACC : "var(--forest)"}" stroke-width="2" stroke-dasharray="6 5" opacity="${item2 ? 0.7 : 1}"/>`;
    if (showAvg2)
      svgLines += `<path d="${path((yr) => avgOf(s2, yr), sc2.y)}" fill="none" stroke="${ACC2}" stroke-width="2" stroke-dasharray="6 5" opacity="0.7"/>`;
    if (showDest) svgLines += thick((yr) => s[yr]?.[d], sc1.y, ACC);
    if (showDest2) svgLines += thick((yr) => s2[yr]?.[d], sc2.y, ACC2);
    const bw = (W - L - R) / (years.length - 1);
    const bands = years
      .map(
        (yr) =>
          `<rect class="band" data-year="${yr}" x="${x(yr) - bw / 2}" y="${T}" width="${bw}" height="${H - T - B}" fill="transparent"/>`,
      )
      .join("");

    const sw = (extra, dash) =>
      `<svg viewBox="0 0 34 10" aria-hidden="true"><line x1="1" x2="33" y1="5" y2="5" stroke="${extra}" stroke-width="3" ${dash ? 'stroke-dasharray="6 4"' : ""} stroke-linecap="round"/></svg>`;
    const btn = (k, label, svg, off) =>
      `<button type="button" data-k="${k}" class="${hidden.has(k) ? "off" : ""}" aria-pressed="${!hidden.has(k)}"${off ? " disabled" : ""}>${svg}${label}</button>`;
    const tag = (a, it) => (item2 ? `${a} · ${it.name}` : a);
    const legend =
      `<div class="cmp-legend">` +
      btn("dest", tag(d || "Município em destaque", item), sw(ACC), !d) +
      (item2
        ? btn("dest2", tag(d || "Município em destaque", item2), sw(ACC2), !d)
        : "") +
      btn(
        "avg",
        tag("Média do Alto Minho", item),
        sw(item2 ? ACC : "var(--forest)", true),
      ) +
      (item2
        ? btn("avg2", tag("Média do Alto Minho", item2), sw(ACC2, true))
        : "") +
      btn(
        "others",
        item2 ? `Outros municípios · ${item.name}` : "Outros municípios",
        sw("var(--cmp-line-other)"),
      ) +
      `<span class="hint">Clique na legenda para ocultar/mostrar linhas.</span></div>`;

    box.innerHTML =
      `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolução de ${item.name}${item2 ? ` e ${item2.name}` : ""}, ${years[0]} a ${years[years.length - 1]}">` +
      `<text class="unit" x="4" y="${T - 10}">${unitOf(item) || ""}</text>` +
      (item2
        ? `<text class="unit" x="${W - 4}" y="${T - 10}" text-anchor="end" fill="var(--cmp-accent2)">${unitOf(item2) || ""}</text>`
        : "") +
      `${grid}${xl}${svgLines}<line class="hover-line" y1="${T}" y2="${H - B}" hidden/>${bands}</svg><div class="line-tip" hidden></div>${legend}`;

    // Legenda clicável
    box.querySelector(".cmp-legend").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-k]");
      if (!b || b.disabled) return;
      hidden.has(b.dataset.k)
        ? hidden.delete(b.dataset.k)
        : hidden.add(b.dataset.k);
      renderLine(c);
      box.querySelector(`[data-k="${b.dataset.k}"]`)?.focus();
    });
    // Tooltip por ano
    const tip = box.querySelector(".line-tip"),
      svg = box.querySelector("svg"),
      vline = box.querySelector(".hover-line");
    svg.addEventListener("mousemove", (e) => {
      const band = e.target.closest(".band");
      if (!band) {
        tip.hidden = vline.hidden = true;
        return;
      }
      const yr = band.dataset.year;
      const row = (label, it, v, cls = "") =>
        v == null
          ? ""
          : `<div class="${cls}"><span>${label}</span><b>${formattedValue(it, v)}</b></div>`;
      const rest = showOthers
        ? others
            .map((n) => [n, s[yr]?.[n]])
            .filter((r) => r[1] != null)
            .sort((a, b) => b[1] - a[1])
        : [];
      tip.innerHTML =
        `<strong>${yr}</strong>` +
        (d ? row(tag(d, item), item, s[yr]?.[d], "sel") : "") +
        (item2 && d ? row(tag(d, item2), item2, s2[yr]?.[d], "sel") : "") +
        row(tag("Média do Alto Minho", item), item, avgOf(s, yr), "sel") +
        (item2
          ? row(tag("Média do Alto Minho", item2), item2, avgOf(s2, yr), "sel")
          : "") +
        rest.map(([n, v]) => row(n, item, v)).join("");
      vline.setAttribute("x1", x(yr));
      vline.setAttribute("x2", x(yr));
      vline.hidden = tip.hidden = false;
      const r = box.getBoundingClientRect(),
        px = e.clientX - r.left,
        py = e.clientY - r.top;
      tip.style.left =
        (px > r.width / 2 ? px - tip.offsetWidth - 14 : px + 14) + "px";
      tip.style.top =
        Math.max(0, Math.min(py, r.height - tip.offsetHeight)) + "px";
    });
    svg.addEventListener("mouseleave", () => {
      tip.hidden = vline.hidden = true;
    });
  }

  // ----- 4. leitura rápida -----
  function renderReading(c) {
    const { item, s, years, year, d, item2, s2 } = c;
    const ul = $("cmp-reading"),
      li = [];
    if (!year) {
      ul.innerHTML = `<li>Sem dados municipais ${item2 ? "comuns aos dois indicadores" : "para este indicador"}.</li>`;
      return;
    }

    // Factos de um indicador para o município em destaque.
    const facts = (it, ss, pre) => {
      const avg = avgOf(ss, year),
        dv = d ? ss[year]?.[d] : null;
      if (!d) {
        li.push(
          `${pre}Média do Alto Minho: <strong>${formattedValue(it, avg)}</strong> em ${year}.`,
        );
        return;
      }
      if (dv == null) {
        li.push(`${pre}Sem dados de <strong>${d}</strong> em ${year}.`);
        return;
      }
      let t = `${pre}${d} apresenta <strong>${formattedValue(it, dv)}</strong> em ${year}`;
      if (avg != null)
        t += `, <strong>${dv < avg ? "abaixo da" : dv > avg ? "acima da" : "em linha com a"} média</strong>${dv === avg ? "" : ` (${formattedValue(it, avg)})`}`;
      const rank =
        munis
          .map((n) => ss[year]?.[n])
          .filter((v) => v != null)
          .sort((a, b) => b - a)
          .indexOf(dv) + 1;
      const total = munis.filter((n) => ss[year]?.[n] != null).length;
      if (rank) t += `, em <strong>${rank}.º lugar</strong> entre ${total}`;
      li.push(t + ".");
    };
    const trend = (it, ss, pre) => {
      const pts = years.filter((yr) => ss[yr]?.[d] != null);
      if (pts.length < 2) return;
      const a = ss[pts[0]][d],
        b = ss[pts[pts.length - 1]][d],
        rel = a ? (b - a) / Math.abs(a) : 0;
      const t =
        !a || Math.abs(rel) < 0.1
          ? "tendência relativamente estável"
          : rel > 0
            ? "tendência crescente"
            : "tendência decrescente";
      li.push(
        `${pre}Mantém <strong>${t}</strong> (${pts[0]}–${pts[pts.length - 1]}).`,
      );
    };

    if (!d) {
      facts(item, s, item2 ? `<em>${item.name}</em>: ` : "");
      if (item2) facts(item2, s2, `<em>${item2.name}</em>: `);
      li.push(
        "Escolha um município no menu lateral para o destacar e ver a leitura.",
      );
    } else {
      facts(item, s, item2 ? `<em>${item.name}</em>: ` : "");
      if (item2) facts(item2, s2, `<em>${item2.name}</em>: `);
      trend(item, s, item2 ? `<em>${item.name}</em>: ` : "");
      if (item2) trend(item2, s2, `<em>${item2.name}</em>: `);
    }
    if (item2) {
      const r = pearson(s, s2, year);
      if (r != null) {
        const f =
          Math.abs(r) >= 0.7
            ? "forte"
            : Math.abs(r) >= 0.4
              ? "moderada"
              : "fraca";
        li.push(
          `Entre municípios, a relação é <strong>${f} e ${r >= 0 ? "positiva" : "negativa"}</strong> (r = ${r.toFixed(2).replace(".", ",")}): ${r >= 0 ? "valores altos de um tendem a vir com valores altos do outro" : "valores altos de um tendem a vir com valores baixos do outro"}.`,
        );
      }
    }
    ul.innerHTML = li.map((t) => `<li>${t}</li>`).join("");
  }

  // ----- desenho geral -----
  let lastKey = null;
  function draw() {
    const item =
      catalog.find((e) => e.key === compareSelect.value) || catalog[0];
    const item2 =
      ind2Sel.value && ind2Sel.value !== item.key
        ? catalog.find((e) => e.key === ind2Sel.value)
        : null;
    const s = seriesOf(item),
      s2 = item2 ? seriesOf(item2) : null;
    const y1 = yearsOf(s),
      years = item2 ? y1.filter((y) => yearsOf(s2).includes(y)) : y1;
    const key = item.key + "|" + (item2 ? item2.key : "");
    if (lastKey !== key || !years.includes(yearSel.value)) {
      lastKey = key;
      yearSel.innerHTML = years
        .slice()
        .reverse()
        .map((y) => `<option>${y}</option>`)
        .join("");
      yearSel.value = years[years.length - 1] || "";
    }
    yearSel.disabled = years.length < 2;
    const c = {
      item,
      s,
      item2,
      s2,
      years,
      year: yearSel.value || null,
      d: dest(),
    };
    renderTop(c);
    renderBars(c);
    renderLine(c);
    renderReading(c);
  }

  compareSelect.addEventListener("change", draw);
  ind2Sel.addEventListener("change", draw);
  yearSel.addEventListener("change", draw);
  orderSel.addEventListener("change", draw);
  onTerritoryChange(draw);
  draw();
})();
