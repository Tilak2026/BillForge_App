<?php
/**
 * BillForge API — Quotations
 * GET  /api/quotations  → list all
 * POST /api/quotations  → create
 */
require_once __DIR__ . '/config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// ── GET ───────────────────────────────────────
if ($method === 'GET') {
    try {
        $rows = $db->query("SELECT * FROM quotations ORDER BY id DESC")->fetchAll();
        foreach ($rows as &$r) {
            $r['id']     = (int)$r['id'];
            $r['amount'] = (float)$r['amount'];
            // items may be a JSON string or plain text
            $decoded = json_decode($r['items'], true);
            $r['items'] = ($decoded !== null) ? $decoded : $r['items'];
        }
        unset($r);
        jsonResponse($rows);
    } catch (Exception $e) {
        error_log('Quotations GET error: ' . $e->getMessage());
        jsonResponse(['error' => 'Failed to fetch quotations'], 500);
    }
}

// ── POST ──────────────────────────────────────
if ($method === 'POST') {
    $q = getBody();
    $stmt = $db->prepare(
        "INSERT INTO quotations (num,customer,date,valid,items,amount,status)
         VALUES (:num,:customer,:date,:valid,:items,:amount,:status)"
    );
    $itemsVal = is_array($q['items'] ?? null) ? json_encode($q['items']) : ($q['items'] ?? '');
    $stmt->execute([
        ':num'      => $q['num']      ?? '',
        ':customer' => $q['customer'] ?? '',
        ':date'     => $q['date']     ?? date('Y-m-d'),
        ':valid'    => $q['valid']    ?? '',
        ':items'    => $itemsVal,
        ':amount'   => (float)($q['amount'] ?? 0),
        ':status'   => $q['status']   ?? 'Awaiting',
    ]);
    $q['id'] = (int)$db->lastInsertId();
    jsonResponse($q, 201);
}

jsonResponse(['error' => 'Method not allowed'], 405);
