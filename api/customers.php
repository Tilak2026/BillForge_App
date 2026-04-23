<?php
/**
 * BillForge API — Customers
 * GET    /api/customers       → list all
 * POST   /api/customers       → create
 * PUT    /api/customers/{id}  → update
 * DELETE /api/customers/{id}  → delete
 */
require_once __DIR__ . '/config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Parse optional ID from URL
$uri   = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = array_values(array_filter(explode('/', $uri)));
$id    = null;
foreach ($parts as $i => $part) {
    if ($part === 'customers' && isset($parts[$i + 1]) && is_numeric($parts[$i + 1])) {
        $id = (int)$parts[$i + 1];
        break;
    }
}

// ── GET ───────────────────────────────────────
if ($method === 'GET') {
    try {
        $rows = $db->query("SELECT * FROM customers ORDER BY id ASC")->fetchAll();
        foreach ($rows as &$r) {
            $r['id']          = (int)$r['id'];
            $r['orders']      = (int)$r['orders'];
            $r['spent']       = (float)$r['spent'];
            $r['outstanding'] = (float)$r['outstanding'];
        }
        unset($r); // fix PHP reference leak
        jsonResponse($rows);
    } catch (Exception $e) {
        error_log('Customers GET error: ' . $e->getMessage());
        jsonResponse(['error' => 'Failed to fetch customers'], 500);
    }
}

// ── POST ──────────────────────────────────────
if ($method === 'POST') {
    $c = getBody();
    if (empty($c['name']) || empty($c['phone'])) {
        jsonResponse(['error' => 'Name and Phone required'], 400);
    }
    $stmt = $db->prepare(
        "INSERT INTO customers (name,phone,email,city,gstin,orders,spent,outstanding,lastOrder,type)
         VALUES (:name,:phone,:email,:city,:gstin,:orders,:spent,:outstanding,:lastOrder,:type)"
    );
    $stmt->execute([
        ':name'        => $c['name'],
        ':phone'       => $c['phone'],
        ':email'       => $c['email']       ?? '',
        ':city'        => $c['city']        ?? '',
        ':gstin'       => $c['gstin']       ?? '',
        ':orders'      => (int)($c['orders'] ?? 0),
        ':spent'       => (float)($c['spent'] ?? 0),
        ':outstanding' => (float)($c['outstanding'] ?? 0),
        ':lastOrder'   => $c['lastOrder']   ?? date('Y-m-d'),
        ':type'        => $c['type']        ?? 'Retail',
    ]);
    $c['id'] = (int)$db->lastInsertId();
    jsonResponse($c, 201);
}

// ── PUT ───────────────────────────────────────
if ($method === 'PUT' && $id) {
    $c = getBody();
    if (empty($c['name']) || empty($c['phone'])) {
        jsonResponse(['error' => 'Name and Phone required'], 400);
    }
    // Check if customer exists BEFORE updating
    $check = $db->prepare("SELECT id FROM customers WHERE id=:id");
    $check->execute([':id' => $id]);
    if (!$check->fetch()) {
        jsonResponse(['error' => 'Customer not found'], 404);
    }
    $stmt = $db->prepare(
        "UPDATE customers SET name=:name, phone=:phone, email=:email,
         city=:city, gstin=:gstin, type=:type WHERE id=:id"
    );
    $stmt->execute([
        ':name'  => $c['name'],
        ':phone' => $c['phone'],
        ':email' => $c['email'] ?? '',
        ':city'  => $c['city']  ?? '',
        ':gstin' => $c['gstin'] ?? '',
        ':type'  => $c['type']  ?? 'Retail',
        ':id'    => $id,
    ]);
    jsonResponse(['success' => true]);
}

// ── DELETE ────────────────────────────────────
if ($method === 'DELETE' && $id) {
    $stmt = $db->prepare("DELETE FROM customers WHERE id=:id");
    $stmt->execute([':id' => $id]);
    jsonResponse(['success' => true, 'deleted' => $stmt->rowCount()]);
}

jsonResponse(['error' => 'Method not allowed'], 405);
