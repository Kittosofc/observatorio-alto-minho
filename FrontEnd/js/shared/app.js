/*
 * Observatório Alto Minho — núcleo partilhado da aplicação.
 * Responsabilidades: catálogo de indicadores, território selecionado,
 * renderização comum e eventos reutilizados pelas páginas.
 * Funcionalidades exclusivas de cada página vivem em FrontEnd/js/pages/.
 */
// ===== 1. DADOS DE BASE =====
// Lista dos territórios: o total do Alto Minho + os 10 municípios (é o que aparece no <select>).
const territoryNames = ["Alto Minho", "Arcos de Valdevez", "Caminha", "Melgaço", "Monção", "Paredes de Coura", "Ponte da Barca", "Ponte de Lima", "Valença", "Viana do Castelo", "Vila Nova de Cerveira"];

// Etiquetas do mapa em duas linhas para os nomes compridos (só afeta o texto desenhado no mapa).
const mapLabels = {
  "Vila Nova de Cerveira": ["V. N.", "Cerveira"], "Paredes de Coura": ["Paredes", "de Coura"],
  "Arcos de Valdevez": ["Arcos de", "Valdevez"], "Ponte da Barca": ["Ponte da", "Barca"],
  "Ponte de Lima": ["Ponte", "de Lima"], "Viana do Castelo": ["Viana do", "Castelo"]
};

// Correções por indicador (catalogOverrides): ver js/data/catalog-overrides.js

// ===== 2. ÁREAS (separadores) =====
// Cada indicador aparece no separador (tab) da sua área: primeiro as exceções por nome (emprego/educacao),
// depois o domínio do catálogo. Os que não encaixam em nenhum separador vão para "Outros" e mantêm o nome original.
const areaByDomain = {
  "Demografia":"Demografia", "Habitação":"Habitação", "Saúde":"Saúde",
  "Proteção Social":"Coesão social", "Mobilidade":"Emprego"
};
// Separador onde o indicador aparece ("Outros" se não encaixar em nenhum).
const tabOf = item => areaByDomain[item.domain] || "Outros"; // valor por defeito; o catalogOverrides tem prioridade

// ===== 2b. CATEGORIAS DA PÁGINA INDICADORES =====
// Botões de filtro da tabela. Cada indicador tem uma categoria (e a Demografia ainda uma subcategoria).
// Por defeito segue o domínio do catálogo; as exceções estão no catalogOverrides (campo area).
const categoryList = ["Demografia","Social","Habitação","Saúde","Educação","Território"];
const demografiaSubs = ["População","Natalidade","Migração","Esperança de Vida"];
const categoryByDomain = { "Contexto Geográfico":"Demografia", "Demografia":"Demografia", "Saúde":"Saúde", "Proteção Social":"Social", "Família":"Social",
  "Habitação":"Habitação", "Condições de vida":"Habitação", "Mobilidade":"Território", "Cultura":"Território", "Segurança":"Território" };
const categoryOf = item => categoryByDomain[item.domain] || "Território"; // valor por defeito
const subOf = item => categoryOf(item) === "Demografia" ? "População" : ""; // valor por defeito

// ===== 3. CATÁLOGO FINAL =====
// Junta, para cada indicador: dados do catálogo (catalog-data.js) + valores por território
// (indicator-values.js, ligados pelo nome) + área + correções de catalogOverrides.
// Cada item fica com: key, rawName, name, area, source, sourceUrl, description, year, values, unit...
const catalog = indicatorCatalog.map((item, index) => {
  const dataset = indicatorValuesByName[item.name];
  const context = [item.theme, item.category].filter(Boolean).join(" · ");
  const base = { key:`catalog-${index + 1}`, rawName:item.name, name:item.name, tab:tabOf(item), area:categoryOf(item), sub:subOf(item), source:item.source,
    sourceUrl:item.url, description:context ? `${context}. Indicador integrado na matriz intermunicipal.` : "Indicador integrado na matriz intermunicipal.", ...dataset };
  return { ...base, ...(catalogOverrides[item.name] || {}) };
});

// Nomes curtos ("chaves") para os indicadores usados nos cartões e KPIs.
// Ex.: legacyNames.ageing -> nome completo do indicador no catálogo.
const legacyNames = {
  population:"População residente: total 2015 a 2025", ageing:"Índice de envelhecimento", housing:"Preço médio m²",
  migration:"Saldo Migratório", unemployment:"Desempregados inscritos nos centros de emprego e de formação profissional no total da população residente com 15 a 64 anos (%)",
  income:"Rendimento médio", secondary:"Taxa de retenção e desistência no ensino secundário: total, por modalidade de ensino e ano de escolaridade", doctors:"Profissionais de saúde: médicos, dentistas, enfermeiros e farmacêuticos",
  rsi:"Beneficiários do Rendimento Mínimo Garantido e Rendimento Social de Inserção da Segurança Social: total e por sexo",
  foreign:"População estrangeira com estatuto legal de residente: total e por algumas nacionalidades", youth:"Índice de dependência de jovens",
  elderly:"Índice de dependência idosos", commuting:"Proporção de pop. residente em movimentos pendulares"
};

