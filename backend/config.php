<?php
// Start session for authentication
// Check if a session has not been started yet
if (session_status() === PHP_SESSION_NONE) {
    // Start a new session to store user authentication data
    session_start();
}

// Database configuration
// Define database host (localhost for local development)
define('DB_HOST', 'localhost');
// Define database username
define('DB_USER', 'root');
// Define database password
define('DB_PASS', 'root@SQL4');
// Define database name
define('DB_NAME', 'resturent_db');

// Create PDO connection
// Wrap database connection in try-catch to handle errors gracefully
try {
    // Create new PDO instance for database connection
    $pdo = new PDO(
        // MySQL connection string with host, database name, and charset
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        // Database username
        DB_USER,
        // Database password
        DB_PASS,
        // PDO options array
        [
            // Set error mode to throw exceptions on errors
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            // Set default fetch mode to return associative arrays
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            // Disable prepared statement emulation for better security
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    // Set HTTP response code to 500 (Internal Server Error)
    http_response_code(500);
    // Set response header to indicate JSON content
    header('Content-Type: application/json');
    // Return JSON error response
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    // Stop script execution
    exit();
}

// Allow CORS (Cross-Origin Resource Sharing)
// Allow requests from any origin (for development; restrict in production)
header('Access-Control-Allow-Origin: *');
// Allow specified HTTP methods
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
// Allow specified headers in requests
header('Access-Control-Allow-Headers: Content-Type, Authorization');
// Allow credentials to be sent with requests
header('Access-Control-Allow-Credentials: true');
// Set default content type to JSON
header('Content-Type: application/json');

// Handle preflight requests
// CORS preflight requests use OPTIONS method
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Return 200 OK for preflight requests
    http_response_code(200);
    // Stop execution after handling preflight
    exit();
}

// Admin credentials (in production, store in database with hashed passwords)
// Define admin username constant
define('ADMIN_USERNAME', 'admin');
// Define admin password constant (should be hashed in production)
define('ADMIN_PASSWORD', 'admin123');

/**
 * Check if admin is logged in
 * @return bool Returns true if admin is logged in, false otherwise
 */
function isAdminLoggedIn() {
    // Check if session variable exists and is set to true
    return isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
}

/**
 * Get all HTTP headers (compatible with all PHP environments)
 * @return array Associative array of HTTP headers
 */
function getAllHeaders() {
    // Check if getallheaders() function is available (works on Apache)
    if (function_exists('getallheaders')) {
        // Return headers using built-in function
        return getallheaders();
    }
    
    // Fallback for environments where getallheaders() is not available (e.g., Nginx)
    // Initialize empty array to store headers
    $headers = [];
    // Loop through all server variables
    foreach ($_SERVER as $name => $value) {
        // Check if variable name starts with 'HTTP_' (HTTP headers are prefixed this way)
        if (substr($name, 0, 5) == 'HTTP_') {
            // Convert header name from HTTP_HEADER_NAME to Header-Name format
            // Remove 'HTTP_' prefix, replace underscores with spaces, capitalize words, then replace spaces with hyphens
            $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
        }
    }
    // Return constructed headers array
    return $headers;
}

/**
 * Verify admin authentication for protected routes
 * Supports both session-based and token-based (for backwards compatibility)
 * @return void Exits with 401 error if not authenticated
 */
function verifyAdminAuth() {
    // Check session first (primary method)
    // If admin is logged in via session, allow access
    if (isAdminLoggedIn()) {
        // Return true to allow request to proceed
        return true;
    }
    
    // Fallback: Check Authorization header for token (backwards compatibility)
    // Get all HTTP headers
    $headers = getAllHeaders();
    // Check if Authorization header exists
    if (isset($headers['Authorization'])) {
        // Get the authorization header value
        $authHeader = $headers['Authorization'];
        // Match Bearer token pattern (Bearer <token>)
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            // Extract token from matches array (first capture group)
            $token = $matches[1];
            // Check if token exists in session tokens array (for backwards compatibility)
            if (isset($_SESSION['admin_tokens']) && in_array($token, $_SESSION['admin_tokens'])) {
                // Token is valid, allow access
                return true;
            }
        }
    }
    
    // If no valid authentication found, deny access
    // Set HTTP response code to 401 (Unauthorized)
    http_response_code(401);
    // Return JSON error response
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    // Stop script execution
    exit();
}
?>
