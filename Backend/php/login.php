<?php
require_once __DIR__ . '/auth.php';

if (is_admin()) {
    header('Location: ' . DASHBOARD_URL);
    exit;
}

$erro = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!csrf_ok($_POST['csrf'] ?? null)) {
        $erro = 'Pedido inválido. Tente novamente.';
    } else {
        $user = trim($_POST['user'] ?? '');
        $pass = $_POST['pass'] ?? '';
        $ok = hash_equals(ADMIN_USER, $user) && password_verify($pass, ADMIN_HASH);
        if ($ok) {
            session_regenerate_id(true);
            $_SESSION['admin'] = true;
            header('Location: ' . DASHBOARD_URL);
            exit;
        }
        sleep(1); // trava ataques de força bruta
        $erro = 'Credenciais inválidas.';
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