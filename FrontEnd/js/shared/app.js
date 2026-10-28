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

// Correções manuais por indicador (chave = nome original no catálogo): permite mudar o nome
// mostrado ou a descrição sem mexer nos ficheiros gerados (catalog-data.js / indicator-values.js).
const catalogOverrides = {
  "População residente: total 2015 a 2025": { name:"População residente", description:"Número de pessoas com residência habitual no território." },
  "Índice de envelhecimento": { description:"Relação entre a população idosa e a população jovem, por cada 100 jovens." },
  "Saldo Migratório": { name:"Saldo migratório", description:"Diferença anual entre o número de entradas e saídas por migração no território." },
  "Índice de dependência idosos": { name:"Índice de dependência de idosos" },
  "Índice de Longividade": { name:"Índice de longevidade" },
  "Nº de índividuos em idade ativa por idoso": { name:"Pessoas em idade ativa por pessoa idosa" },
  "Preço médio m²": { name:"Preço médio por m²", description:"Valor mediano de venda por metro quadrado no mercado habitacional." },
  "Rendimento médio": { description:"Ganho médio mensal dos trabalhadores por conta de outrem." },
  "Pop. Estrangeira c/ estatuto residente": { name:"População estrangeira residente" },
  "% famílias monoparentais": { name:"Núcleos familiares monoparentais", description:"Número de núcleos familiares monoparentais registados nos Censos 2021." },
  "Proporção de pop. residente em movimentos pendulares": { name:"Movimentos pendulares" },
  "Obitos por algumas causas de morte (%)": { name:"Óbitos por algumas causas de morte (%)" },
  "Obitos por residentes total e por grupo etário": { name:"Óbitos de residentes" }
};

// ===== 2. ÁREAS (separadores) =====
// Cada indicador aparece no separador (tab) da sua área: primeiro as exceções por nome (emprego/educacao),
// depois o domínio do catálogo. Os que não encaixam em nenhum separador vão para "Outros" e mantêm o nome original.
const areaByDomain = {
  "Demografia":"Demografia", "Habitação":"Habitação", "Saúde":"Saúde",
  "Proteção Social":"Coesão social", "Mobilidade":"Emprego"
};
const emprego = ["Desempregados inscritos nos centros de emprego e de formação profissional no total da população residente com 15 a 64 anos (%)",
  "Diferença entre o salário mínimo nacional e a remuneração base média mensal dos trabalhadores por conta de outrem",
  "Desempregados inscritos nos centros de emprego e de formação profissional (média anual): total e por grupo etário",
  "Desempregados inscritos nos centros de emprego e de formação profissional", "Rendimento médio", "Diferença salarial H/M (%)",
  "Ganho médio mensal dos trabalhadores por conta de outrem: total e por sexo"];
const educacao = ["Taxa de retenção e desistência no ensino básico: total e por ano de escolaridade",
  "Taxa de retenção e desistência no ensino secundário: total, por modalidade de ensino e ano de escolaridade",
  "Estabelecimentos nos ensinos pré-escolar, básico e secundário: por nível de ensino"];
const areaByName = { ...Object.fromEntries(emprego.map(n => [n, "Emprego"])), ...Object.fromEntries(educacao.map(n => [n, "Educação"])) };
// Separador onde o indicador aparece ("Outros" se não encaixar em nenhum).
const tabOf = item => areaByName[item.name] || areaByDomain[item.domain] || "Outros";

