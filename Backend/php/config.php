<?php
// Configuração do admin. Para mudar a password gere um novo hash:
//   php -r "echo password_hash('NOVA_PASSWORD', PASSWORD_DEFAULT);"
// Password inicial: admin123 
const ADMIN_USER = 'admin';
const ADMIN_HASH = '$2y$10$LLCSkOMkkjGrDr9qmsu2qO4DFKfa5mIzvfCP.Tx9Enp1og3.NPDjq';
const DASHBOARD_URL = '../../index.html';