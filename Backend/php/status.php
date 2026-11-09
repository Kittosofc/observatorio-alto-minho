<?php
require_once __DIR__ . '/auth.php';
header('Content-Type: application/json');
header('Cache-Control: no-store');
echo json_encode(is_admin() ? ['admin' => true, 'csrf' => csrf_token()] : ['admin' => false]);