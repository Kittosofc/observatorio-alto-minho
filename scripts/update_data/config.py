"""Constantes e configuração. Para adicionar indicadores, editar data/update-config.json (não o código)."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VALUES_PATH = ROOT / "FrontEnd" / "js" / "data" / "indicator-values.js"
CATALOG_PATH = ROOT / "FrontEnd" / "js" / "data" / "catalog-data.js"
PORDATA_SOURCES_PATH = ROOT / "data" / "pordata-sources.json"
PORDATA_DIRECTORY = ROOT / ".cache" / "pordata"
REPORT_PATH = ROOT / "data" / "update-report.json"
CONFIG_PATH = ROOT / "data" / "update-config.json"

HISTORY_YEARS = 1000  # nº máximo de anos guardados por indicador (1000 = todos os anos disponíveis)

# Nomes das variáveis JS e comentários dos ficheiros gerados.
VALUES_VAR = "indicatorValuesByName"
CATALOG_VAR = "indicatorCatalog"
VALUES_COMMENT = "Valores atualizados automaticamente a partir do INE e da Pordata."
CATALOG_COMMENT = "Catálogo da matriz intermunicipal e ligações permanentes das fontes."

# Indicador que é cópia de outro (o alias recebe os valores da fonte).
ALIAS_NAME = "Pop. Estrangeira c/ estatuto residente"
ALIAS_SOURCE = "População estrangeira com estatuto legal de residente: total e por algumas nacionalidades"

# Limites da escolha de colunas da Pordata.
MAX_COLUMNS_COMBINED = 4
MAX_COMBINATIONS = 2000
MAX_MATCH_ERROR = 0.80

# Rede.
INE_URL = "https://www.ine.pt/ine/json_indicador/pindica.jsp?op=2&varcd={code}{extra}&lang=PT"
INE_GATEWAY_URL = "https://gateway.pipeworx.io/ine-pt/mcp"
INE_RETRY_WAITS = (30, 60, 120)  # esperas (s) ao repetir os indicadores INE que falharam

_config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
TERRITORIES = _config["territories"]
INE_DIRECT = _config["ine"]  # nome do indicador -> código INE, filtros e (opcional) query extra
PORDATA_FIXED_POSITIONS = {name: tuple(e["positions"]) for name, e in _config["pordataFixed"].items()}  # colunas a usar em cada ano
PORDATA_FIXED_ENTRIES = {name: {k: v for k, v in e.items() if k != "positions"} for name, e in _config["pordataFixed"].items()}  # unidade, dimensão, catálogo
BREAKDOWNS = tuple((b["name"], b["file"], b["label"], b.get("renames", {})) for b in _config["breakdowns"])
BREAKDOWNS_WITHOUT_TOTAL = set(_config["breakdownsWithoutTotal"])  # indicadores sem valor "total" no detalhe