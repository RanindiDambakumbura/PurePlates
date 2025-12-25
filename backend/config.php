<?php
// CORS headers (allow all origins for development; restrict in production)
header("Access-Control-Allow-Origin: https://ranindidambakumbura.github.io");
header("Access-Control-Allow-Origin: http://pureplates.ct.ws/");
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Start session for authentication
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Database configuration
define('DB_HOST', 'sql103.infinityfree.com');
define('DB_USER', 'if0_40760701');
define('DB_PASS', 'cd4wViTHwqv');
define('DB_NAME', 'if0_40760701_resturent_db');

// Create PDO connection with error handling
try {
    $pdo = new PDO(
        // Include explicit port and correct charset key
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false  // Disable emulation for better security
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit();
}



// Handle CORS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Admin credentials (in production, store in database with hashed passwords)
define('ADMIN_USERNAME', 'admin');
define('ADMIN_PASSWORD', 'admin123');

/**
 * Check if admin is logged in
 */
function isAdminLoggedIn() {
    return isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
}

/**
 * Get all HTTP headers (compatible with all PHP environments)
 * Fallback for Nginx where getallheaders() may not be available
 */
function getAllHeaders() {
    if (function_exists('getallheaders')) {
        return getallheaders();
    }
    
    // Fallback: Parse headers from $_SERVER (HTTP_* variables)
    $headers = [];
    foreach ($_SERVER as $name => $value) {
        if (substr($name, 0, 5) == 'HTTP_') {
            // Convert HTTP_HEADER_NAME to Header-Name format
            $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
        }
    }
    return $headers;
}

/**
 * Verify admin authentication for protected routes
 * Supports both session-based and token-based (for backwards compatibility)
 */
function verifyAdminAuth() {
    if (isAdminLoggedIn()) {
        return true;
    }
    
    // Fallback: Check Authorization header for token (backwards compatibility)
    $headers = getAllHeaders();
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $token = $matches[1];
            if (isset($_SESSION['admin_tokens']) && in_array($token, $_SESSION['admin_tokens'])) {
                return true;
            }
        }
    }
    
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit();
}
?>
