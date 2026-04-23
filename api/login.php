<?php
/**
 * BillForge — Login API Endpoint
 * POST /api/login
 * Request: { email, password }
 * Response: { id, email, name, role, avatar } or { error }
 */
require_once __DIR__ . '/config.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    jsonResponse(['error' => 'Method not allowed. Use POST.'], 405);
    exit;
}

// Get JSON body
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['email']) || !isset($input['password'])) {
    http_response_code(400);
    jsonResponse(['error' => 'Missing email or password'], 400);
    exit;
}

$email = trim(strtolower($input['email']));
$password = $input['password'];

try {
    $db = getDB();
    
    // Query user by email
    $stmt = $db->prepare("SELECT id, email, password, name, role, avatar FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(401);
        jsonResponse(['error' => 'Invalid credentials'], 401);
        exit;
    }
    
    // Verify password
    if (!password_verify($password, $user['password'])) {
        http_response_code(401);
        jsonResponse(['error' => 'Invalid credentials'], 401);
        exit;
    }
    
    // Remove password hash from response
    unset($user['password']);
    
    // Return user data
    jsonResponse($user, 200);
    
} catch (PDOException $e) {
    error_log('Login query error: ' . $e->getMessage());
    http_response_code(500);
    jsonResponse(['error' => 'Database error'], 500);
}