// Procura um indicador do catálogo pelo nome original.
const byRawName = name => catalog.find(item => item.rawName === name);
// Valor de um indicador (chave curta) para um território.
const metric = (legacyKey, territory) => byRawName(legacyNames[legacyKey])?.values?.[territory];
// Devolve {population, ageing, housing...} com os valores de um território, para usar nos cartões.
const dataFor = territory => Object.fromEntries(Object.keys(legacyNames).map(key => [key, metric(key, territory)]));
// Um cartão = [valor, texto a mostrar, nome original do indicador (para ir buscar ano e fonte)].
const card = (value, label, rawName) => [value, label, rawName];

// ===== 4. SEPARADORES TEMÁTICOS =====
// Para cada área: título, descrição e os 4 cartões de destaque. cards(d) recebe os dados do território
// escolhido (d) e devolve a lista de cartões.
const themes = {
  "Outros": { title:"Outros indicadores", description:"Indicadores que não pertencem a nenhuma das áreas anteriores.", cards:d => ["Superfície Km2","Poder de compra per capita","Crimes registados pelas polícias por mil habitantes","Despesa das Câmaras Municipais em cultura e desporto: total, correntes e de capital"].map(rawName => card(byRawName(rawName).values[selectedTerritory], byRawName(rawName).name, rawName)) },
  "Demografia": { title:"Estrutura e dinâmica da população", description:"Leia a evolução demográfica e compare o território com o Alto Minho.", cards:d => [card(d.ageing,"Índice de envelhecimento",legacyNames.ageing),card(d.migration,"Saldo migratório",legacyNames.migration),card(d.youth,"Índice de dependência de jovens",legacyNames.youth),card(d.elderly,"Índice de dependência de idosos",legacyNames.elderly)] },
  "Habitação": { title:"Acesso e condições de habitação", description:"Acompanhe preços e dinâmica residencial no território.", cards:d => [card(d.housing,"Preço médio por m²",legacyNames.housing),card(d.population,"População residente",legacyNames.population),card(d.migration,"Saldo migratório",legacyNames.migration),card(d.income,"Ganho médio mensal",legacyNames.income)] },
  "Emprego": { title:"Trabalho, rendimento e atividade", description:"Compare emprego e rendimentos no contexto intermunicipal.", cards:d => [card(d.unemployment,"Desempregados na população ativa (%)",legacyNames.unemployment),card(d.income,"Ganho médio mensal",legacyNames.income),card(d.commuting,"Movimentos pendulares (%)",legacyNames.commuting),card(d.foreign,"População estrangeira residente",legacyNames.foreign)] },
  "Educação": { title:"Qualificações e sucesso educativo", description:"Observe retenção, desistência e condições de qualificação.", cards:d => [card(d.secondary,"Retenção e desistência no secundário (%)",legacyNames.secondary),card(byRawName("Taxa de retenção e desistência no ensino básico: total e por ano de escolaridade").values[selectedTerritory],"Retenção e desistência no básico (%)","Taxa de retenção e desistência no ensino básico: total e por ano de escolaridade"),card(byRawName("Estabelecimentos nos ensinos pré-escolar, básico e secundário: por nível de ensino").values[selectedTerritory],"Estabelecimentos de ensino","Estabelecimentos nos ensinos pré-escolar, básico e secundário: por nível de ensino")] },
  "Saúde": { title:"Acesso a cuidados de saúde", description:"Acompanhe a disponibilidade de profissionais e a pressão demográfica.", cards:d => [card(d.doctors,"Profissionais de saúde",legacyNames.doctors),card(byRawName("Habitantes por médico e farmacêutico").values[selectedTerritory],"Habitantes por médico","Habitantes por médico e farmacêutico"),card(byRawName("Habitantes por farmácia e posto farmacêutico móvel").values[selectedTerritory],"Habitantes por farmácia","Habitantes por farmácia e posto farmacêutico móvel"),card(d.elderly,"Dependência de idosos",legacyNames.elderly)] },
  "Coesão social": { title:"Proteção e inclusão social", description:"Identifique necessidades sociais e apoie a distribuição de recursos.", cards:d => [card(d.rsi,"Beneficiários de RSI",legacyNames.rsi),card(d.foreign,"População estrangeira residente",legacyNames.foreign),card(byRawName("Pensões: total, da Segurança Social e da Caixa Geral de Aposentações").values[selectedTerritory],"Pensões — total","Pensões: total, da Segurança Social e da Caixa Geral de Aposentações"),card(byRawName("Abono de família para crianças e jovens da Segurança Social").values[selectedTerritory],"Beneficiários de abono de família","Abono de família para crianças e jovens da Segurança Social")] }
};

