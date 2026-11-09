"""Leitura e escrita de ficheiros (JS gerado, JSON de fontes e relatório)."""
from __future__ import annotations

import json
import re
from pathlib import Path

from .config import PORDATA_SOURCES_PATH, REPORT_PATH


def read_pordata_sources() -> dict:
    """Lê data/pordata-sources.json: {nome do indicador: endereço Pordata}."""
    return json.loads(PORDATA_SOURCES_PATH.read_text(encoding="utf-8"))


def read_javascript_object(path: Path, variable: str) -> dict:
    """Lê um ficheiro .js do tipo `const variavel = {...};` e devolve o objeto como dicionário Python.
    Dá erro se a variável não existir, para não trabalhar sobre um ficheiro inesperado."""
    source = path.read_text(encoding="utf-8")
    match = re.search(rf"const\s+{re.escape(variable)}\s*=\s*(.*);\s*$", source, re.DOTALL)
    if not match:
        raise RuntimeError(f"Não foi possível ler {variable} em {path.name}")
    return json.loads(match.group(1))


def write_javascript_object(path: Path, comment: str, variable: str, value: dict) -> None:
    """Escreve o dicionário de volta num .js (`// comentário` + `const variavel = {...};`) em UTF-8,
    indentado em várias linhas e sem escapar acentos."""
    payload = json.dumps(value, ensure_ascii=False, indent=2)
    path.write_bytes(f"// {comment}\nconst {variable} = {payload};\n".encode("utf-8"))


def write_report(report: list[dict]) -> None:
    """Grava o relatório da atualização (data/update-report.json)."""
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")