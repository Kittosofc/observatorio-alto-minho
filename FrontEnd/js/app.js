/*
 * Observatório Alto Minho — núcleo partilhado da aplicação.
 * Responsabilidades: catálogo de indicadores, território selecionado,
 * renderização comum e eventos reutilizados pelas páginas.
 * Funcionalidades exclusivas de cada página vivem em FrontEnd/js/.
 */

// ===== 1. DADOS DE BASE =====
const territoryNames = [
  "Alto Minho",
  "Arcos de Valdevez",
  "Caminha",
  "Melgaço",
  "Monção",
  "Paredes de Coura",
  "Ponte da Barca",
  "Ponte de Lima",
  "Valença",
  "Viana do Castelo",
  "Vila Nova de Cerveira"
];

const mapLabels = {
  "Vila Nova de Cerveira": ["V. N.", "Cerveira"],
  "Paredes de Coura": ["Paredes", "de Coura"],
  "Arcos de Valdevez": ["Arcos de", "Valdevez"],
  "Ponte da Barca": ["Ponte da", "Barca"],
  "Ponte de Lima": ["Ponte", "de Lima"],
  "Viana do Castelo": ["Viana do", "Castelo"]
};

// Correções dos nomes e descrições dos indicadores.
const catalogOverrides = {
  "População residente: total 2015 a 2025": {
    name: "População residente",
    description: "Número de pessoas com residência habitual no território."
  },
  "Índice de envelhecimento": {
    description: "Relação entre a população idosa e a população jovem, por cada 100 jovens."
  },
  "Saldo Migratório": {
    name: "Saldo migratório",
    description: "Diferença anual entre o número de entradas e saídas por migração no território."
  },
  "Índice de dependência idosos": {
    name: "Índice de dependência de idosos"
  },
  "Índice de Longividade": {
    name: "Índice de longevidade"
  },
  "Nº de índividuos em idade ativa por idoso": {
    name: "Pessoas em idade ativa por pessoa idosa"
  },
  "Preço médio m²": {
    name: "Preço médio por m²",
    description: "Valor mediano de venda por metro quadrado no mercado habitacional."
  },
  "Rendimento médio": {
    description: "Ganho médio mensal dos trabalhadores por conta de outrem."
  },
  "Pop. Estrangeira c/ estatuto residente": {
    name: "População estrangeira residente"
  },
  "% famílias monoparentais": {
    name: "Núcleos familiares monoparentais",
    description: "Número de núcleos familiares monoparentais registados nos Censos 2021."
  },
  "Proporção de pop. residente em movimentos pendulares": {
    name: "Movimentos pendulares"
  },
  "Obitos por algumas causas de morte (%)": {
    name: "Óbitos por algumas causas de morte (%)"
  },
  "Obitos por residentes total e por grupo etário": {
    name: "Óbitos de residentes"
  }
};

// ===== 2. ORGANIZAÇÃO TEMÁTICA =====
const areaByDomain = {
  "Demografia": "Demografia",
  "Habitação": "Habitação",
  "Saúde": "Saúde",
  "Proteção Social": "Coesão social",
  "Mobilidade": "Emprego"
};

const emprego = [
  "Desempregados inscritos nos centros de emprego e de formação profissional no total da população residente com 15 a 64 anos (%)",
  "Diferença entre o salário mínimo nacional e a remuneração base média mensal dos trabalhadores por conta de outrem",
  "Desempregados inscritos nos centros de emprego e de formação profissional (média anual): total e por grupo etário",
  "Desempregados inscritos nos centros de emprego e de formação profissional",
  "Rendimento médio",
  "Diferença salarial H/M (%)"
];

const educacao = [
  "Taxa de retenção e desistência no ensino básico: total e por ano de escolaridade",
  "Taxa de retenção e desistência no ensino secundário: total, por modalidade de ensino e ano de escolaridade",
  "Estabelecimentos nos ensinos pré-escolar, básico e secundário: por nível de ensino",
  "Taxa de analfabetismo"
];

const areaByName = {
  ...Object.fromEntries(emprego.map(n => [n, "Emprego"])),
  ...Object.fromEntries(educacao.map(n => [n, "Educação"]))
};

const tabOf = item =>
  areaByName[item.name] || areaByDomain[item.domain] || "Outros";

