<?php
/**
 * BillForge API Health Check
 * Helps diagnose connection issues
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

$response = [
    'status' => 'ok',
    'timestamp' => date('Y-m-d H:i:s'),
    'checks' => []
];

// 1. PHP Version
$response['checks']['php_version'] = [
    'status' => 'ok',
    'value' => phpversion()
];

// 2. Database Connection
try {
    require_once __DIR__ . '/config.php';
    $db = getDB();
    $result = $db->query("SELECT 1")->fetch();
    $response['checks']['database'] = [
        'status' => 'ok',
        'message' => 'Connected to MySQL'
    ];
} catch (Exception $e) {
    $response['status'] = 'error';
    $response['checks']['database'] = [
        'status' => 'error',
        'message' => 'Database connection failed',
        'error' => $e->getMessage()
    ];
}

// 3. Check if tables exist
try {
    if (isset($db)) {
        $tables = $db->query("SHOW TABLES FROM " . DB_NAME)->fetchAll(PDO::FETCH_COLUMN);
        $response['checks']['tables'] = [
            'status' => count($tables) > 0 ? 'ok' : 'warning',
            'count' => count($tables),
            'message' => count($tables) > 0 ? 'Tables exist' : 'No tables found - run init_db.php'
        ];
    }
} catch (Exception $e) {
    $response['checks']['tables'] = [
        'status' => 'error',
        'message' => 'Could not check tables',
        'error' => $e->getMessage()
    ];
}

// 4. API Routing
$response['checks']['api_routing'] = [
    'status' => 'ok',
    'message' => 'Router is responding'
];

http_response_code($response['status'] === 'ok' ? 200 : 500);
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
