<?php
/**
 * BillForge — Selective Data Cleanup
 * Remove all data EXCEPT invoices and products
 */
require_once __DIR__ . '/config.php';

header('Content-Type: application/json');

$db = getDB();

try {
    // Disable foreign key checks to allow deletion
    $db->exec("SET FOREIGN_KEY_CHECKS=0");
    
    // Tables to DELETE (remove all data)
    $tablesToDelete = [
        'customers',
        'quotations',
        'purchases',
        'expenses',
        'reports',
        'gst_return'
    ];
    
    $results = [];
    
    foreach ($tablesToDelete as $table) {
        try {
            $stmt = $db->prepare("DELETE FROM $table");
            $stmt->execute();
            $rowCount = $stmt->rowCount();
            $results[$table] = [
                'status' => 'deleted',
                'rows_removed' => $rowCount
            ];
        } catch (PDOException $e) {
            // Table may not exist, continue with others
            $results[$table] = [
                'status' => 'not_found',
                'message' => 'Table does not exist'
            ];
        }
    }
    
    // Reset auto-increment for deleted tables
    foreach ($tablesToDelete as $table) {
        try {
            $db->exec("ALTER TABLE $table AUTO_INCREMENT = 1");
        } catch (PDOException $e) {
            // Table may not exist, continue
        }
    }
    
    // Re-enable foreign key checks
    $db->exec("SET FOREIGN_KEY_CHECKS=1");
    
    // Get current data counts for verification
    $invoices = $db->query("SELECT COUNT(*) as count FROM invoices")->fetch()['count'];
    $products = $db->query("SELECT COUNT(*) as count FROM products")->fetch()['count'];
    
    $results['verification'] = [
        'status' => 'success',
        'invoices_kept' => (int)$invoices,
        'products_kept' => (int)$products,
        'message' => 'Data cleanup completed successfully'
    ];
    
    jsonResponse($results);
    
} catch (Exception $e) {
    error_log('Cleanup error: ' . $e->getMessage());
    jsonResponse(['error' => 'Cleanup failed: ' . $e->getMessage()], 500);
}
?>