// ===== 3. CATÁLOGO DE INDICADORES =====
const catalog = indicatorCatalog.map((item, index) => {
  const dataset = indicatorValuesByName[item.name];
  const context = [item.theme, item.category].filter(Boolean).join(" · ");

  const base = {
    key: `catalog-${index + 1}`,
    rawName: item.name,
    name: item.name,
    tab: tabOf(item),
    area: tabOf(item) === "Outros" ? item.domain : tabOf(item),
    source: item.source,
    sourceUrl: item.url,
    description: context
      ? `${context}. Indicador integrado na matriz intermunicipal.`
      : "Indicador integrado na matriz intermunicipal.",
    ...dataset
  };

  return {
    ...base,
    ...(catalogOverrides[item.name] || {})
  };
});

// Nomes curtos para os indicadores usados nos cartões e nos KPIs.
const legacyNames = {
  population: "População residente: total 2015 a 2025",
  ageing: "Índice de envelhecimento",
  housing: "Preço médio m²",
  migration: "Saldo Migratório",
  unemployment: "Desempregados inscritos nos centros de emprego e de formação profissional no total da população residente com 15 a 64 anos (%)",
  income: "Rendimento médio",
  illiteracy: "Taxa de analfabetismo",
  doctors: "Profissionais de saúde: médicos, dentistas, enfermeiros e farmacêuticos",
  rsi: "Beneficiários do Rendimento Mínimo Garantido e Rendimento Social de Inserção da Segurança Social: total e por sexo",
  foreign: "População estrangeira com estatuto legal de residente: total e por algumas nacionalidades",
  youth: "Índice de dependência de jovens",
  elderly: "Índice de dependência idosos",
  commuting: "Proporção de pop. residente em movimentos pendulares"
};

const byRawName = name => catalog.find(item => item.rawName === name);

const metric = (legacyKey, territory) =>
  byRawName(legacyNames[legacyKey])?.values?.[territory];

const dataFor = territory =>
  Object.fromEntries(
    Object.keys(legacyNames).map(key => [key, metric(key, territory)])
  );

const card = (value, label, rawName) => [value, label, rawName];

// ===== 4. ESTADO DA APLICAÇÃO =====
let selectedTerritory =
  localStorage.getItem("observatorio-territory") || "Alto Minho";

if (!territoryNames.includes(selectedTerritory)) {
  selectedTerritory = "Alto Minho";
}

let selectedTheme = "Demografia";

let selectedIndicatorKey =
  localStorage.getItem("observatorio-indicator") || catalog[0]?.key;

let select = document.querySelector("#territory-select");

const slug = name =>
  name.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Abre diretamente a página do município selecionado.
function openMunicipality(name) {
  if (name === "Alto Minho") return;

  window.location.href =
    `./FrontEnd/html/municipio.html?m=${slug(name)}`;
}

// ===== 5. MAPA E INTERAÇÃO COM MUNICÍPIOS =====
// Adiciona os eventos aos elementos do mapa.
document.querySelectorAll("[data-territory].municipality-node").forEach(node => {
  const name = node.dataset.territory;

  node.setAttribute("tabindex", "0");
  node.setAttribute("role", "button");
  node.setAttribute("aria-label", `Abrir página de ${name}`);

  // Clique do rato: abre a página do município.
  node.addEventListener("click", () => openMunicipality(name));

  // Teclado: Enter ou Espaço abre a mesma página.
  node.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMunicipality(name);
    }
  });
});

// ===== 6. SELEÇÃO DE TERRITÓRIO =====
function setTerritory(name) {
  if (!territoryNames.includes(name)) return;

  selectedTerritory = name;

  localStorage.setItem("observatorio-territory", name);

  if (select) {
    select.value = name;
  }

  const title = document.querySelector("#territory-title");

  if (title) {
    title.textContent = name;
  }

  document.querySelectorAll(".municipality-node").forEach(node => {
    node.classList.toggle("active", node.dataset.territory === name);
  });

  render();
}

// ===== 7. RENDERIZAÇÃO =====
// Mantém esta função ligada às funções de renderização existentes no teu projeto.
function render() {
  const data = dataFor(selectedTerritory);

  if (typeof renderKpis === "function") renderKpis(data);
  if (typeof renderTheme === "function") renderTheme(data);
  if (typeof renderComparison === "function") renderComparison();
  if (typeof renderYearComparison === "function") renderYearComparison();
  if (typeof renderCatalogDetail === "function") renderCatalogDetail();
}

// ===== 8. EVENTOS =====
if (select) {
  select.addEventListener("change", event => {
    setTerritory(event.target.value);
  });
}

// Arranque da aplicação.
if (typeof renderCatalog === "function") {
  renderCatalog();
}

setTerritory(selectedTerritory);