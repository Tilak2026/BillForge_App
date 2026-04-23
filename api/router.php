<?php
/**
 * BillForge API Router
 * Routes /api/{resource} to the correct PHP handler file.
 *
 * All requests matching /api/* arrive here via .htaccess rewrite.
 * URL format: /BillForge_App/api/products
 *             /BillForge_App/api/products/5
 *             /BillForge_App/api/purchases/3/receive
 */
require_once __DIR__ . '/config.php';

$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts  = array_values(array_filter(explode('/', $uri)));

// Find the segment after 'api'
$resource = null;
foreach ($parts as $i => $part) {
    if ($part === 'api' && isset($parts[$i + 1])) {
        $resource = $parts[$i + 1];
        break;
    }
}

$handlers = [
    'health'     => __DIR__ . '/health.php',
    'login'      => __DIR__ . '/login.php',
    'products'   => __DIR__ . '/products.php',
    'customers'  => __DIR__ . '/customers.php',
    'invoices'   => __DIR__ . '/invoices.php',
    'expenses'   => __DIR__ . '/expenses.php',
    'quotations' => __DIR__ . '/quotations.php',
    'purchases'  => __DIR__ . '/purchases.php',
];

if ($resource && isset($handlers[$resource])) {
    require $handlers[$resource];
} else {
    http_response_code(404);
    jsonResponse(['error' => 'API endpoint not found: ' . ($resource ?? 'none')], 404);
}
