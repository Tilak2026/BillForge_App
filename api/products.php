<?php
/**
 * BillForge API — Products
 * GET    /api/products        → list all
 * POST   /api/products        → create
 * PUT    /api/products/{id}   → update
 * DELETE /api/products/{id}   → delete
 */
require_once __DIR__ . '/config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Parse ID from URL: /api/products/123 or /api/products/123/anything
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts  = array_values(array_filter(explode('/', $uri)));
// parts: [..., 'api', 'products', '{id}']
$id     = null;
foreach ($parts as $i => $part) {
    if ($part === 'products' && isset($parts[$i + 1])) {
        $id = is_numeric($parts[$i + 1]) ? (int)$parts[$i + 1] : null;
        break;
    }
}

// ── GET ───────────────────────────────────────
if ($method === 'GET') {
    $rows = $db->query("SELECT * FROM products ORDER BY id ASC")->fetchAll();
    // Cast numeric fields
    foreach ($rows as &$r) {
        $r['id']       = (int)$r['id'];
        $r['price']    = (float)$r['price'];
        $r['buyPrice'] = (float)$r['buyPrice'];
        $r['gst']      = (int)$r['gst'];
        $r['stock']    = (int)$r['stock'];
        $r['min']      = (int)$r['min'];
    }
    unset($r); // fix PHP reference leak
    jsonResponse($rows);
}

// ── POST ──────────────────────────────────────
if ($method === 'POST') {
    $p = getBody();
    if (empty($p['name']) || !isset($p['price'])) {
        jsonResponse(['error' => 'Name and price are required'], 400);
    }
    $stmt = $db->prepare(
        "INSERT INTO products (sku,name,cat,hsn,price,buyPrice,gst,stock,min,unit,emoji)
         VALUES (:sku,:name,:cat,:hsn,:price,:buyPrice,:gst,:stock,:min,:unit,:emoji)"
    );
    $stmt->execute([
        ':sku'      => $p['sku']      ?? '',
        ':name'     => $p['name'],
        ':cat'      => $p['cat']      ?? 'Grocery',
        ':hsn'      => $p['hsn']      ?? '0000',
        ':price'    => (float)($p['price'] ?? 0),
        ':buyPrice' => (float)($p['buyPrice'] ?? 0),
        ':gst'      => (int)($p['gst'] ?? 0),
        ':stock'    => (int)($p['stock'] ?? 0),
        ':min'      => (int)($p['min'] ?? 5),
        ':unit'     => $p['unit']     ?? 'pcs',
        ':emoji'    => $p['emoji']    ?? '📦',
    ]);
    $p['id'] = (int)$db->lastInsertId();
    jsonResponse($p, 201);
}

// ── PUT ───────────────────────────────────────
if ($method === 'PUT' && $id) {
    $p = getBody();
    if (empty($p['name']) || !isset($p['price'])) {
        jsonResponse(['error' => 'Valid Name and Price required'], 400);
    }
    $stmt = $db->prepare(
        "UPDATE products
         SET name=:name, stock=:stock, min=:min, price=:price,
             cat=:cat, emoji=:emoji, unit=:unit, hsn=:hsn, gst=:gst
         WHERE id=:id"
    );
    $stmt->execute([
        ':name'  => $p['name'],
        ':stock' => (int)($p['stock'] ?? 0),
        ':min'   => (int)($p['min'] ?? 0),
        ':price' => (float)$p['price'],
        ':cat'   => $p['cat']   ?? 'Grocery',
        ':emoji' => $p['emoji'] ?? '📦',
        ':unit'  => $p['unit']  ?? 'pcs',
        ':hsn'   => $p['hsn']   ?? '0000',
        ':gst'   => (int)($p['gst'] ?? 0),
        ':id'    => $id,
    ]);
    // rowCount() can be 0 even on success if no values changed - check existence instead
    $check = $db->prepare("SELECT id FROM products WHERE id=:id");
    $check->execute([':id' => $id]);
    if (!$check->fetch()) {
        jsonResponse(['error' => 'Product not found'], 404);
    }
    jsonResponse(['success' => true]);
}

// ── DELETE ────────────────────────────────────
if ($method === 'DELETE' && $id) {
    $stmt = $db->prepare("DELETE FROM products WHERE id=:id");
    $stmt->execute([':id' => $id]);
    jsonResponse(['success' => true, 'changes' => $stmt->rowCount()]);
}

jsonResponse(['error' => 'Method not allowed'], 405);