// ===== 5. ESTADO E ELEMENTOS DA PÁGINA =====
// select = escolha do território; compareSelect = escolha do indicador (página Comparar); mapNodes = mapa SVG.
// O território e o indicador escolhidos ficam guardados no localStorage para persistirem entre páginas.
const select = document.querySelector("#territory-select"), compareSelect = document.querySelector("#compare-indicator"), compareSelect2 = document.querySelector("#compare-indicator-2"), mapNodes = document.querySelector("#map-nodes");
const savedTerritory = localStorage.getItem("observatorio-territory");
const savedIndicatorKey = localStorage.getItem("observatorio-indicator");
let selectedTerritory = territoryNames.includes(savedTerritory) ? savedTerritory : "Alto Minho";
let selectedTheme = "Demografia";
let selectedCategory = "Todas", selectedSub = "";
let selectedIndicatorKey = catalog.some(item => item.key === savedIndicatorKey) ? savedIndicatorKey : byRawName(legacyNames.population).key;
// Formata números à portuguesa (casas decimais e separadores); sem valor mostra "—".
const format = value => value == null || value === "—" ? "—" : typeof value === "string" ? value : new Intl.NumberFormat("pt-PT", { maximumFractionDigits:2 }).format(value);
// Valor pronto a mostrar: prefixo + número formatado + sufixo (ex.: "245,3", "108,47 km²").
const formattedValue = (item, value) => `${item.prefix || ""}${format(value)}${item.suffix || ""}`;

// Preenche o <select> de territórios (só existe em algumas páginas, por isso o if).
if(select) territoryNames.forEach(name => { const option=document.createElement("option"); option.value=name; option.textContent=name; select.appendChild(option); });
// Preenche o <select> de indicadores da página Comparar com os 50 indicadores.
if(compareSelect){catalog.forEach(item => { const option=document.createElement("option"); option.value=item.key; option.textContent=item.name; compareSelect.appendChild(option); });compareSelect.value=selectedIndicatorKey;}
// Segundo indicador (opcional) do Gráfico 1: "Nenhum" + os mesmos indicadores.
if(compareSelect2){compareSelect2.innerHTML='<option value="">— Nenhum —</option>';catalog.forEach(item => { const option=document.createElement("option"); option.value=item.key; option.textContent=item.name; compareSelect2.appendChild(option); });const saved2=localStorage.getItem("observatorio-indicator-2");compareSelect2.value=catalog.some(i=>i.key===saved2)?saved2:"";}
// Posições de etiqueta corrigidas à mão (a original ficava sobre a fronteira e era tapada pelo vizinho).
const mapLabelOverrides = { "Ponte da Barca":[402,228] };
if(mapNodes) municipalityMapShapes.forEach(({ name, path, label:labelPos }) => {
  const [x,y] = mapLabelOverrides[name] || labelPos;
  const ns="http://www.w3.org/2000/svg", g=document.createElementNS(ns,"g"), shape=document.createElementNS(ns,"path"), title=document.createElementNS(ns,"title"), label=document.createElementNS(ns,"text");
  g.classList.add("municipality-node"); g.dataset.territory=name; g.setAttribute("tabindex","0"); g.setAttribute("role","button"); g.setAttribute("aria-label",`Selecionar ${name}`);
  shape.setAttribute("d",path); shape.setAttribute("fill-rule","evenodd"); title.textContent=name;
  (mapLabels[name] || [name]).forEach((line,index,lines) => { const tspan=document.createElementNS(ns,"tspan"); tspan.setAttribute("x",x); tspan.setAttribute("y",Number(y)+(index-(lines.length-1)/2)*10); tspan.textContent=line; label.appendChild(tspan); });
  g.append(shape,title,label); mapNodes.appendChild(g); g.addEventListener("click",()=>setTerritory(name)); g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setTerritory(name);}});
});

