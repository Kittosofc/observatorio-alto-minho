<?php
require_once __DIR__ . '/auth.php';

if (is_admin()) {
    header('Location: ' . DASHBOARD_URL);
    exit;
}

// ── Bloqueio progressivo por IP (como nos telemóveis) ─────────────────────────
// A cada 5 falhas seguidas o IP fica bloqueado durante um tempo cada vez maior.
// Chave = nº de "blocos de 5 falhas"; valor = segundos de bloqueio.
// Do 5.º bloco em diante mantém-se o último valor (5 min).
const LOGIN_FALHAS_POR_BLOCO = 5;
const LOGIN_BLOQUEIOS = [1 => 5, 2 => 10, 3 => 30, 4 => 60, 5 => 300];
const LOGIN_RESET_APOS = 86400;   // sem falhas há 24 h: o contador volta a zero
const LOGIN_FICHEIRO = __DIR__ . '/data/login-tentativas.json';   // .json já está bloqueado pelo .htaccess

// Guarda só um hash do IP (o IP é dado pessoal); o sal é o hash da password do admin.
function login_chave(): string {
    return hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '?') . '|' . ADMIN_HASH);
}

// Lê, deixa o $fn alterar e grava, tudo com o ficheiro trancado (pedidos em paralelo não se atropelam).
// Devolve o que o $fn devolver, ou null se não conseguir gravar.
function login_estado(callable $fn) {
    if (!is_dir(dirname(LOGIN_FICHEIRO))) @mkdir(dirname(LOGIN_FICHEIRO), 0755, true);
    $h = @fopen(LOGIN_FICHEIRO, 'c+');
    if (!$h) return null;
    flock($h, LOCK_EX);
    $d = json_decode((string) stream_get_contents($h), true);
    $d = is_array($d) ? $d : [];
    $agora = time();
    foreach ($d as $k => $e) {                       // limpa entradas antigas
        if ($agora - ($e['ultima'] ?? 0) > LOGIN_RESET_APOS) unset($d[$k]);
    }
    $r = $fn($d, $agora);
    ftruncate($h, 0);
    rewind($h);
    fwrite($h, json_encode($d));
    fflush($h);
    flock($h, LOCK_UN);
    fclose($h);
    return $r;
}

// Segundos que faltam para este IP poder tentar outra vez (0 = pode tentar).
function login_espera(): int {
    $k = login_chave();
    $r = login_estado(fn(&$d, $agora) => max(0, ($d[$k]['bloqueado_ate'] ?? 0) - $agora));
    return (int) $r;
}

function login_falhou(): void {
    $k = login_chave();
    $r = login_estado(function (&$d, $agora) use ($k) {
        $e = $d[$k] ?? ['falhas' => 0, 'bloqueado_ate' => 0];
        $e['falhas']++;
        $e['ultima'] = $agora;
        if ($e['falhas'] % LOGIN_FALHAS_POR_BLOCO === 0) {
            $bloco = min(intdiv($e['falhas'], LOGIN_FALHAS_POR_BLOCO), max(array_keys(LOGIN_BLOQUEIOS)));
            $e['bloqueado_ate'] = $agora + LOGIN_BLOQUEIOS[$bloco];
        }
        $d[$k] = $e;
        return true;
    });
    if ($r === null) sleep(2);   // sem permissão para gravar em data/: pelo menos atrasa
}

function login_sucesso(): void {
    $k = login_chave();
    login_estado(function (&$d) use ($k) { unset($d[$k]); return true; });
}

function formata_espera(int $s): string {
    if ($s >= 60) { $m = (int) ceil($s / 60); return $m . ($m === 1 ? ' minuto' : ' minutos'); }
    return $s . ($s === 1 ? ' segundo' : ' segundos');
}

$erro = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $espera = login_espera();
    if ($espera > 0) {
        // Bloqueado: nem sequer verifica a password (nem a certa entra durante o bloqueio).
        $erro = 'Demasiadas tentativas. Tente novamente dentro de ' . formata_espera($espera) . '.';
    } elseif (!csrf_ok($_POST['csrf'] ?? null)) {
        $erro = 'Pedido inválido. Tente novamente.';
    } else {
        $user = trim($_POST['user'] ?? '');
        $pass = $_POST['pass'] ?? '';
        $ok = hash_equals(ADMIN_USER, $user) && password_verify($pass, ADMIN_HASH);
        if ($ok) {
            login_sucesso();
            session_regenerate_id(true);
            $_SESSION['admin'] = true;
            header('Location: ' . DASHBOARD_URL);
            exit;
        }
        login_falhou();
        $espera = login_espera();
        $erro = $espera > 0
            ? 'Credenciais inválidas. Tente novamente dentro de ' . formata_espera($espera) . '.'
            : 'Credenciais inválidas.';
    }
}
?>
<!doctype html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Login | Observatório Alto Minho</title>
  <link rel="icon" type="image/svg+xml" href="../../FrontEnd/imgs/favicon.svg">
  <link rel="stylesheet" href="../../FrontEnd/css/shared/global.css">
  <style>
    body { display:grid; place-items:center; min-height:100vh; margin:0; background:var(--paper); font-family:var(--font-body); color:var(--ink); }
    .box { margin:0; background:var(--white); border:1px solid var(--line); border-radius:12px; padding:32px; width:min(360px,90vw); }
    .box img { height:48px; margin-bottom:12px; }
    h1 { font-family:var(--font-title); font-size:1.3rem; margin:0 0 20px; color:var(--forest); }
    label { display:block; font-size:.85rem; margin:12px 0 4px; color:var(--muted); }
    input { width:100%; box-sizing:border-box; padding:10px; border:1px solid var(--line); border-radius:8px; font:inherit; }
    button, .btn { display:block; width:100%; box-sizing:border-box; margin-top:18px; padding:11px; border:0; border-radius:8px; background:var(--forest); color:#fff; font:inherit; font-weight:600; text-align:center; text-decoration:none; cursor:pointer; }
    .btn { background:var(--lime); color:var(--ink); margin-top:10px; }
    .erro { background:var(--red); color:var(--red-ink); padding:8px 10px; border-radius:8px; font-size:.9rem; margin-bottom:8px; }
    hr { border:0; border-top:1px solid var(--line); margin:22px 0 6px; }
  </style>
</head>
<body>
  <main class="box">
    <img src="../../FrontEnd/imgs/cim-alto-minho.svg" alt="CIM Alto Minho">
    <h1>Acesso de administrador</h1>
    <?php if ($erro): ?><div class="erro"><?= htmlspecialchars($erro) ?></div><?php endif; ?>
    <form method="post" autocomplete="off">
      <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
      <label for="user">Utilizador</label>
      <input id="user" name="user" required autofocus>
      <label for="pass">Palavra-passe</label>
      <input id="pass" name="pass" type="password" required>
      <button type="submit">Entrar</button>
    </form>
    <hr>
    <a class="btn" href="<?= DASHBOARD_URL ?>">Quero ver o dashboard</a>
  </main>
</body>
</html>