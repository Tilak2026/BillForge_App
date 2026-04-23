<?php
/**
 * BillForge API — Purchases (Purchase Orders)
 * GET /api/purchases              → list all
 * POST /api/purchases             → create PO
 * PUT  /api/purchases/{id}/receive → receive PO + update stock
 */
require_once __DIR__ . '/config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Parse URI to get ID and sub-action
$uri   = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = array_values(array_filter(explode('/', $uri)));
$id      = null;
$subAction = null;
foreach ($parts as $i => $part) {
    if ($part === 'purchases') {
        $id        = isset($parts[$i + 1]) && is_numeric($parts[$i + 1]) ? (int)$parts[$i + 1] : null;
        $subAction = $parts[$i + 2] ?? null; // 'receive'
        break;
    }
}

// ── GET ───────────────────────────────────────
if ($method === 'GET') {
    try {
        $rows = $db->query("SELECT * FROM purchases ORDER BY id DESC")->fetchAll();
        foreach ($rows as &$r) {
            $r['id']     = (int)$r['id'];
            $r['amount'] = (float)$r['amount'];
            $decoded = json_decode($r['items'], true);
            $r['items'] = ($decoded !== null) ? $decoded : $r['items'];
        }
        unset($r); // fix PHP reference leak
        jsonResponse($rows);
    } catch (Exception $e) {
        error_log('Purchases GET error: ' . $e->getMessage());
        jsonResponse(['error' => 'Failed to fetch purchases'], 500);
    }
}

// ── POST ──────────────────────────────────────
if ($method === 'POST') {
    $p = getBody();
    $itemsVal = is_array($p['items'] ?? null) ? json_encode($p['items']) : ($p['items'] ?? '');
    $stmt = $db->prepare(
        "INSERT INTO purchases (num,supplier,date,items,amount,status,received)
         VALUES (:num,:supplier,:date,:items,:amount,:status,:received)"
    );
    $stmt->execute([
        ':num'      => $p['num']      ?? '',
        ':supplier' => $p['supplier'] ?? '',
        ':date'     => $p['date']     ?? date('Y-m-d'),
        ':items'    => $itemsVal,
        ':amount'   => (float)($p['amount'] ?? 0),
        ':status'   => $p['status']   ?? 'In Transit',
        ':received' => $p['received'] ?? '',
    ]);
    $p['id'] = (int)$db->lastInsertId();
    jsonResponse($p, 201);
}

// ── PUT /api/purchases/{id}/receive ───────────
if ($method === 'PUT' && $id && $subAction === 'receive') {
    try {
        // Get the PO's items string
        $row = $db->prepare("SELECT items FROM purchases WHERE id=:id");
        $row->execute([':id' => $id]);
        $po = $row->fetch();
        if (!$po) {
            jsonResponse(['error' => 'Purchase Order not found'], 404);
        }

        $itemsStr = $po['items'];
        // Try JSON first
        $decoded = json_decode($itemsStr, true);
        if ($decoded === null) {
            // Plain text format: "15x ProductName (unit) — ..."
            $match = [];
            preg_match('/^(\d+)x\s+(.+?)\s+\(/', $itemsStr, $match);
            $qty      = isset($match[1]) ? (int)$match[1] : 0;
            $prodName = isset($match[2]) ? trim($match[2]) : null;
        } else {
            $qty      = 0;
            $prodName = null;
        }

        $today = date('Y-m-d');

        $db->beginTransaction();

        // Mark PO received
        $upd = $db->prepare("UPDATE purchases SET status='Received', received=:today WHERE id=:id");
        $upd->execute([':today' => $today, ':id' => $id]);

        // Update stock if we could parse product name
        if ($qty > 0 && $prodName) {
            $upd2 = $db->prepare("UPDATE products SET stock = stock + :qty WHERE name = :name");
            $upd2->execute([':qty' => $qty, ':name' => $prodName]);
            // Check if product was found and updated
            if ($upd2->rowCount() === 0) {
                $db->rollBack();
                jsonResponse(['error' => 'Product not found: ' . $prodName], 400);
            }
        }

        $db->commit();
        jsonResponse(['success' => true, 'message' => 'Stock updated']);

    } catch (PDOException $e) {
        $db->rollBack();
        error_log('Purchase receive error: ' . $e->getMessage());
        jsonResponse(['error' => 'Failed to update stock. Please contact support.'], 500);
    }
}

jsonResponse(['error' => 'Method not allowed'], 405);
