<?php
/**
 * BillForge — Data Cleanup Script
 * Removes all data from specified tables
 */
require_once __DIR__ . '/config.php';

$db = getDB();

try {
    // Disable foreign key checks to allow deletion
    $db->exec("SET FOREIGN_KEY_CHECKS=0");
    
    // Tables to clear
    $tables = [
        'invoices',
        'customers',
        'quotations',
        'purchases',
        'expenses',
        'reports',
        'gst_return'
    ];
    
    $results = [];
    
    foreach ($tables as $table) {
        try {
            $stmt = $db->prepare("DELETE FROM $table");
            $stmt->execute();
            $rowCount = $stmt->rowCount();
            $results[$table] = [
                'status' => 'success',
                'rows_deleted' => $rowCount
            ];
        } catch (PDOException $e) {
            // Table may not exist, continue with others
            $results[$table] = [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }
    
    // Re-enable foreign key checks
    $db->exec("SET FOREIGN_KEY_CHECKS=1");
    
    // Reset auto-increment for each table
    foreach ($tables as $table) {
        try {
            $db->exec("ALTER TABLE $table AUTO_INCREMENT = 1");
        } catch (PDOException $e) {
            // Table may not exist, continue
        }
    }
    
    jsonResponse([
        'message' => 'Data cleanup completed',
        'results' => $results
    ]);
    
} catch (Exception $e) {
    error_log('Cleanup error: ' . $e->getMessage());
    jsonResponse(['error' => 'Cleanup failed: ' . $e->getMessage()], 500);
}
?>
