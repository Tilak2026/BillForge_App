<?php
/**
 * BillForge — Dashboard Data Verification
 * Shows what data is currently in the database
 */
require_once __DIR__ . '/config.php';

header('Content-Type: application/json');

$db = getDB();

try {
    // Get current data counts
    $invoices = $db->query("SELECT COUNT(*) as count FROM invoices")->fetch()['count'];
    $customers = $db->query("SELECT COUNT(*) as count FROM customers")->fetch()['count'];
    $products = $db->query("SELECT COUNT(*) as count FROM products")->fetch()['count'];
    $expenses = $db->query("SELECT COUNT(*) as count FROM expenses")->fetch()['count'];
    $purchases = $db->query("SELECT COUNT(*) as count FROM purchases")->fetch()['count'];
    $quotations = $db->query("SELECT COUNT(*) as count FROM quotations")->fetch()['count'];
    
    // Calculate total revenue
    $revenue = $db->query("
        SELECT COALESCE(SUM(CAST(
            REGEXP_SUBSTR(SUBSTRING_INDEX(items, '\"price\":', -1), '[0-9.]+') * 
            REGEXP_SUBSTR(SUBSTRING_INDEX(SUBSTRING_INDEX(items, '\"qty\":', -1), ',', 1), '[0-9.]+')
        AS DECIMAL(12,2))), 0) as total
        FROM invoices WHERE status = 'Paid'
    ")->fetch()['total'];
    
    // Top categories by revenue
    $categories = $db->query("
        SELECT cat, COUNT(*) as count, SUM(CAST(price AS DECIMAL(10,2)) * stock) as value
        FROM products
        GROUP BY cat
        ORDER BY value DESC
        LIMIT 10
    ")->fetchAll();
    
    $result = [
        'status' => 'connected',
        'timestamp' => date('Y-m-d H:i:s'),
        'database' => 'billforge',
        'tables' => [
            'invoices' => (int)$invoices,
            'customers' => (int)$customers,
            'products' => (int)$products,
            'expenses' => (int)$expenses,
            'purchases' => (int)$purchases,
            'quotations' => (int)$quotations
        ],
        'summary' => [
            'total_revenue' => (float)$revenue,
            'total_products' => (int)$products,
            'total_customers' => (int)$customers
        ],
        'category_breakdown' => $categories,
        'dashboard_status' => [
            'revenue_chart' => (int)$invoices > 0 ? 'Will show data when invoices added' : 'Empty',
            'category_chart' => (int)$products > 0 ? 'Will show data' : 'Empty (but products exist)',
            'daily_chart' => (int)$invoices > 0 ? 'Will show data when invoices added' : 'Empty'
        ]
    ];
    
    echo json_encode($result, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>
