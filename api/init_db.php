<?php
/**
 * BillForge — Database Initializer
 * Run ONCE: http://localhost/BillForge_App/api/init_db.php
 * Creates all tables and seeds initial data using CURRENT-MONTH dates.
 */
require_once __DIR__ . '/config.php';

header('Content-Type: text/html; charset=utf-8');
echo '<pre style="font-family:monospace;padding:20px;background:#0f172a;color:#22c55e;font-size:13px;">';
echo "╔══════════════════════════════════════╗\n";
echo "║     BillForge DB Initializer         ║\n";
echo "╚══════════════════════════════════════╝\n\n";

// Dynamic date helpers — uses CURRENT month so charts always show real data
$today  = date('j M Y');
$d1     = date('j M Y', strtotime('-1 day'));
$d2     = date('j M Y', strtotime('-2 days'));
$d3     = date('j M Y', strtotime('-3 days'));
$d4     = date('j M Y', strtotime('-4 days'));
$d5     = date('j M Y', strtotime('-5 days'));
$d7     = date('j M Y', strtotime('-7 days'));
$d10    = date('j M Y', strtotime('-10 days'));
$d15    = date('j M Y', strtotime('-15 days'));
$prevM1 = date('j M Y', strtotime('-35 days'));
$prevM2 = date('j M Y', strtotime('-45 days'));
$prevM3 = date('j M Y', strtotime('-60 days'));
$valid  = date('j M Y', strtotime('+30 days'));

