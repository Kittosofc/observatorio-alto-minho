"""Orquestração: obter -> relatório -> validar -> gravar."""
from __future__ import annotations

import sys

from .catalog import write_outputs
from .config import INE_DIRECT, VALUES_PATH, VALUES_VAR
from .ine import check_ine, update_ine
from .io import read_javascript_object, read_pordata_sources, write_report
from .pordata import update_breakdowns, update_pordata


def fetch_all(values_by_name: dict) -> tuple[list[dict], int, int]:
    """Obtém os dados da Pordata e do INE. Devolve (relatório, nº Pordata validados, nº INE validados)."""
    report: list[dict] = []
    pordata_count = update_pordata(values_by_name, report)
    update_breakdowns(values_by_name, report)
    ine_count = update_ine(values_by_name, report)
    return report, pordata_count, ine_count


def validate(report: list[dict], pordata_count: int, ine_count: int) -> None:
    """Falha se faltarem indicadores Pordata ou se o INE não responder; assim os ficheiros publicados ficam como estavam."""
    expected_pordata = len(read_pordata_sources())
    if pordata_count != expected_pordata:
        failures = [entry for entry in report if entry["source"] == "Pordata" and entry["status"] == "kept"]
        raise RuntimeError(f"Só {pordata_count} de {expected_pordata} indicadores Pordata passaram a validação. Falhas: {failures}")
    if ine_count == 0:
        raise RuntimeError("Nenhum indicador INE foi obtido; a fonte está indisponível")
    if ine_count != len(INE_DIRECT):
        print(f"AVISO: {len(INE_DIRECT) - ine_count} indicadores INE mantidos por falha da fonte.")


def main() -> None:
    """Atualização completa: obter -> relatório -> validar -> gravar. Com `--check-ine` só testa a ligação ao INE."""
    if "--check-ine" in sys.argv:
        check_ine()
        return
    values_by_name = read_javascript_object(VALUES_PATH, VALUES_VAR)
    report, pordata_count, ine_count = fetch_all(values_by_name)
    write_report(report)  # o relatório grava-se sempre, mesmo que a validação falhe
    validate(report, pordata_count, ine_count)
    write_outputs(values_by_name)
    print(f"Atualização concluída: {pordata_count} indicadores Pordata e {ine_count} indicadores INE verificados.")