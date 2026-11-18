<?php
// Cartões da página Metodologia (criar, editar, eliminar). Os 3 cartões base são migrados para o JSON na 1.ª leitura.
ini_set('display_errors', '0');   // avisos do PHP não podem sujar o JSON
ob_start();
require_once __DIR__ . '/auth.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

// Funciona mesmo sem a extensão mbstring do PHP.
function str_len(string $s): int { return function_exists('mb_strlen') ? mb_strlen($s) : (preg_match_all('/./su', $s) ?: strlen($s)); }
function str_cut(string $s, int $n): string {
    if (function_exists('mb_substr')) return mb_substr($s, 0, $n);
    return preg_match('/^.{0,' . $n . '}/su', $s, $m) ? $m[0] : substr($s, 0, $n);
}

const CARDS_DB = __DIR__ . '/data/cartoes.json';

const CARDS_SEED = __DIR__ . '/data/cartoes.seeded';

function base_cards(): array {
    return [
        ['id' => 'base-1', 'title' => 'Fontes dos dados', 'text' => 'Cada indicador identifica a sua origem, com ligação direta à fonte oficial.', 'tags' => ['PORDATA', 'INE', 'Censos']],
        ['id' => 'base-2', 'title' => 'Atualização dos dados', 'text' => 'Processo automático semanal: todas as segundas-feiras os dados são consultados às fontes, validados (cobertura, ano e coerência) e só então publicados.', 'tags' => ['Semanal', 'Automático']],
        ['id' => 'base-3', 'title' => 'Escala territorial', 'text' => 'São apresentados o Alto Minho enquanto NUTS III e os seus 10 municípios, com limites da CAOP (Direção-Geral do Território).', 'tags' => ['NUTS III Alto Minho', '10 municípios']],
    ];
}

function load_cards(): array {
    $d = is_file(CARDS_DB) ? json_decode(file_get_contents(CARDS_DB), true) : [];
    $d = is_array($d) ? $d : [];
    if (!is_file(CARDS_SEED)) {   // só acontece uma vez: junta os 3 cartões base aos existentes
        $d = array_merge(base_cards(), $d);
        if (!is_dir(dirname(CARDS_DB))) @mkdir(dirname(CARDS_DB), 0755, true);
        if (@file_put_contents(CARDS_DB, json_encode(array_values($d), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX) !== false) @touch(CARDS_SEED);
    }
    return $d;
}

function parse_tags(string $raw): array {
    $tags = [];
    foreach (explode(',', $raw) as $t) {
        $t = trim($t);
        if ($t !== '') $tags[] = $t;
    }
    return array_slice($tags, 0, 6);
}

function save_cards(array $d): void {
    if (!is_dir(dirname(CARDS_DB))) mkdir(dirname(CARDS_DB), 0755, true);
    $ok = @file_put_contents(CARDS_DB, json_encode(array_values($d), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
    if ($ok === false) fail(500, 'Sem permissão para gravar em Backend/php/data/cartoes.json.');
}

function out(array $d): void {
    if (ob_get_length()) ob_clean();   // descarta texto indesejado antes do JSON
    echo json_encode(array_values($d), JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(int $code, string $msg): void {
    if (ob_get_length()) ob_clean();
    http_response_code($code);
    echo json_encode(['error' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    out(load_cards());
}

if (!is_admin()) fail(403, 'Sem permissão.');
if (!csrf_ok($_POST['csrf'] ?? null)) fail(400, 'Pedido inválido.');

$cards = load_cards();
$action = $_POST['action'] ?? '';

if ($action === 'add') {
    $title = trim($_POST['title'] ?? '');
    $text = trim($_POST['text'] ?? '');
    if ($title === '' || str_len($title) > 80) fail(400, 'Título obrigatório (até 80 caracteres).');
    if ($text === '' || str_len($text) > 500) fail(400, 'Texto obrigatório (até 500 caracteres).');
    $tags = parse_tags($_POST['tags'] ?? '');
    $cards[] = ['id' => bin2hex(random_bytes(6)), 'title' => $title, 'text' => $text, 'tags' => $tags];
    save_cards($cards);
    out($cards);
}

if ($action === 'edit') {
    $id = $_POST['id'] ?? '';
    $title = trim($_POST['title'] ?? '');
    $text = trim($_POST['text'] ?? '');
    if ($title === '' || str_len($title) > 80) fail(400, 'Título obrigatório (até 80 caracteres).');
    if ($text === '' || str_len($text) > 500) fail(400, 'Texto obrigatório (até 500 caracteres).');
    foreach ($cards as $i => $c) {
        if ($c['id'] === $id) {
            $cards[$i] = ['id' => $id, 'title' => $title, 'text' => $text, 'tags' => parse_tags($_POST['tags'] ?? '')];
            save_cards($cards);
            out($cards);
        }
    }
    fail(404, 'Cartão não encontrado.');
}

if ($action === 'delete') {
    $id = $_POST['id'] ?? '';
    foreach ($cards as $i => $c) {
        if ($c['id'] === $id) {
            unset($cards[$i]);
            save_cards($cards);
            out($cards);
        }
    }
    fail(404, 'Cartão não encontrado.');
}

fail(400, 'Ação inválida.');