// ===== 3. CATÁLOGO FINAL =====
// Junta, para cada indicador: dados do catálogo (catalog-data.js) + valores por território
// (indicator-values.js, ligados pelo nome) + área + correções de catalogOverrides.
// Cada item fica com: key, rawName, name, area, source, sourceUrl, description, year, values, unit...
const catalog = indicatorCatalog.map((item, index) => {
  const dataset = indicatorValuesByName[item.name];
  const context = [item.theme, item.category].filter(Boolean).join(" · ");
  const base = { key:`catalog-${index + 1}`, rawName:item.name, name:item.name, tab:tabOf(item), area:tabOf(item) === "Outros" ? item.domain : tabOf(item), source:item.source,
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
const select = document.querySelector("#territory-select"), compareSelect = document.querySelector("#compare-indicator"), mapNodes = document.querySelector("#map-nodes");
const savedTerritory = localStorage.getItem("observatorio-territory");
const savedIndicatorKey = localStorage.getItem("observatorio-indicator");
let selectedTerritory = territoryNames.includes(savedTerritory) ? savedTerritory : "Alto Minho";
let selectedTheme = "Demografia";
let selectedIndicatorKey = catalog.some(item => item.key === savedIndicatorKey) ? savedIndicatorKey : byRawName(legacyNames.population).key;
// Formata números à portuguesa (casas decimais e separadores); sem valor mostra "—".
const format = value => value == null || value === "—" ? "—" : typeof value === "string" ? value : new Intl.NumberFormat("pt-PT", { maximumFractionDigits:2 }).format(value);
// Valor pronto a mostrar: prefixo + número formatado + sufixo (ex.: "245,3", "108,47 km²").
const formattedValue = (item, value) => `${item.prefix || ""}${format(value)}${item.suffix || ""}`;

// Preenche o <select> de territórios (só existe em algumas páginas, por isso o if).
if(select) territoryNames.forEach(name => { const option=document.createElement("option"); option.value=name; option.textContent=name; select.appendChild(option); });
// Preenche o <select> de indicadores da página Comparar com os 50 indicadores.
if(compareSelect){catalog.forEach(item => { const option=document.createElement("option"); option.value=item.key; option.textContent=item.name; compareSelect.appendChild(option); });compareSelect.value=selectedIndicatorKey;}
// Desenha o mapa: um <path> SVG por município, com nome, clique e teclado (Enter/Espaço) para o selecionar.
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

// Muda o território ativo: guarda a escolha, atualiza o título, o select e o mapa, e volta a desenhar tudo.
function setTerritory(name){ selectedTerritory=name; localStorage.setItem("observatorio-territory",name); if(select)select.value=name; const title=document.querySelector("#territory-title");if(title)title.textContent=name; document.querySelectorAll(".municipality-node").forEach(n=>n.classList.toggle("active",n.dataset.territory===name)); render(); }

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
  const rows=territoryNames.slice(1).map(name=>[name,item.values[name]]).sort((a,b)=>(b[1]??-Infinity)-(a[1]??-Infinity));
  const max=Math.max(...rows.map(([,value])=>Math.abs(value??0)),1); chart.setAttribute("aria-label",`${item.name}, ${item.year}, ${item.dimension}`);
  chart.innerHTML=rows.map(([name,value])=>`<div class="bar-row ${name===selectedTerritory?'selected':''}"><div class="bar-label" title="${name}">${name}</div><div class="bar-track"><div class="bar-fill${value<0?' negative':''}" style="--bar:${value==null?0:Math.max(2,Math.abs(value)/max*100)}%"></div></div><div class="bar-value">${formattedValue(item,value)}</div></div>`).join("");
}

// Página Comparar: gráfico de barras agrupadas que compara os anos de um indicador (do mais antigo ao mais recente),
// com um grupo por município. Só aparece nos indicadores com pelo menos 2 anos de dados.
// O município escolhido no menu lateral fica destacado.
const yearColors=["#b7d3ee","#bfe0c7","#f6dd94","#ef9a93"]; // do ano mais antigo ao mais recente
// Passo "redondo" (1, 2, 5 × 10ⁿ) para as linhas de referência do eixo.
const niceStep=range=>{const raw=range/4,power=10**Math.floor(Math.log10(raw)),n=raw/power;return(n<=1?1:n<=2?2:n<=5?5:10)*power;};

function renderYearComparison(){
  const chart=document.querySelector("#year-chart"); if(!compareSelect||!chart)return;
  const item=catalog.find(entry=>entry.key===compareSelect.value)||catalog[0];
  const municipalities=territoryNames.slice(1);

  // Junta o histórico ao ano mais recente; fica só com os anos que têm valores.
  const series={...item.history,[item.year]:item.values};
  const years=Object.keys(series).filter(year=>municipalities.some(name=>series[year]?.[name]!=null)).sort((a,b)=>Number(a)-Number(b));
  if(years.length<2){chart.innerHTML=`<p class="history-empty">Este indicador só tem dados de um ano${years[0]?` (${years[0]})`:""}, por isso não há comparação entre anos.</p>`;return;}

  // Cor de cada ano: o mais recente tem sempre a cor escura; os anteriores usam as cores claras, pela ordem.
  const colorOf=index=>index===years.length-1?yearColors[3]:yearColors[Math.min(index,2)];

  // Escalas do gráfico (o zero entra sempre, para as barras partirem da base).
  const W=760,H=360,left=64,right=20,top=20,bottom=56;
  const all=municipalities.flatMap(name=>years.map(year=>series[year]?.[name])).filter(value=>value!=null);
  const step=niceStep(Math.max(...all,0)-Math.min(...all,0)||1);
  const min=Math.floor(Math.min(...all,0)/step)*step, max=Math.ceil(Math.max(...all,0)/step)*step;
  const y=value=>top+(max-value)*(H-top-bottom)/(max-min);

  // Linhas horizontais de referência com o valor do eixo.
  const ticks=[];for(let value=min;value<=max+step/2;value+=step)ticks.push(value);
  const grid=ticks.map(value=>`<line class="grid" x1="${left}" x2="${W-right}" y1="${y(value)}" y2="${y(value)}"/><text class="axis" x="${left-8}" y="${y(value)+4}" text-anchor="end">${format(Number(value.toFixed(6)))}</text>`).join("");

  // Um grupo de barras por município (uma barra por ano) e o nome por baixo, em duas linhas se for comprido.
  const groupWidth=(W-left-right)/municipalities.length, barWidth=Math.min(26,groupWidth*0.8/years.length);
  const groups=municipalities.map((name,g)=>{
    const start=left+g*groupWidth+(groupWidth-barWidth*years.length)/2;
    const bars=years.map((year,i)=>{
      const value=series[year]?.[name]; if(value==null)return "";
      return `<rect x="${start+i*barWidth}" y="${Math.min(y(value),y(0))}" width="${barWidth-2}" height="${Math.abs(y(value)-y(0))}" fill="${colorOf(i)}"><title>${name}, ${year}: ${formattedValue(item,value)}</title></rect>`;}).join("");
    const label=(mapLabels[name]||[name]).map((line,i)=>`<tspan x="${left+(g+0.5)*groupWidth}" dy="${i?12:0}">${line}</tspan>`).join("");
    return `<g class="year-group ${name===selectedTerritory?"selected":""}">${bars}<text class="axis" x="${left+(g+0.5)*groupWidth}" y="${H-bottom+18}" text-anchor="middle">${label}</text></g>`;}).join("");

  // Legenda dos anos e nota com o território destacado (escolhido no menu lateral).
  const legend=years.map((year,i)=>`<span><i style="background:${colorOf(i)}"></i>${year}</span>`).join("");
  const note=municipalities.includes(selectedTerritory)
    ? `Destacado: <strong>${selectedTerritory}</strong> · passe o rato numa barra para ver o valor.`
    : `Escolha um município no menu lateral para o destacar · passe o rato numa barra para ver o valor.`;

  chart.setAttribute("aria-label",`Comparação de ${item.name}, ${years[0]} a ${years[years.length-1]}`);
  chart.innerHTML=`<div class="year-legend">${legend}</div><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Comparação de ${item.name} entre ${years.join(", ")}">${grid}<line class="zero" x1="${left}" x2="${W-right}" y1="${y(0)}" y2="${y(0)}"/>${groups}</svg><p class="history-note">${note}</p>`;
}

// Tabela de indicadores. Sem pesquisa mostra só os da área ativa; com pesquisa procura em todos.
// Clicar numa linha escolhe o indicador (o detalhe de cima atualiza); duplo clique faz scroll até ele.
function renderCatalog(query=""){
  const body=document.querySelector("#catalog-body"),empty=document.querySelector("#catalog-empty"),caption=document.querySelector("#catalog-caption");if(!body||!empty)return;
  // Com pesquisa, procura em todos os indicadores; sem pesquisa, mostra só os da área escolhida.
  const normalized=query.trim().toLocaleLowerCase("pt-PT");
  const matches=normalized
    ? catalog.filter(item=>`${item.name} ${item.area} ${item.year} ${item.source} ${item.dimension}`.toLocaleLowerCase("pt-PT").includes(normalized))
    : catalog.filter(item=>item.tab===selectedTheme);
  if(caption)caption.textContent=normalized?`Resultados da pesquisa · ${matches.length}`:`Indicadores de ${selectedTheme} · ${matches.length}`;
  body.innerHTML=matches.map(item=>`<tr class="catalog-row ${item.key===selectedIndicatorKey?'active':''}" tabindex="0" role="button" data-indicator-key="${item.key}" aria-label="Ver ${item.name}"><td>${item.name}</td><td>${item.area}</td><td>${item.year}</td><td>${item.source}</td></tr>`).join(""); empty.hidden=matches.length>0;
  document.querySelectorAll(".catalog-row").forEach(row=>{const choose=scrollToDetail=>selectCatalogIndicator(row.dataset.indicatorKey,scrollToDetail);row.addEventListener("click",()=>choose(false));row.addEventListener("dblclick",()=>choose(true));row.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();choose(false);}});});
}

// Painel "Indicador selecionado": nome, descrição, valor no território ativo, área, ano, leitura e fonte.
function renderCatalogDetail(){
  if(!document.querySelector("#indicator-detail"))return;
  const item=catalog.find(entry=>entry.key===selectedIndicatorKey)||catalog[0]; document.querySelector("#detail-name").textContent=item.name; document.querySelector("#detail-description").textContent=item.description; document.querySelector("#detail-territory").textContent=selectedTerritory; document.querySelector("#detail-value").textContent=formattedValue(item,item.values[selectedTerritory]); document.querySelector("#detail-area").textContent=item.area; document.querySelector("#detail-year").textContent=item.year; document.querySelector("#detail-dimension").textContent=item.dimension; document.querySelector("#detail-source").textContent=item.source; document.querySelector("#detail-source-link").href=item.sourceUrl; document.querySelector("#indicator-compare-button").disabled=false;
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
renderCatalog(); setTerritory(selectedTerritory);