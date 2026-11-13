"""Leitura e escrita de ficheiros (JS gerado, JSON de fontes e relatório).

Toda a escrita é feita de forma segura: o conteúdo vai primeiro para um ficheiro temporário na mesma pasta e só no fim
substitui o ficheiro final. Se o processo for interrompido a meio (servidor reiniciado, tempo esgotado, disco cheio),
o ficheiro que o site está a ler fica como estava, nunca a meio."""
from __future__ import annotations

import json
import os
import re
import tempfile
from pathlib import Path

from .config import PORDATA_SOURCES_PATH, REPORT_PATH


def write_bytes_atomically(path: Path, data: bytes) -> None:
    """Grava `data` em `path` sem nunca deixar o ficheiro a meio.
    1. escreve num ficheiro temporário na mesma pasta (assim a troca final é feita no mesmo disco);
    2. força a gravação no disco;
    3. substitui o ficheiro final numa única operação (os.replace).
    Se algo falhar, o temporário é apagado e o ficheiro original fica intacto."""
    path.parent.mkdir(parents=True, exist_ok=True)
    handle, temporary_name = tempfile.mkstemp(dir=path.parent, prefix=f".{path.name}.", suffix=".tmp")
    temporary = Path(temporary_name)
    try:
        with os.fdopen(handle, "wb") as file:
            file.write(data)
            file.flush()
            os.fsync(file.fileno())
        # mkstemp cria o ficheiro só com permissão do dono (600); o site precisa de o poder ler.
        if path.exists():
            os.chmod(temporary, path.stat().st_mode & 0o777)
        else:
            os.chmod(temporary, 0o644)
        os.replace(temporary, path)
    except BaseException:
        temporary.unlink(missing_ok=True)
        raise


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
    indentado em várias linhas e sem escapar acentos. A gravação é segura (ver write_bytes_atomically)."""
    payload = json.dumps(value, ensure_ascii=False, indent=2)
    write_bytes_atomically(path, f"// {comment}\nconst {variable} = {payload};\n".encode("utf-8"))


def write_report(report: list[dict]) -> None:
    """Grava o relatório da atualização (data/update-report.json), também de forma segura."""
    text = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    write_bytes_atomically(REPORT_PATH, text.encode("utf-8"))