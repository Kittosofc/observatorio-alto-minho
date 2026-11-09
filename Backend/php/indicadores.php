<?php
require_once __DIR__ . '/auth.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const IND_DB = __DIR__ . '/data/indicadores.json';

function load_hidden(): array {
    if (!is_file(IND_DB)) return [];
    $d = json_decode(file_get_contents(IND_DB), true);
    return is_array($d['hidden'] ?? null) ? $d['hidden'] : [];
}

function fail(int $code, string $msg): void {
    http_response_code($code);
    echo json_encode(['error' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(['hidden' => load_hidden()], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!is_admin()) fail(403, 'Sem permissão.');
if (!csrf_ok($_POST['csrf'] ?? null)) fail(400, 'Pedido inválido.');
if (($_POST['action'] ?? '') !== 'set') fail(400, 'Ação inválida.');

$hidden = json_decode($_POST['hidden'] ?? '', true);
if (!is_array($hidden) || count($hidden) > 2000) fail(400, 'Lista inválida.');
$clean = [];
foreach ($hidden as $n) {
    if (!is_string($n) || strlen($n) > 1200) fail(400, 'Lista inválida.');
    $clean[$n] = true;
}
$clean = array_keys($clean);

if (!is_dir(dirname(IND_DB)) && !@mkdir(dirname(IND_DB), 0775, true)) fail(500, 'Sem permissão para criar a pasta data/.');
if (@file_put_contents(IND_DB, json_encode(['hidden' => $clean], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX) === false) fail(500, 'Sem permissão de escrita em data/indicadores.json.');
echo json_encode(['hidden' => $clean], JSON_UNESCAPED_UNICODE);