// Minimapa (canto superior esquerdo): a região inteira numa só forma, com o nome "Alto Minho" e sem interação.
const miniMap = document.querySelector("#mini-map"), miniShapes = document.querySelector("#mini-map-shapes");
if(miniMap && miniShapes){
  const ns="http://www.w3.org/2000/svg";
  municipalityMapShapes.forEach(({ path }) => { const p=document.createElementNS(ns,"path"); p.setAttribute("d",path); p.setAttribute("fill-rule","evenodd"); miniShapes.appendChild(p); });
  const b=miniShapes.getBBox(); miniMap.querySelector("svg").setAttribute("viewBox",`${b.x-2} ${b.y-2} ${b.width+4} ${b.height+4}`);
  const t=document.createElementNS(ns,"text"); t.setAttribute("x",b.x+b.width/2); t.setAttribute("y",b.y+b.height/2); t.setAttribute("font-size",b.width*0.06); t.textContent="Alto Minho"; miniMap.querySelector("svg").appendChild(t);
  miniMap.setAttribute("role","button"); miniMap.setAttribute("tabindex","0"); miniMap.setAttribute("aria-label","Selecionar Alto Minho");
  miniMap.addEventListener("click",()=>setTerritory("Alto Minho")); miniMap.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setTerritory("Alto Minho");}});
}

// Muda o território ativo: guarda a escolha, atualiza o título, o select e o mapa, e volta a desenhar tudo.
function setTerritory(name){ selectedTerritory=name; localStorage.setItem("observatorio-territory",name); if(select)select.value=name; const title=document.querySelector("#territory-title");if(title)title.textContent=name; document.querySelectorAll(".municipality-node").forEach(n=>n.classList.toggle("active",n.dataset.territory===name)); if(miniMap)miniMap.classList.toggle("active",name==="Alto Minho"); render(); }

// Desenha os 4 números grandes do topo (população, envelhecimento, preço m², saldo migratório).
function renderKpis(data){
  const target=document.querySelector("#kpi-grid");if(!target)return;
  const specs=[["population","População residente"],["ageing","Índice de envelhecimento"],["housing","Preço médio por m²"],["migration","Saldo migratório"]];
  target.innerHTML=specs.map(([key,label])=>{const item=byRawName(legacyNames[key]);return `<article class="kpi"><div class="year">${item.year}</div><div class="value">${formattedValue(item,data[key])}</div><div class="label">${label}</div></article>`;}).join("");
}

// Desenha o bloco do separador ativo: título, descrição e os 4 cartões da área.
function renderTheme(data){
  if(!document.querySelector("#indicator-cards"))return;
  const theme=themes[selectedTheme]; document.querySelector("#theme-kicker").textContent=`Área de ${selectedTheme}`; document.querySelector("#theme-title").textContent=theme.title; document.querySelector("#theme-description").textContent=theme.description;
  document.querySelector("#indicator-cards").innerHTML=theme.cards(data).map(([value,label,rawName])=>{const item=byRawName(rawName);return `<article class="indicator"><strong>${formattedValue(item,value)}</strong><span>${label}</span><small>${item.year} · ${item.source}</small></article>`;}).join("");
}

// Página Comparar: gráfico de barras com o indicador escolhido nos 10 municípios, por ordem decrescente.
// O município selecionado fica destacado; valores negativos usam outra cor.
function renderComparison(){
  const chart=document.querySelector("#comparison-chart");if(!compareSelect||!chart)return;
  const item=catalog.find(entry=>entry.key===compareSelect.value)||catalog[0];
  const item2=compareSelect2&&compareSelect2.value&&compareSelect2.value!==item.key?catalog.find(entry=>entry.key===compareSelect2.value):null;
  const rows=territoryNames.slice(1).map(name=>[name,item.values[name]]).sort((a,b)=>(b[1]??-Infinity)-(a[1]??-Infinity));
  const maxOf=it=>Math.max(...territoryNames.slice(1).map(name=>Math.abs(it.values[name]??0)),1);
  const max=maxOf(item), max2=item2?maxOf(item2):1;
  const bar=(it,value,m,cls)=>`<div class="bar-track"><div class="bar-fill${cls}${value<0&&!item2?' negative':''}" style="--bar:${value==null?0:Math.max(2,Math.abs(value)/m*100)}%"></div></div>`;
  chart.setAttribute("aria-label",`${item.name}, ${item.year}${item2?` e ${item2.name}, ${item2.year}`:`, ${item.dimension}`}`);
  const legend=item2?`<div class="compare-legend"><span><i class="dot a"></i>${item.name} (${item.year})</span><span><i class="dot b"></i>${item2.name} (${item2.year})</span></div>`:"";
  chart.innerHTML=legend+rows.map(([name,value])=>{
    const v2=item2?item2.values[name]:null;
    return `<div class="bar-row ${item2?'dual':''} ${name===selectedTerritory?'selected':''}"><div class="bar-label" title="${name}">${name}</div><div class="bar-tracks">${bar(item,value,max,"")}${item2?bar(item2,v2,max2," b"):""}</div><div class="bar-values"><div class="bar-value">${formattedValue(item,value)}</div>${item2?`<div class="bar-value b">${formattedValue(item2,v2)}</div>`:""}</div></div>`;
  }).join("");
}

