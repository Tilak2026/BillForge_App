<?php
/**
 * BillForge — API Test & Verification
 * Tests database connection and basic API functionality
 */
require_once __DIR__ . '/config.php';

header('Content-Type: application/json');

$results = [];

// Test 1: Database Connection
try {
    $db = getDB();
    $db->query("SELECT 1");
    $results['database_connection'] = ['status' => 'success', 'message' => 'Database connected'];
} catch (Exception $e) {
    $results['database_connection'] = ['status' => 'error', 'message' => $e->getMessage()];
}

// Test 2: Check Tables Exist
$tables = ['invoices', 'customers', 'quotations', 'purchases', 'expenses', 'products'];
try {
    $db = getDB();
    foreach ($tables as $table) {
        $stmt = $db->prepare("SELECT COUNT(*) as cnt FROM $table");
        $stmt->execute();
        $row = $stmt->fetch();
        $results['table_' . $table] = ['status' => 'exists', 'row_count' => (int)$row['cnt']];
    }
} catch (Exception $e) {
    $results['table_check'] = ['status' => 'error', 'message' => $e->getMessage()];
}

// Test 3: Test Insert (insert a test product and delete it)
try {
    $db = getDB();
    $testName = 'TEST_PRODUCT_' . time();
    
    // Insert test product
    $stmt = $db->prepare("INSERT INTO products (name, category, sku, price, stock, reorder_level) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$testName, 'Test', 'TEST-001', 100.00, 10, 5]);
    $lastId = (int)$db->lastInsertId();
    
    // Verify insert
    $checkStmt = $db->prepare("SELECT * FROM products WHERE id = ?");
    $checkStmt->execute([$lastId]);
    $inserted = $checkStmt->fetch();
    
    if ($inserted) {
        // Delete test product
        $delStmt = $db->prepare("DELETE FROM products WHERE id = ?");
        $delStmt->execute([$lastId]);
        $results['insert_test'] = ['status' => 'success', 'message' => 'Insert/Delete test passed'];
    } else {
        $results['insert_test'] = ['status' => 'error', 'message' => 'Insert verification failed'];
    }
} catch (Exception $e) {
    $results['insert_test'] = ['status' => 'error', 'message' => $e->getMessage()];
}

echo json_encode($results, JSON_PRETTY_PRINT);
?>
