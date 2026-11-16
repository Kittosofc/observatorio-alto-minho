<?php
require_once __DIR__ . '/config.php';

const SESSAO_INATIVIDADE = 1800; // 30 minutos

$https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
ini_set('session.gc_maxlifetime', (string) SESSAO_INATIVIDADE);
session_set_cookie_params([
    'lifetime' => 0,        // cookie dura até fechar o browser
    'path'     => '/',
    'domain'   => '',       // só este (sub)domínio, sem partilhar com o site principal
    'secure'   => $https,
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_name('OBS_ADMIN');  // nome próprio, evita colisão com o PHPSESSID do site
session_start();

if (!empty($_SESSION['admin'])) {
    if (time() - ($_SESSION['ultimo'] ?? time()) > SESSAO_INATIVIDADE) {
        $_SESSION = [];
        session_destroy();
        session_start();
    } else {
        $_SESSION['ultimo'] = time();
    }
}

function is_admin(): bool {
    return !empty($_SESSION['admin']);
}

function require_admin(): void {
    if (!is_admin()) {
        header('Location: login.php');
        exit;
    }
}

function csrf_token(): string {
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function csrf_ok(?string $t): bool {
    return $t && !empty($_SESSION['csrf']) && hash_equals($_SESSION['csrf'], $t);
}