// Página Comparar: gráfico de barras agrupadas que compara os anos de um indicador (do mais antigo ao mais recente),
// com um grupo por município. Só aparece nos indicadores com pelo menos 2 anos de dados.
// O município escolhido no menu lateral fica destacado.
const yearColors=["#b7d3ee","#bfe0c7","#f6dd94","#ef9a93"]; // do ano mais antigo ao mais recente
// Passo "redondo" (1, 2, 5 × 10ⁿ) para as linhas de referência do eixo.
const niceStep=range=>{const raw=range/4,power=10**Math.floor(Math.log10(raw)),n=raw/power;return(n<=1?1:n<=2?2:n<=5?5:10)*power;};

const lineColors=["#2f6fb0","#e07a3f","#3a9d6b","#b04a8f","#c9a227","#6b5bd2","#d1463f","#2aa5b5","#7a8b2e","#8a6a4f"];
const hiddenLines=new Set();
function renderYearComparison(){
  const chart=document.querySelector("#year-chart"); if(!compareSelect||!chart)return;
  const item=catalog.find(entry=>entry.key===compareSelect.value)||catalog[0];
  const municipalities=territoryNames.slice(1);

  // Junta o histórico ao ano mais recente; fica só com os anos que têm valores.
  const series={...item.history,[item.year]:item.values};
  const years=Object.keys(series).filter(year=>municipalities.some(name=>series[year]?.[name]!=null&&series[year][name]!==0)).sort((a,b)=>Number(a)-Number(b));
  if(years.length<2){chart.innerHTML=`<p class="history-empty">Este indicador só tem dados de um ano${years[0]?` (${years[0]})`:""}, por isso não há comparação entre anos.</p>`;return;}

  // Escalas: eixo X pelos anos, eixo Y só com os municípios visíveis.
  const W=760,H=360,left=64,right=24,top=20,bottom=40;
  const visible=municipalities.filter(name=>!hiddenLines.has(name));
  const all=visible.flatMap(name=>years.map(year=>series[year]?.[name])).filter(value=>value!=null);
  const lo=all.length?Math.min(...all):0, hi=all.length?Math.max(...all):1;
  const step=niceStep(hi-lo||Math.abs(hi)||1);
  const min=Math.floor(lo/step)*step, max=Math.ceil(hi/step)*step||step;
  const y=value=>top+(max-value)*(H-top-bottom)/((max-min)||1);
  const x=year=>left+years.indexOf(year)*(W-left-right)/((years.length-1)||1);

  const ticks=[];for(let value=min;value<=max+step/2;value+=step)ticks.push(value);
  const grid=ticks.map(value=>`<line class="grid" x1="${left}" x2="${W-right}" y1="${y(value)}" y2="${y(value)}"/><text class="axis" x="${left-8}" y="${y(value)+4}" text-anchor="end">${format(Number(value.toFixed(6)))}</text>`).join("");
  const every=Math.max(1,Math.ceil(years.length/18));
  const xlabels=years.map((year,i)=>(i%every===0&&years.length-1-i>=Math.ceil(every/2)||i===years.length-1)?`<text class="axis" x="${x(year)}" y="${H-bottom+20}" text-anchor="middle">${year}</text>`:"").join("");

  // Uma linha por município (quebra onde faltam dados); o selecionado fica mais grosso.
  const hasSel=municipalities.includes(selectedTerritory);
  const lines=municipalities.map((name,i)=>{
    if(hiddenLines.has(name))return "";
    const color=lineColors[i%lineColors.length], isSel=name===selectedTerritory;
    let solid="",dashed="",prev=null;
    years.forEach(year=>{const v=series[year]?.[name];if(v==null)return;const pt=`${x(year).toFixed(1)} ${y(v).toFixed(1)}`;
      if(prev){const seg=`M${prev.pt} L${pt} `;if(Number(year)-prev.year>1)dashed+=seg;else solid+=seg;}
      prev={pt,year:Number(year)};});
    const dots=years.length>(isSel?30:12)?"":years.map(year=>{const v=series[year]?.[name];return v==null?"":`<circle cx="${x(year)}" cy="${y(v)}" r="${isSel?4.5:3}" fill="${color}"/>`;}).join("");
    return `<g class="line-group ${isSel?"selected":""} ${hasSel&&!isSel?"dim":""}"><path d="${solid}" fill="none" stroke="${color}" stroke-width="${isSel?4:2}" stroke-linejoin="round" stroke-linecap="round"/><path d="${dashed}" fill="none" stroke="${color}" stroke-width="${isSel?4:2}" stroke-dasharray="2 5" stroke-linecap="round"/>${dots}</g>`;}).join("");

  // Zonas invisíveis por ano, para o tooltip com todos os municípios nesse ano.
  const bandW=(W-left-right)/Math.max(years.length-1,1);
  const bands=years.map(year=>`<rect class="year-band" data-year="${year}" x="${x(year)-bandW/2}" y="${top}" width="${bandW}" height="${H-top-bottom}" fill="transparent"/>`).join("");

  // Seletor de municípios: caixas de seleção organizadas em grelha, com "Todos" / "Nenhum".
  const boxes=municipalities.map((name,i)=>`<label class="muni-check ${hiddenLines.has(name)?"off":""}"><input type="checkbox" data-line="${name}" ${hiddenLines.has(name)?"":"checked"}><span class="box" style="--c:${lineColors[i%lineColors.length]}"></span>${name}</label>`).join("");
  const legend=`<div class="muni-picker"><div class="muni-picker-head"><span>Municípios <b>${visible.length}/${municipalities.length}</b></span></div><div class="muni-grid">${boxes}</div></div>`;
  const note=hasSel?`Destacado: <strong>${selectedTerritory}</strong> · use as caixas para mostrar/esconder municípios · passe o rato num ano para ver os valores.`:`Escolha um município no menu lateral para o destacar · use as caixas para mostrar/esconder municípios · passe o rato num ano para ver os valores.`;

  chart.setAttribute("aria-label",`Evolução de ${item.name}, ${years[0]} a ${years[years.length-1]}`);
  chart.style.position="relative";
  chart.innerHTML=`${legend}<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolução de ${item.name} entre ${years.join(", ")}">${grid}${xlabels}${lines}<line class="hover-line" y1="${top}" y2="${H-bottom}" hidden/>${bands}</svg><div class="line-tip" hidden></div><p class="history-note">${note}</p>`;

  const tip=chart.querySelector(".line-tip"), svg=chart.querySelector("svg"), vline=chart.querySelector(".hover-line");
  const picker=chart.querySelector(".muni-picker");
  picker.addEventListener("change",e=>{const n=e.target.dataset.line;if(!n)return;e.target.checked?hiddenLines.delete(n):hiddenLines.add(n);window.renderYearComparison();chart.querySelector(`[data-line="${n}"]`)?.focus();});
  svg.addEventListener("mousemove",e=>{
    const band=e.target.closest(".year-band"); if(!band){tip.hidden=true;vline.hidden=true;return;}
    const year=band.dataset.year;
    const rows=visible.map(name=>[name,series[year]?.[name]]).filter(r=>r[1]!=null).sort((a,b)=>b[1]-a[1]);
    tip.innerHTML=`<strong>${year}</strong>${rows.map(([name,v])=>`<div class="${name===selectedTerritory?"sel":""}"><span>${name}</span><b>${formattedValue(item,v)}</b></div>`).join("")}`;
    vline.setAttribute("x1",x(year));vline.setAttribute("x2",x(year));vline.hidden=false;tip.hidden=false;
    const box=chart.getBoundingClientRect(), px=e.clientX-box.left, py=e.clientY-box.top;
    tip.style.left=(px>box.width/2?px-tip.offsetWidth-14:px+14)+"px"; tip.style.top=Math.max(0,Math.min(py,box.height-tip.offsetHeight))+"px";
  });
  svg.addEventListener("mouseleave",()=>{tip.hidden=true;vline.hidden=true;});
}

