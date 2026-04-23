<?php
/**
 * BillForge API — Invoices
 * GET  /api/invoices  → list all (DESC)
 * POST /api/invoices  → create + deduct inventory (transaction)
 */
require_once __DIR__ . '/config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// ── GET ───────────────────────────────────────
if ($method === 'GET') {
    try {
        $rows = $db->query("SELECT * FROM invoices ORDER BY id DESC")->fetchAll();
        foreach ($rows as &$r) {
            $r['id']    = (int)$r['id'];
            $r['items'] = json_decode($r['items'], true) ?? [];
        }
        unset($r); // fix PHP reference leak
        jsonResponse($rows);
    } catch (Exception $e) {
        error_log('Invoices GET error: ' . $e->getMessage());
        jsonResponse(['error' => 'Failed to fetch invoices'], 500);
    }
}

// ── POST ──────────────────────────────────────
if ($method === 'POST') {
    try {
        $inv = getBody();
        if (empty($inv['customer']) || empty($inv['items'])) {
            jsonResponse(['error' => 'Customer and items are required'], 400);
        }
        // Validate items array structure
        if (!is_array($inv['items'])) {
            jsonResponse(['error' => 'Items must be an array'], 400);
        }
        foreach ($inv['items'] as $item) {
            if (empty($item['name']) || !isset($item['qty']) || !isset($item['price']) || !isset($item['gst'])) {
                jsonResponse(['error' => 'Each item must have: name, qty, price, gst'], 400);
            }
        }

        $db->beginTransaction();

        $stmt = $db->prepare(
            "INSERT INTO invoices (num,customer,phone,date,items,payment,status)
             VALUES (:num,:customer,:phone,:date,:items,:payment,:status)"
        );
        $stmt->execute([
            ':num'      => $inv['num']     ?? '',
            ':customer' => $inv['customer'],
            ':phone'    => $inv['phone']   ?? '',
            ':date'     => $inv['date']    ?? date('Y-m-d'),
            ':items'    => json_encode($inv['items']),
            ':payment'  => $inv['payment'] ?? 'Cash',
            ':status'   => $inv['status']  ?? 'Paid',
        ]);
        $invoiceId = (int)$db->lastInsertId();

        // Deduct stock for each item
        $deductStmt = $db->prepare(
            "UPDATE products SET stock = stock - :qty1 WHERE name = :name AND stock >= :qty2"
        );
        foreach ($inv['items'] as $item) {
            $deductStmt->execute([
                ':qty1' => (int)$item['qty'],
                ':qty2' => (int)$item['qty'],
                ':name' => $item['name'],
            ]);
            // Check if stock deduction succeeded
            if ($deductStmt->rowCount() === 0) {
                $db->rollBack();
                jsonResponse(['error' => 'Insufficient stock for product: ' . $item['name']], 400);
            }
        }

        // Calculate total and outstanding
        $total = 0;
        foreach ($inv['items'] as $item) {
            $base = $item['price'] * $item['qty'];
            $gstAmt = $base * $item['gst'] / 100;
            $total += $base + $gstAmt;
        }
        $isPending = ($inv['status'] ?? 'Paid') === 'Pending';
        $outstanding = $isPending ? $total : 0;
        $date = $inv['date'] ?? date('Y-m-d');

        // Automatic Customer creation / update
        $checkCust = $db->prepare("SELECT id FROM customers WHERE name = :name");
        $checkCust->execute([':name' => $inv['customer']]);
        if ($checkCust->fetch()) {
            // Update existing customer
            $updCust = $db->prepare("UPDATE customers SET orders = orders + 1, spent = spent + :total, outstanding = outstanding + :out, lastOrder = :last WHERE name = :name");
            $updCust->execute([
                ':total' => $total,
                ':out'   => $outstanding,
                ':last'  => $date,
                ':name'  => $inv['customer']
            ]);
        } else {
            // Insert new customer
            $insCust = $db->prepare("INSERT INTO customers (name, phone, orders, spent, outstanding, lastOrder, type) VALUES (:name, :phone, 1, :total, :out, :last, 'Retail')");
            $insCust->execute([
                ':name'  => $inv['customer'],
                ':phone' => $inv['phone'] ?? '',
                ':total' => $total,
                ':out'   => $outstanding,
                ':last'  => $date
            ]);
        }

        $db->commit();

        $inv['id']    = $invoiceId;
        $inv['items'] = $inv['items']; // already array
        jsonResponse($inv, 201);

    } catch (PDOException $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log('Invoices POST error: ' . $e->getMessage());
        jsonResponse(['error' => 'Failed to create invoice'], 500);
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log('Invoices POST error: ' . $e->getMessage());
        jsonResponse(['error' => 'Failed to create invoice'], 500);
    }
}

// ── PUT (update status) ──────────────────────────────────
if ($method === 'PUT') {
    $uri   = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $parts = array_values(array_filter(explode('/', $uri)));
    $id    = null;
    foreach ($parts as $i => $part) {
        if ($part === 'invoices' && isset($parts[$i + 1]) && is_numeric($parts[$i + 1])) {
            $id = (int)$parts[$i + 1]; break;
        }
    }
    if (!$id) jsonResponse(['error' => 'Invoice ID required'], 400);
    $body = getBody();
    $newStatus = $body['status'] ?? 'Paid';

    // Fetch current invoice to adjust customer outstanding if changing status
    $invStmt = $db->prepare("SELECT customer, items, status FROM invoices WHERE id=:id");
    $invStmt->execute([':id' => $id]);
    $inv = $invStmt->fetch();
    
    if ($inv && $inv['status'] !== $newStatus) {
        $items = json_decode($inv['items'], true) ?? [];
        $total = 0;
        foreach ($items as $item) {
            $total += ($item['price'] * $item['qty']) * (1 + ($item['gst'] / 100));
        }
        
        // If changing from Pending to Paid -> reduce outstanding
        // If changing from Paid to Pending -> increase outstanding
        $adjustment = 0;
        if ($inv['status'] === 'Pending' && $newStatus === 'Paid') {
            $adjustment = -$total;
        } elseif ($inv['status'] === 'Paid' && $newStatus === 'Pending') {
            $adjustment = $total;
        }
        
        if ($adjustment != 0) {
            $updCust = $db->prepare("UPDATE customers SET outstanding = outstanding + :adj WHERE name = :name");
            $updCust->execute([':adj' => $adjustment, ':name' => $inv['customer']]);
        }
    }

    $stmt = $db->prepare("UPDATE invoices SET status=:status WHERE id=:id");
    $stmt->execute([':status' => $newStatus, ':id' => $id]);
    jsonResponse(['success' => true]);
}

jsonResponse(['error' => 'Method not allowed'], 405);
