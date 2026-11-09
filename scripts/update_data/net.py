"""Pedidos de rede com retentativas (curl, urllib e gateway do INE)."""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import time
import urllib.request
from typing import Callable

from .config import INE_GATEWAY_URL


def retry(action: Callable[[], object], attempts: int, error_message: str) -> object:
    """Executa `action` até `attempts` vezes, com espera crescente (1 s, 2 s, 4 s…).
    Se todas falharem, lança RuntimeError com `error_message` e o último erro."""
    last_error = None
    for attempt in range(attempts):
        try:
            return action()
        except Exception as error:  # a rotina tenta novamente antes de falhar
            last_error = error
            time.sleep(2**attempt)
    raise RuntimeError(f"{error_message}: {last_error}")


def curl_json(curl: str, extra_args: list[str], max_time: int) -> object:
    """Corre o curl (com as opções comuns) e devolve o JSON da resposta."""
    result = subprocess.run(
        [curl, "--fail", "--silent", "--show-error", "--location", "--compressed",
         "--connect-timeout", "20", "--max-time", str(max_time), *extra_args],
        check=True,
        capture_output=True,
        timeout=max_time + 10,
    )
    return json.loads(result.stdout.decode("utf-8-sig"))


def fetch_ine_via_gateway(url: str, attempts: int = 3) -> object:
    """Alternativa para quando o INE bloqueia ligações diretas (servidores partilhados do GitHub).
    Pede o indicador a um gateway de leitura através do curl e só aceita a resposta se ela confirmar o endereço
    oficial do INE e o código exato do indicador. Repete até `attempts` vezes, com espera crescente."""
    code_match = re.search(r"[?&]varcd=(\d+)", url)
    if not code_match:
        raise ValueError(f"Pedido INE sem código de indicador: {url}")
    code = code_match.group(1)
    curl = shutil.which("curl")
    if not curl:
        raise RuntimeError("O cliente curl é necessário para o gateway do INE")
    request_body = json.dumps({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {"name": "get_indicator", "arguments": {"varcd": code, "lang": "PT"}},
    })

    def once() -> object:
        envelope = curl_json(curl, ["--header", "Content-Type: application/json", "--data-binary", request_body, INE_GATEWAY_URL], 120)
        provenance_url = envelope.get("result", {}).get("_meta", {}).get("provenance", {}).get("upstream", {}).get("url", "")
        if "www.ine.pt/ine/json_indicador/pindica.jsp" not in provenance_url or f"varcd={code}" not in provenance_url:
            raise ValueError(
                "O gateway não confirmou a proveniência oficial do INE "
                f"(proveniência recebida: {provenance_url!r}; erro: {envelope.get('error')!r}; "
                f"resposta: {json.dumps(envelope, ensure_ascii=False)[:300]})"
            )
        payload = json.loads(envelope["result"]["content"][0]["text"])
        if not isinstance(payload, list) or not payload or payload[0].get("IndicadorCod") != code:
            raise ValueError(f"O gateway devolveu um indicador diferente de {code}")
        return payload

    return retry(once, attempts, f"Falha ao consultar o indicador INE {code} através do gateway")


def fetch_json_direct(url: str, attempts: int = 3) -> object:
    """Faz um GET direto e devolve o JSON. Usa o curl (IPv4, HTTP/1.1, com User-Agent e Referer do INE)
    e, se o curl não existir, o urllib. Repete até `attempts` vezes, com espera crescente."""
    curl = shutil.which("curl")
    if curl:
        args = [
            "--ipv4", "--http1.1",
            "--header", "Accept: application/json, text/javascript, */*; q=0.01",
            "--header", "Referer: https://www.ine.pt/",
            "--user-agent", "Mozilla/5.0 (compatible; Observatorio-Alto-Minho/1.0)",
            url,
        ]
        return retry(lambda: curl_json(curl, args, 90), attempts, f"Falha ao consultar {url} por IPv4")

    request = urllib.request.Request(url, headers={"User-Agent": "Observatorio-Alto-Minho/1.0"})

    def once() -> object:
        with urllib.request.urlopen(request, timeout=60) as response:
            return json.load(response)

    return retry(once, attempts, f"Falha ao consultar {url}")


def fetch_json(url: str, attempts: int = 3) -> object:
    """Ponto de entrada para obter JSON. No GitHub Actions, os pedidos ao INE tentam primeiro a ligação direta (uma vez)
    e depois o gateway; em todos os outros casos (incluindo no teu computador) a ligação é direta."""
    if os.environ.get("GITHUB_ACTIONS") == "true" and "www.ine.pt/ine/json_indicador/" in url:
        direct_error = None
        try:
            return fetch_json_direct(url, 1)
        except Exception as error:
            direct_error = error
        try:
            return fetch_ine_via_gateway(url, attempts)
        except Exception as gateway_error:
            raise RuntimeError(
                f"Falha na API oficial do INE ({direct_error}) e no gateway alternativo ({gateway_error})"
            ) from gateway_error
    return fetch_json_direct(url, attempts)