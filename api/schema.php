<?php
require_once __DIR__ . '/config.php';
$db = getDB();
$tables = ['invoices', 'customers', 'products', 'expenses', 'quotations', 'purchases'];
foreach ($tables as $table) {
  $stmt = $db->prepare("DESCRIBE $table");
  $stmt->execute();
  $cols = $stmt->fetchAll();
  echo "\n=== $table ===\n";
  foreach ($cols as $col) {
    echo "  - {$col['Field']} ({$col['Type']})\n";
  }
}
?>
