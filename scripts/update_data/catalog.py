"""Catálogo (catalog-data.js) e gravação final dos ficheiros gerados."""
from __future__ import annotations

import hashlib
import re

from .config import (ALIAS_NAME, ALIAS_SOURCE, CATALOG_COMMENT, CATALOG_PATH, CATALOG_VAR, INE_DIRECT,
                     PORDATA_FIXED_ENTRIES, ROOT, VALUES_COMMENT, VALUES_PATH, VALUES_VAR)
from .io import read_javascript_object, read_pordata_sources, write_javascript_object


def ensure_catalog_entries(values_by_name: dict) -> int:
    """Acrescenta ao catalog-data.js os indicadores novos de PORDATA_FIXED_ENTRIES que ainda não existem
    (só depois de os valores terem passado a validação, para o site nunca mostrar indicadores sem dados).
    Devolve quantos foram acrescentados."""
    catalog = read_javascript_object(CATALOG_PATH, CATALOG_VAR)
    existing = {item["name"] for item in catalog}
    sources = read_pordata_sources()
    added = 0
    for name, entry in PORDATA_FIXED_ENTRIES.items():
        if "catalog" not in entry or name in existing or name not in values_by_name:
            continue
        domain, theme, category = entry["catalog"]
        catalog.append({"name": name, "domain": domain, "theme": theme, "category": category,
                        "source": "Pordata", "url": sources[name], "year": values_by_name[name]["year"]})
        added += 1
    if added:
        write_javascript_object(CATALOG_PATH, CATALOG_COMMENT, CATALOG_VAR, catalog)
    return added


def update_catalog_links() -> None:
    """Atualiza no catalog-data.js o endereço de origem de cada indicador: página da Pordata
    (de pordata-sources.json) ou página do indicador no INE."""
    catalog = read_javascript_object(CATALOG_PATH, CATALOG_VAR)
    sources = read_pordata_sources()
    for item in catalog:
        if item["name"] in sources:
            item["url"] = sources[item["name"]]
        if item["name"] in INE_DIRECT:
            code = INE_DIRECT[item["name"]]["code"]
            item["url"] = f"https://www.ine.pt/xportal/xmain?xpid=INE&xpgid=ine_indicadores&indOcorrCod={code}&contexto=bd&selTab=tab2"
        if item["name"] == ALIAS_NAME:
            item["source"] = "Pordata"
            item["url"] = sources[ALIAS_SOURCE]
    write_javascript_object(CATALOG_PATH, CATALOG_COMMENT, CATALOG_VAR, catalog)


BOOT_PATH = ROOT / "FrontEnd" / "js" / "shared" / "boot.js"


def update_data_version() -> None:
    """Escreve no boot.js a versão (hash) dos ficheiros de dados, para o browser ir buscar sempre os dados novos.
    Se os dados não mudaram, a versão mantém-se igual e a cache continua válida."""
    digest = hashlib.sha1()
    for path in (VALUES_PATH, CATALOG_PATH):
        digest.update(path.read_bytes())
    version = digest.hexdigest()[:10]
    text = BOOT_PATH.read_text(encoding="utf-8")
    new_text = re.sub(r'const DATA_VERSION = "[^"]*";', f'const DATA_VERSION = "{version}";', text, count=1)
    if new_text != text:
        BOOT_PATH.write_text(new_text, encoding="utf-8", newline="")


def write_outputs(values_by_name: dict) -> None:
    """Grava indicator-values.js e catalog-data.js (remove valores de indicadores que já não estão no catálogo)."""
    ensure_catalog_entries(values_by_name)
    catalog_names = {item["name"] for item in read_javascript_object(CATALOG_PATH, CATALOG_VAR)}
    for stale in [key for key in values_by_name if key not in catalog_names]:
        del values_by_name[stale]
    write_javascript_object(VALUES_PATH, VALUES_COMMENT, VALUES_VAR, values_by_name)
    update_catalog_links()
    update_data_version()