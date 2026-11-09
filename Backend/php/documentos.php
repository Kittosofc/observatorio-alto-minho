<?php
require_once __DIR__ . '/auth.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const DOCS_DIR = __DIR__ . '/../../FrontEnd/docs/';
const DOCS_DB = __DIR__ . '/data/documentos.json';

function load_docs(): array {
    if (!is_file(DOCS_DB)) {
        return [
            ['id' => '1', 'title' => 'Título do documento 1', 'description' => 'Descrição do documento 1.', 'file' => '1.pdf'],
            ['id' => '2', 'title' => 'Título do documento 2', 'description' => 'Descrição do documento 2.', 'file' => '2.pdf'],
        ];
    }
    $d = json_decode(file_get_contents(DOCS_DB), true);
    return is_array($d) ? $d : [];
}

function save_docs(array $d): void {
    if (!is_dir(dirname(DOCS_DB))) mkdir(dirname(DOCS_DB), 0755, true);
    file_put_contents(DOCS_DB, json_encode(array_values($d), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
}

function fail(int $code, string $msg): void {
    http_response_code($code);
    echo json_encode(['error' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(load_docs(), JSON_UNESCAPED_UNICODE);
    exit;
}

if (!is_admin()) fail(403, 'Sem permissão.');
if (!csrf_ok($_POST['csrf'] ?? null)) fail(400, 'Pedido inválido.');

$docs = load_docs();
$action = $_POST['action'] ?? '';

if ($action === 'add') {
    $title = trim($_POST['title'] ?? '');
    $desc = trim($_POST['description'] ?? '');
    if ($title === '' || mb_strlen($title) > 120 || mb_strlen($desc) > 400) {
        fail(400, 'Título obrigatório (até 120 caracteres) e descrição até 400.');
    }
    $f = $_FILES['pdf'] ?? null;
    if (!$f || $f['error'] !== UPLOAD_ERR_OK) fail(400, 'PDF em falta ou demasiado grande para o servidor.');
    if ($f['size'] > 20 * 1024 * 1024) fail(400, 'O PDF tem mais de 20 MB.');
    if (file_get_contents($f['tmp_name'], false, null, 0, 5) !== '%PDF-') fail(400, 'O ficheiro não é um PDF.');
    $id = bin2hex(random_bytes(6));
    $name = $id . '.pdf';
    if (!move_uploaded_file($f['tmp_name'], DOCS_DIR . $name)) fail(500, 'Não foi possível gravar o ficheiro.');
    $docs[] = ['id' => $id, 'title' => $title, 'description' => $desc, 'file' => $name];
    save_docs($docs);
    echo json_encode(array_values($docs), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($action === 'delete') {
    $id = $_POST['id'] ?? '';
    foreach ($docs as $i => $d) {
        if ($d['id'] === $id) {
            $p = DOCS_DIR . basename($d['file']);
            if (is_file($p)) unlink($p);
            unset($docs[$i]);
            save_docs($docs);
            echo json_encode(array_values($docs), JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
    fail(404, 'Documento não encontrado.');
}

fail(400, 'Ação inválida.');