// Tabela de indicadores. Sem pesquisa mostra só os da área ativa; com pesquisa procura em todos.
// Clicar numa linha escolhe o indicador (o detalhe de cima atualiza); duplo clique faz scroll até ele.
let hiddenIndicators=new Set(); // indicadores escondidos pelo admin (guardados em backend/php/data/indicadores.json)
function renderCatalog(query=""){
  const body=document.querySelector("#catalog-body"),empty=document.querySelector("#catalog-empty"),caption=document.querySelector("#catalog-caption");if(!body||!empty)return;
  // Com pesquisa, procura em todos os indicadores; sem pesquisa, mostra só os da área escolhida.
  const norm=t=>String(t).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-PT");const normalized=norm(query.trim());
  const matches=normalized
    ? catalog.filter(item=>norm(`${item.name} ${item.area} ${item.year} ${item.source} ${item.dimension}`).includes(normalized))
    : catalog;
  // Filtro por botões de categoria (e subcategoria da Demografia); a pesquisa respeita o filtro.
  const adm=document.body.dataset.admin==="on";
  const filtered=matches.filter(item=>(selectedCategory==="Todas"||item.area===selectedCategory)&&(!selectedSub||item.sub===selectedSub)).filter(item=>adm||!hiddenIndicators.has(item.rawName));
  const label=selectedCategory==="Todas"?"todas as categorias":(selectedSub?`${selectedCategory} · ${selectedSub}`:selectedCategory);
  if(caption)caption.textContent=normalized?`Resultados da pesquisa · ${label} · ${filtered.length}`:`Indicadores · ${label} · ${filtered.length}`;
  body.innerHTML=filtered.map(item=>`<tr class="catalog-row ${item.key===selectedIndicatorKey?'active':''}${hiddenIndicators.has(item.rawName)?' is-hidden':''}" tabindex="0" role="button" data-indicator-key="${item.key}" aria-label="Ver ${item.name}"><td>${adm?`<label class="admin-vis" title="Mostrar aos utilizadores"><input type="checkbox" data-vis-key="${item.key}" ${hiddenIndicators.has(item.rawName)?'':'checked'}></label>`:''}${item.name}</td><td>${item.area}</td><td>${item.year}</td><td>${item.source}</td></tr>`).join(""); empty.hidden=filtered.length>0;
  document.querySelectorAll(".catalog-row").forEach(row=>{const choose=scrollToDetail=>selectCatalogIndicator(row.dataset.indicatorKey,scrollToDetail);row.addEventListener("click",e=>{if(e.target.closest(".admin-vis"))return;choose(false);});row.addEventListener("dblclick",e=>{if(e.target.closest(".admin-vis"))return;choose(true);});row.addEventListener("keydown",event=>{if(event.target.closest(".admin-vis"))return;if(event.key==="Enter"||event.key===" "){event.preventDefault();choose(false);}});});
}

