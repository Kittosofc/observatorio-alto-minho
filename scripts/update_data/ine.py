"""Indicadores do INE."""
from __future__ import annotations

import time

from .config import INE_DIRECT, INE_RETRY_WAITS, INE_URL, TERRITORIES
from .net import fetch_json
from .values import INE_TERRITORIES, NORMALIZED_TERRITORIES, as_number, merge_history, normalized, validate_values
import re


def rows_for_latest_complete_year(item: dict, filters: dict[str, str]) -> tuple[str, list[dict]]:
    """Procura, nos dados do INE, o ano mais recente em que existem valores para os 11 territórios,
    depois de aplicar os filtros das dimensões (ex.: {"dim_3": "T"}). Ignora períodos que não sejam um ano de 4 dígitos.
    Devolve (ano, linhas) ou lança ValueError se nenhum ano estiver completo."""
    years = sorted((str(year) for year in item.get("Dados", {}) if re.fullmatch(r"\d{4}", str(year))), reverse=True)
    for year in years:
        rows = [
            row for row in item["Dados"][year]
            if normalized(row.get("geodsg")) in NORMALIZED_TERRITORIES
            and all(str(row.get(key)) == expected for key, expected in filters.items())
            and as_number(row.get("valor")) is not None
        ]
        if len({normalized(row["geodsg"]) for row in rows}) == len(TERRITORIES):
            return year, rows
    raise ValueError("O INE não devolveu um ano completo para os 11 territórios")


def ine_series(item: dict, filters: dict[str, str]) -> dict[str, dict]:
    """Devolve {ano: {território: valor}} para TODOS os anos em que os 11 territórios estão completos."""
    series: dict[str, dict] = {}
    for year, rows in item.get("Dados", {}).items():
        year = str(year)
        if not re.fullmatch(r"\d{4}", year):  # ignora semestres, trimestres, etc.
            continue
        values = {}
        for row in rows:
            territory = INE_TERRITORIES.get(normalized(row.get("geodsg")))
            if territory is None or not all(str(row.get(key)) == expected for key, expected in filters.items()):
                continue
            number = as_number(row.get("valor"))
            if number is not None:
                values[territory] = number
        if len(values) == len(TERRITORIES):
            series[year] = values
    return dict(sorted(series.items()))


def update_ine(values_by_name: dict, report: list[dict]) -> int:
    """Atualiza os indicadores do INE (os de INE_DIRECT) em `values_by_name`.
    Para cada um: grava o ano completo mais recente e o histórico dos anos anteriores. Se o INE só tiver um ano
    mais antigo do que o já guardado, mantém o valor atual. Regista o resultado em `report` e devolve quantos indicadores foram validados."""
    updated = 0
    cache: dict[str, dict | None] = {}
    codes = list(dict.fromkeys(config["code"] for config in INE_DIRECT.values()))

    extra_query = {config["code"]: config.get("query", "") for config in INE_DIRECT.values()}

    def fetch_code(code: str) -> None:
        try:
            payload = fetch_json(f"https://www.ine.pt/ine/json_indicador/pindica.jsp?op=2&varcd={code}{extra_query[code]}&lang=PT")
            if not isinstance(payload, list) or not payload or not payload[0].get("Sucesso", {}).get("Verdadeiro"):
                raise ValueError(f"INE {code}: resposta inválida")
            cache[code] = payload[0]
        except Exception as error:  # fonte instável: tenta de novo no fim
            cache[code] = None
            print(f"AVISO: INE {code} falhou ({str(error)[:150]})")

    for code in codes:
        fetch_code(code)
    for wait_seconds in (30, 60, 120):
        pending = [code for code in codes if cache[code] is None]
        if not pending:
            break
        print(f"A repetir {len(pending)} indicadores INE em falta dentro de {wait_seconds} segundos: {', '.join(pending)}")
        time.sleep(wait_seconds)
        for code in pending:
            fetch_code(code)

    for name, config in INE_DIRECT.items():
        code = config["code"]
        if cache[code] is None:
            report.append({"indicator": name, "source": "INE", "status": "kept", "reason": "source unavailable"})
            continue
        year, rows = rows_for_latest_complete_year(cache[code], config["filters"])
        current_year = int(values_by_name[name]["year"])
        if int(year) < current_year:
            report.append({"indicator": name, "source": "INE", "status": "kept", "reason": "source year is older"})
            continue
        new_values = {NORMALIZED_TERRITORIES[normalized(row["geodsg"])]: as_number(row["valor"]) for row in rows}
        validate_values(new_values, name)
        changed = values_by_name[name]["values"] != new_values or values_by_name[name]["year"] != year
        values_by_name[name]["values"] = new_values
        values_by_name[name]["year"] = year
        history = ine_series(cache[code], config["filters"])
        history[year] = new_values
        years_stored = merge_history(values_by_name[name], history)
        updated += 1
        report.append({"indicator": name, "source": "INE", "status": "updated" if changed else "checked", "year": year, "years_in_history": years_stored})
    return updated


def check_ine() -> None:
    """Confirma que o INE responde com o indicador esperado."""
    code = INE_DIRECT["Superfície Km2"]["code"]
    payload = fetch_json(f"https://www.ine.pt/ine/json_indicador/pindica.jsp?op=2&varcd={code}&lang=PT")
    if not isinstance(payload, list) or not payload or payload[0].get("IndicadorCod") != code:
        raise RuntimeError("A ligação ao INE devolveu uma resposta inválida")
    print("Ligação ao INE e proveniência oficial validadas.")