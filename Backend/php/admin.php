<?php
require_once __DIR__ . '/auth.php';
require_admin();
?>
<!doctype html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Admin | Observatório Alto Minho</title>
  <link rel="icon" type="image/svg+xml" href="../../FrontEnd/imgs/favicon.svg">
  <link rel="stylesheet" href="../../FrontEnd/css/shared/global.css">
  <style>
    body { margin:0; background:var(--paper); font-family:var(--font-body); color:var(--ink); }
    header { display:flex; justify-content:space-between; align-items:center; padding:16px 28px; background:var(--forest); color:#fff; }
    header a { color:#fff; margin-left:16px; }
    main { padding:28px; max-width:900px; margin:auto; }
    h1 { font-family:var(--font-title); color:var(--forest); }
  </style>
</head>
<body>
  <header>
    <strong>Painel de administração</strong>
    <nav><a href="<?= DASHBOARD_URL ?>">Ver dashboard</a><a href="logout.php">Sair</a></nav>
  </header>
  <main>
    <h1>Bem-vindo, admin</h1>
    <p>Área reservada a administradores. Adicione aqui as funcionalidades de gestão.</p>
  </main>
</body>
</html>