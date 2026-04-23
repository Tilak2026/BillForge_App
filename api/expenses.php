<?php
/**
 * BillForge API — Expenses
 * GET  /api/expenses  → list all
 * POST /api/expenses  → create
 */
require_once __DIR__ . '/config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// ── GET ───────────────────────────────────────
if ($method === 'GET') {
    try {
        $rows = $db->query("SELECT * FROM expenses ORDER BY id DESC")->fetchAll();
        foreach ($rows as &$r) {
            $r['id']     = (int)$r['id'];
            $r['amount'] = (float)$r['amount'];
            $r['gst']    = (float)$r['gst'];
        }
        unset($r);
        jsonResponse($rows);
    } catch (Exception $e) {
        error_log('Expenses GET error: ' . $e->getMessage());
        jsonResponse(['error' => 'Failed to fetch expenses'], 500);
    }
}

// ── POST ──────────────────────────────────────
if ($method === 'POST') {
    $e = getBody();
    if (empty($e['amount'])) {
        jsonResponse(['error' => 'Amount is required'], 400);
    }
    $stmt = $db->prepare(
        "INSERT INTO expenses (date,cat,`desc`,vendor,amount,gst,paidBy,receipt)
         VALUES (:date,:cat,:desc,:vendor,:amount,:gst,:paidBy,:receipt)"
    );
    $stmt->execute([
        ':date'    => $e['date']    ?? date('Y-m-d'),
        ':cat'     => $e['cat']     ?? 'General',
        ':desc'    => $e['desc']    ?? '',
        ':vendor'  => $e['vendor']  ?? '',
        ':amount'  => (float)$e['amount'],
        ':gst'     => (float)($e['gst'] ?? 0),
        ':paidBy'  => $e['paidBy']  ?? 'Cash',
        ':receipt' => $e['receipt'] ?? 'None',
    ]);
    $e['id'] = (int)$db->lastInsertId();
    jsonResponse($e, 201);
}

jsonResponse(['error' => 'Method not allowed'], 405);