// Botões de categoria (e subcategoria da Demografia) por cima da tabela de indicadores.
function renderCategoryButtons(){
  const bar=document.querySelector("#category-filter"),subBar=document.querySelector("#subcategory-filter");if(!bar)return;
  const btn=(text,active,attr)=>`<button type="button" class="cat-btn${active?" active":""}" ${attr} aria-pressed="${active}">${text}</button>`;
  bar.innerHTML=["Todas",...categoryList].map(c=>btn(c,c===selectedCategory,`data-category="${c}"`)).join("");
  if(subBar){subBar.hidden=selectedCategory!=="Demografia";subBar.innerHTML=["Todas",...demografiaSubs].map(s=>btn(s,(s==="Todas"?"":s)===selectedSub,`data-sub="${s}"`)).join("");}
}
function setCategory(name,sub=""){selectedCategory=name;selectedSub=sub;renderCategoryButtons();renderCatalog(document.querySelector("#indicator-search")?.value||"");}
document.querySelector("#category-filter")?.addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(b)setCategory(b.dataset.category);});
document.querySelector("#subcategory-filter")?.addEventListener("click",e=>{const b=e.target.closest("[data-sub]");if(b)setCategory("Demografia",b.dataset.sub==="Todas"?"":b.dataset.sub);});