try {
    $pdo_raw = new PDO(
        'mysql:host=' . DB_HOST . ';charset=' . DB_CHARSET,
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $pdo_raw->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "✅ Database '" . DB_NAME . "' ensured.\n\n";

    $db = getDB();

    // ── USERS ──────────────────────────────────
    $db->exec("CREATE TABLE IF NOT EXISTS `users` (
        `id`       INT AUTO_INCREMENT PRIMARY KEY,
        `email`    VARCHAR(200) UNIQUE NOT NULL,
        `password` VARCHAR(255) NOT NULL,
        `name`     VARCHAR(200),
        `role`     VARCHAR(50),
        `avatar`   VARCHAR(10),
        `created`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    echo "✅ Table 'users' ensured.\n";

    // ── SEED USERS ─────────────────────────────
    $cnt = $db->query("SELECT COUNT(*) FROM users")->fetchColumn();
    if ($cnt == 0) {
        echo "⏳ Seeding users...\n";
        $rows = [
            ['admin@billforge.in',  password_hash('admin123', PASSWORD_BCRYPT),  'Admin User',    'Super Admin', 'AD'],
            ['cashier@billforge.in',password_hash('cashier123', PASSWORD_BCRYPT),'Cashier User',  'Cashier',     'CA'],
            ['viewer@billforge.in', password_hash('viewer123', PASSWORD_BCRYPT), 'Viewer User',   'Viewer',      'VI']
        ];
        $s = $db->prepare("INSERT INTO users (email,password,name,role,avatar) VALUES (?,?,?,?,?)");
        foreach ($rows as $r) $s->execute($r);
        echo "✅ " . count($rows) . " users seeded.\n";
    } else { echo "ℹ️  Users already exist — skipped.\n"; }

    // ── PRODUCTS ──────────────────────────────
    $db->exec("CREATE TABLE IF NOT EXISTS `products` (
        `id`       INT AUTO_INCREMENT PRIMARY KEY,
        `sku`      VARCHAR(50),
        `name`     VARCHAR(200),
        `cat`      VARCHAR(100),
        `hsn`      VARCHAR(50),
        `price`    DECIMAL(10,2),
        `buyPrice` DECIMAL(10,2),
        `gst`      INT,
        `stock`    INT,
        `min`      INT,
        `unit`     VARCHAR(50),
        `emoji`    VARCHAR(10)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    echo "✅ Table 'products' ensured.\n";

    // ── CUSTOMERS ─────────────────────────────
    $db->exec("CREATE TABLE IF NOT EXISTS `customers` (
        `id`          INT AUTO_INCREMENT PRIMARY KEY,
        `name`        VARCHAR(200),
        `phone`       VARCHAR(30),
        `email`       VARCHAR(200),
        `city`        VARCHAR(100),
        `gstin`       VARCHAR(50),
        `orders`      INT DEFAULT 0,
        `spent`       DECIMAL(12,2) DEFAULT 0,
        `outstanding` DECIMAL(12,2) DEFAULT 0,
        `lastOrder`   VARCHAR(100),
        `type`        VARCHAR(50)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    echo "✅ Table 'customers' ensured.\n";

    // ── INVOICES ──────────────────────────────
    $db->exec("CREATE TABLE IF NOT EXISTS `invoices` (
        `id`       INT AUTO_INCREMENT PRIMARY KEY,
        `num`      VARCHAR(50),
        `customer` VARCHAR(200),
        `phone`    VARCHAR(30),
        `date`     VARCHAR(50),
        `items`    LONGTEXT,
        `payment`  VARCHAR(50),
        `status`   VARCHAR(50)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    echo "✅ Table 'invoices' ensured.\n";

    // ── EXPENSES ──────────────────────────────
    $db->exec("CREATE TABLE IF NOT EXISTS `expenses` (
        `id`      INT AUTO_INCREMENT PRIMARY KEY,
        `date`    VARCHAR(50),
        `cat`     TEXT,
        `desc`    TEXT,
        `vendor`  VARCHAR(200),
        `amount`  DECIMAL(12,2),
        `gst`     DECIMAL(12,2),
        `paidBy`  VARCHAR(100),
        `receipt` VARCHAR(200)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    echo "✅ Table 'expenses' ensured.\n";

    // ── QUOTATIONS ────────────────────────────
    $db->exec("CREATE TABLE IF NOT EXISTS `quotations` (
        `id`       INT AUTO_INCREMENT PRIMARY KEY,
        `num`      VARCHAR(50),
        `customer` VARCHAR(200),
        `date`     VARCHAR(50),
        `valid`    VARCHAR(50),
        `items`    LONGTEXT,
        `amount`   DECIMAL(12,2),
        `status`   VARCHAR(50)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    echo "✅ Table 'quotations' ensured.\n";

    // ── PURCHASES ─────────────────────────────
    $db->exec("CREATE TABLE IF NOT EXISTS `purchases` (
        `id`       INT AUTO_INCREMENT PRIMARY KEY,
        `num`      VARCHAR(50),
        `supplier` VARCHAR(200),
        `date`     VARCHAR(50),
        `items`    LONGTEXT,
        `amount`   DECIMAL(12,2),
        `status`   VARCHAR(50),
        `received` VARCHAR(50)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    echo "✅ Table 'purchases' ensured.\n\n";

    // ── DEMO DATA REMOVED ──────────────────────────────────────────────────
    // All sample products, customers, invoices, expenses have been removed
    // from automatic seeding. Start with clean tables for real data entry.
    // Users table still seeded for demo login accounts.
    // ────────────────────────────────────────────────────────────────────────

    echo "✅ Demo data seeding SKIPPED — clean database ready.\n";

    echo "\n╔══════════════════════════════════════╗\n";
    echo "║  ✅  Setup complete! DB is ready.    ║\n";
    echo "╚══════════════════════════════════════╝\n";
    echo "\n<span style='color:#60a5fa;'>→ Open the app: <a href='../public/index.html' style='color:#60a5fa;'>public/index.html</a></span>\n";
    echo "\n<span style='color:#f59e0b;'>⚠️  To reseed fresh: TRUNCATE all tables in phpMyAdmin, then run this again.</span>\n";

} catch (PDOException $e) {
    echo "\n❌ ERROR: " . $e->getMessage() . "\n";
    echo "\nMake sure MySQL is running and your credentials in api/config.php are correct.\n";
}
echo '</pre>';