// Painel "Indicador selecionado": nome, descrição, valor no território ativo, área, ano, leitura e fonte.
function renderCatalogDetail(){
  if(!document.querySelector("#indicator-detail"))return;
  const item=catalog.find(entry=>entry.key===selectedIndicatorKey)||catalog[0]; document.querySelector("#detail-name").textContent=item.name; document.querySelector("#detail-description").textContent=item.description; document.querySelector("#detail-territory").textContent=selectedTerritory; document.querySelector("#detail-value").textContent=formattedValue(item,item.values[selectedTerritory]); document.querySelector("#detail-area").textContent=item.area; document.querySelector("#detail-year").textContent=item.year; document.querySelector("#detail-dimension").textContent=item.dimension; document.querySelector("#detail-source").textContent=item.source; document.querySelector("#detail-source-link").href=item.sourceUrl; document.querySelector("#indicator-compare-button").disabled=false;
  // Detalhe por categoria (ex.: Nacionalidade → nº de pessoas por país, no território escolhido).
  const box=document.querySelector("#detail-breakdown");
  if(box){
    const rows=(item.breakdown||[]).map(part=>({name:part.name,year:part.year,value:part.values?.[selectedTerritory]})).filter(r=>r.value!=null);
    const kind=item.breakdownLabel||"nacionalidade";
    box.hidden=!rows.length;
    // O total só se esconde quando as categorias não estão todas no ano mais recente (ex.: nacionalidades),
    // ou quando o indicador tem `breakdownHideTotal` (causas de morte, ganho por sexo).
    const valueBox=document.querySelector(".detail-value"); if(valueBox)valueBox.hidden=!!item.breakdownHideTotal||rows.some(r=>String(r.year)!==String(item.year));
    box.innerHTML=rows.length?`<p class="overline">Por ${kind} · ${selectedTerritory}</p><table><thead><tr><th>${kind[0].toUpperCase()+kind.slice(1)}</th><th>${item.breakdownColumn||"Pessoas"}</th><th>Ano</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.name}</td><td>${format(r.value)}${item.suffix||""}</td><td>${r.year}</td></tr>`).join("")}</tbody></table>`:"";
  }
}
// Escolhe um indicador: guarda-o, atualiza o painel de detalhe e a linha destacada na tabela.
function selectCatalogIndicator(key,scrollToDetail=false){
  if(!catalog.some(item=>item.key===key))return;
  selectedIndicatorKey=key;
  localStorage.setItem("observatorio-indicator",key);
  renderCatalogDetail();
  document.querySelectorAll(".catalog-row").forEach(row=>row.classList.toggle("active",row.dataset.indicatorKey===key));
  if(scrollToDetail)document.querySelector("#indicator-detail")?.scrollIntoView({behavior:"smooth",block:"start"});
}
// Redesenha tudo o que depende do território (KPIs, cartões, comparação e detalhe).
function render(){const data=dataFor(selectedTerritory);renderKpis(data);renderTheme(data);renderComparison();renderYearComparison();renderCatalogDetail();}

// ===== 6. EVENTOS =====
if(select)select.addEventListener("change",e=>setTerritory(e.target.value));
// Muda de separador: marca-o como ativo e atualiza os cartões e a tabela (usada no clique e na ferramenta show_theme).
function setTheme(name){
  selectedTheme=name;
  document.querySelectorAll(".theme").forEach(b=>{const active=b.dataset.theme===name;b.classList.toggle("active",active);b.setAttribute("aria-selected",String(active));});
  renderTheme(dataFor(selectedTerritory));
  renderCatalog(searchInput?.value||"");
}
document.querySelectorAll(".theme").forEach(button=>button.addEventListener("click",()=>setTheme(button.dataset.theme)));
// Página Comparar: ao mudar o indicador, guarda a escolha e redesenha o gráfico.
if(compareSelect)compareSelect.addEventListener("change",()=>{selectedIndicatorKey=compareSelect.value;localStorage.setItem("observatorio-indicator",selectedIndicatorKey);renderComparison();renderYearComparison();});
if(compareSelect2)compareSelect2.addEventListener("change",()=>{localStorage.setItem("observatorio-indicator-2",compareSelect2.value);renderComparison();});
// Caixa de pesquisa: refiltra a tabela a cada letra escrita.
const searchInput=document.querySelector("#indicator-search");if(searchInput)searchInput.addEventListener("input",e=>renderCatalog(e.target.value));
// Botão "Comparar municípios": guarda o indicador e abre a página Comparar.
const compareButton=document.querySelector("#indicator-compare-button");if(compareButton)compareButton.addEventListener("click",()=>{localStorage.setItem("observatorio-indicator",selectedIndicatorKey);window.location.href="./comparar.html";});

// Regista ferramentas (select_territory e show_theme) para assistentes/agentes de IA controlarem a página.
// É opcional: só corre se o browser suportar document.modelContext.
if(document.modelContext?.registerTool){
  Promise.resolve(document.modelContext.registerTool({name:"select_territory",title:"Selecionar território",description:"Seleciona um município ou o Alto Minho e atualiza os indicadores visíveis.",inputSchema:{type:"object",properties:{territory:{type:"string",enum:territoryNames}},required:["territory"],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!territoryNames.includes(input?.territory))throw new Error("Território inválido");setTerritory(input.territory);return{territory:selectedTerritory};}})).catch(()=>{});
  Promise.resolve(document.modelContext.registerTool({name:"show_theme",title:"Mostrar área temática",description:"Mostra os indicadores da área temática escolhida.",inputSchema:{type:"object",properties:{theme:{type:"string",enum:Object.keys(themes)}},required:["theme"],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!themes[input?.theme])throw new Error("Área inválida");setTheme(input.theme);return{theme:selectedTheme,territory:selectedTerritory};}})).catch(()=>{});
}

// ===== 7. ARRANQUE =====
// Desenha a tabela e depois o território inicial (o que dispara render() e preenche o resto).
renderCategoryButtons(); renderCatalog(); setTerritory(selectedTerritory);

// Rodapé: js/shared/footer.js · Admin e indicadores visíveis: js/shared/admin.js