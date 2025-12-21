<?php
// Include database configuration and connection setup
require_once 'config.php';

// Get request URI and method
// Parse the full request URI to extract just the path portion
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
// Get the HTTP method (GET, POST, PUT, DELETE, etc.)
$request_method = $_SERVER['REQUEST_METHOD'];

// Extract the API path
// Check query parameter first (from .htaccess rewrite), then PATH_INFO, then parse from URI
$path = ''; // Initialize path variable
// Check if path is provided as a query parameter (from .htaccess rewrite rule)
if (isset($_GET['path'])) {
    // Remove leading/trailing slashes from the path
    $path = trim($_GET['path'], '/');
} elseif (isset($_SERVER['PATH_INFO'])) {
    // Use PATH_INFO if available (alternative routing method)
    $path = trim($_SERVER['PATH_INFO'], '/');
} else {
    // Extract from REQUEST_URI as fallback
    // Check if URI contains '/api/' pattern
    if (strpos($request_uri, '/api/') !== false) {
        // Extract path after '/api/' (5 characters)
        $path = substr($request_uri, strpos($request_uri, '/api/') + 5);
    } elseif (strpos($request_uri, '/backend/api.php') !== false) {
        // Extract path after '/backend/api.php' (17 characters)
        $path = substr($request_uri, strpos($request_uri, '/backend/api.php') + 17);
        // Remove '/api/' prefix if it exists at the start
        if (strpos($path, '/api/') === 0) {
            $path = substr($path, 5);
        }
    }
}

// Clean up path by removing any remaining slashes
$path = trim($path, '/');
// Split path into array of parts (e.g., 'menu-items/1' becomes ['menu-items', '1'])
$path_parts = !empty($path) ? explode('/', $path) : [];

// Route handling
// Wrap all routes in try-catch for error handling
try {
    // ========== ADMIN AUTHENTICATION ==========
    // Handle admin login endpoint
    if ($path === 'admin/login' && $request_method === 'POST') {
        // Admin Login
        // Read raw JSON input from request body
        $input = file_get_contents('php://input');
        // Decode JSON string to PHP associative array
        $data = json_decode($input, true);
        
        // Validate that required fields are present
        if (!isset($data['username']) || !isset($data['password'])) {
            // Return 400 Bad Request if fields are missing
            http_response_code(400);
            // Send JSON error response
            echo json_encode(['success' => false, 'error' => 'Missing username or password']);
            // Stop execution
            exit();
        }
        
        // Extract username and password from request data
        $username = $data['username'];
        $password = $data['password'];
        
        // Verify credentials
        // Compare with admin credentials from config
        if ($username === ADMIN_USERNAME && $password === ADMIN_PASSWORD) {
            // Set session variables
            // Mark admin as logged in
            $_SESSION['admin_logged_in'] = true;
            // Store admin username in session
            $_SESSION['admin_username'] = $username;
            
            // Generate token for backwards compatibility with frontend
            // Create random token with 'token_' prefix
            $token = 'token_' . bin2hex(random_bytes(16));
            // Initialize tokens array if it doesn't exist
            if (!isset($_SESSION['admin_tokens'])) {
                $_SESSION['admin_tokens'] = [];
            }
            // Add token to session tokens array
            $_SESSION['admin_tokens'][] = $token;
            
            // Return success response with token
            echo json_encode(['success' => true, 'token' => $token]);
        } else {
            // Return 401 Unauthorized for invalid credentials
            http_response_code(401);
            // Send JSON error response
            echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
        }
    }
    // Handle admin logout endpoint
    elseif ($path === 'admin/logout' && $request_method === 'POST') {
        // Admin Logout
        // Clear admin login status
        $_SESSION['admin_logged_in'] = false;
        // Clear admin username
        $_SESSION['admin_username'] = null;
        // Clear all admin tokens
        $_SESSION['admin_tokens'] = [];
        // Destroy the entire session
        session_destroy();
        // Return success response
        echo json_encode(['success' => true]);
    }
    
    // ========== MENU ITEMS ==========
    // Handle GET request to retrieve all menu items
    elseif ($path === 'menu-items' && $request_method === 'GET') {
        // Get all menu items
        // Execute SQL query to fetch all menu items, ordered by category then id
        $stmt = $pdo->query("SELECT * FROM menu_items ORDER BY category, id");
        // Fetch all rows as associative array
        $items = $stmt->fetchAll();
        // Return JSON response with menu items
        echo json_encode(['success' => true, 'items' => $items]);
    }
    // Handle POST request to create a new menu item
    elseif ($path === 'menu-items' && $request_method === 'POST') {
        // Create menu item (Admin only)
        // Verify that user is authenticated as admin
        verifyAdminAuth();
        
        // Read raw JSON input from request body
        $input = file_get_contents('php://input');
        // Decode JSON string to PHP associative array
        $data = json_decode($input, true);
        
        // Validate that all required fields are present
        if (!isset($data['name']) || !isset($data['description']) || !isset($data['price']) || !isset($data['category'])) {
            // Return 400 Bad Request if fields are missing
            http_response_code(400);
            // Send JSON error response
            echo json_encode(['success' => false, 'error' => 'Missing required fields']);
            // Stop execution
            exit();
        }
        
        // Prepare SQL INSERT statement with placeholders
        $stmt = $pdo->prepare("INSERT INTO menu_items (name, description, price, category) VALUES (?, ?, ?, ?)");
        // Execute prepared statement with data values
        $stmt->execute([$data['name'], $data['description'], $data['price'], $data['category']]);
        
        // Return success response with the ID of the newly created item
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    }
    // Handle requests for specific menu item (by ID)
    elseif (isset($path_parts[0]) && $path_parts[0] === 'menu-items' && isset($path_parts[1]) && is_numeric($path_parts[1])) {
        // Extract and convert item ID from path (e.g., 'menu-items/1' -> 1)
        $item_id = intval($path_parts[1]);
        
        // Handle PUT request to update a menu item
        if ($request_method === 'PUT') {
            // Update menu item (Admin only)
            // Verify that user is authenticated as admin
            verifyAdminAuth();
            
            // Read raw JSON input from request body
            $input = file_get_contents('php://input');
            // Decode JSON string to PHP associative array
            $data = json_decode($input, true);
            
            // Validate that all required fields are present
            if (!isset($data['name']) || !isset($data['description']) || !isset($data['price']) || !isset($data['category'])) {
                // Return 400 Bad Request if fields are missing
                http_response_code(400);
                // Send JSON error response
                echo json_encode(['success' => false, 'error' => 'Missing required fields']);
                // Stop execution
                exit();
            }
            
            // Prepare SQL UPDATE statement with placeholders
            $stmt = $pdo->prepare("UPDATE menu_items SET name = ?, description = ?, price = ?, category = ? WHERE id = ?");
            // Execute prepared statement with data values and item ID
            $stmt->execute([$data['name'], $data['description'], $data['price'], $data['category'], $item_id]);
            
            // Return success response
            echo json_encode(['success' => true]);
        }
        // Handle DELETE request to remove a menu item
        elseif ($request_method === 'DELETE') {
            // Delete menu item (Admin only)
            // Verify that user is authenticated as admin
            verifyAdminAuth();
            
            // Prepare SQL DELETE statement with placeholder
            $stmt = $pdo->prepare("DELETE FROM menu_items WHERE id = ?");
            // Execute prepared statement with item ID
            $stmt->execute([$item_id]);
            
            // Return success response
            echo json_encode(['success' => true]);
        }
    }
    
    // ========== ORDERS ==========
    // Handle GET request to retrieve all orders
    elseif ($path === 'orders' && $request_method === 'GET') {
        // Get all orders
        // Execute SQL query to fetch all orders, ordered by date (newest first)
        $stmt = $pdo->query("SELECT * FROM orders ORDER BY order_date DESC");
        // Fetch all rows as associative array
        $orders = $stmt->fetchAll();
        // Return JSON response with orders data
        echo json_encode(['success' => true, 'data' => $orders]);
    }
    // Handle POST request to create a new order
    elseif ($path === 'orders' && $request_method === 'POST') {
        // Create new order
        // Read raw JSON input from request body
        $input = file_get_contents('php://input');
        // Decode JSON string to PHP associative array
        $data = json_decode($input, true);
        
        // Validate that all required fields are present
        if (!isset($data['customer_name']) || !isset($data['customer_email']) || !isset($data['customer_phone']) ||
            !isset($data['street_address']) || !isset($data['city']) || !isset($data['zip_code']) ||
            !isset($data['items']) || !isset($data['total_price']) || !isset($data['payment_method'])) {
            // Return 400 Bad Request if fields are missing
            http_response_code(400);
            // Send JSON error response
            echo json_encode(['success' => false, 'error' => 'Missing required fields']);
            // Stop execution
            exit();
        }
        
        // Convert items array to JSON string for database storage
        $items_json = json_encode($data['items']);
        // Get special instructions if provided, otherwise use empty string
        $special_instructions = isset($data['special_instructions']) ? $data['special_instructions'] : '';
        // Get order status if provided, otherwise default to 'Pending'
        $order_status = isset($data['order_status']) ? $data['order_status'] : 'Pending';
        
        // Prepare SQL INSERT statement with placeholders for all order fields
        $stmt = $pdo->prepare("INSERT INTO orders (customer_name, customer_email, customer_phone, street_address, city, zip_code, special_instructions, items, total_price, payment_method, order_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        // Execute prepared statement with all order data
        $stmt->execute([
            $data['customer_name'],        // Customer's full name
            $data['customer_email'],       // Customer's email address
            $data['customer_phone'],       // Customer's phone number
            $data['street_address'],       // Delivery street address
            $data['city'],                 // Delivery city
            $data['zip_code'],             // Delivery zip/postal code
            $special_instructions,         // Optional special instructions
            $items_json,                   // Order items as JSON string
            $data['total_price'],          // Total order price
            $data['payment_method'],       // Payment method used
            $order_status                  // Order status (default: Pending)
        ]);
        
        // Return success response with the ID of the newly created order
        echo json_encode(['success' => true, 'order_id' => $pdo->lastInsertId()]);
    }
    // Handle requests for specific order (by ID)
    elseif (isset($path_parts[0]) && $path_parts[0] === 'orders' && isset($path_parts[1]) && is_numeric($path_parts[1])) {
        // Extract and convert order ID from path (e.g., 'orders/1' -> 1)
        $order_id = intval($path_parts[1]);
        
        // Handle PUT request to update an order
        if ($request_method === 'PUT') {
            // Update order status (Admin only)
            // Verify that user is authenticated as admin
            verifyAdminAuth();
            
            // Read raw JSON input from request body
            $input = file_get_contents('php://input');
            // Decode JSON string to PHP associative array
            $data = json_decode($input, true);
            
            // Validate that order status is provided
            if (!isset($data['order_status'])) {
                // Return 400 Bad Request if status is missing
                http_response_code(400);
                // Send JSON error response
                echo json_encode(['success' => false, 'error' => 'Missing order status']);
                // Stop execution
                exit();
            }
            
            // Prepare SQL UPDATE statement to change order status
            $stmt = $pdo->prepare("UPDATE orders SET order_status = ? WHERE id = ?");
            // Execute prepared statement with new status and order ID
            $stmt->execute([$data['order_status'], $order_id]);
            
            // Return success response
            echo json_encode(['success' => true]);
        }
        // Handle DELETE request to remove an order
        elseif ($request_method === 'DELETE') {
            // Delete order (Admin only)
            // Verify that user is authenticated as admin
            verifyAdminAuth();
            
            // Prepare SQL DELETE statement with placeholder
            $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
            // Execute prepared statement with order ID
            $stmt->execute([$order_id]);
            
            // Return success response
            echo json_encode(['success' => true]);
        }
    }
    
    // ========== RESERVATIONS ==========
    // Handle GET request to retrieve all reservations (public access)
    elseif ($path === 'reservations' && $request_method === 'GET') {
        // Get all reservations (public)
        // Execute SQL query to fetch all reservations, ordered by date and time (newest first)
        $stmt = $pdo->query("SELECT * FROM reservations ORDER BY reservation_date DESC, reservation_time DESC");
        // Fetch all rows as associative array
        $reservations = $stmt->fetchAll();
        // Return JSON response with reservations data
        echo json_encode(['success' => true, 'data' => $reservations]);
    }
    // Handle GET request to retrieve all reservations (admin-only endpoint)
    elseif ($path === 'reservations-admin' && $request_method === 'GET') {
        // Get all reservations (Admin view)
        // Verify that user is authenticated as admin
        verifyAdminAuth();
        
        // Execute SQL query to fetch all reservations, ordered by date and time (newest first)
        $stmt = $pdo->query("SELECT * FROM reservations ORDER BY reservation_date DESC, reservation_time DESC");
        // Fetch all rows as associative array
        $reservations = $stmt->fetchAll();
        // Return JSON response with reservations (admin format - no wrapper)
        echo json_encode($reservations);
    }
    // Handle POST request to create a new reservation
    elseif ($path === 'reservations' && $request_method === 'POST') {
        // Create new reservation
        // Read raw JSON input from request body
        $input = file_get_contents('php://input');
        // Decode JSON string to PHP associative array
        $data = json_decode($input, true);
        
        // Validate that all required fields are present
        if (!isset($data['name']) || !isset($data['email']) || !isset($data['phone']) ||
            !isset($data['reservation_date']) || !isset($data['guests'])) {
            // Return 400 Bad Request if fields are missing
            http_response_code(400);
            // Send JSON error response
            echo json_encode(['success' => false, 'error' => 'Missing required fields']);
            // Stop execution
            exit();
        }
        
        // Get reservation time if provided, otherwise use empty string
        $reservation_time = isset($data['reservation_time']) ? $data['reservation_time'] : '';
        // Get occasion if provided, otherwise use empty string
        $occasion = isset($data['occasion']) ? $data['occasion'] : '';
        // Get special requests if provided, otherwise use empty string
        $special_requests = isset($data['special_requests']) ? $data['special_requests'] : '';
        
        // Prepare SQL INSERT statement with placeholders for all reservation fields
        $stmt = $pdo->prepare("INSERT INTO reservations (name, email, phone, reservation_date, reservation_time, guests, occasion, special_requests) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        // Execute prepared statement with all reservation data
        $stmt->execute([
            $data['name'],                 // Customer's full name
            $data['email'],                // Customer's email address
            $data['phone'],                // Customer's phone number
            $data['reservation_date'],      // Date of reservation
            $reservation_time,             // Time of reservation (optional)
            intval($data['guests']),       // Number of guests (converted to integer)
            $occasion,                     // Special occasion (optional)
            $special_requests              // Special requests (optional)
        ]);
        
        // Return success response with the ID of the newly created reservation
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId(), 'message' => 'Reservation created successfully']);
    }
    // Handle requests for specific reservation (by ID)
    elseif (isset($path_parts[0]) && $path_parts[0] === 'reservations' && isset($path_parts[1]) && is_numeric($path_parts[1])) {
        // Extract and convert reservation ID from path (e.g., 'reservations/1' -> 1)
        $reservation_id = intval($path_parts[1]);
        
        // Handle PUT request to update a reservation
        if ($request_method === 'PUT') {
            // Update reservation (Admin only)
            // Verify that user is authenticated as admin
            verifyAdminAuth();
            
            // Read raw JSON input from request body
            $input = file_get_contents('php://input');
            // Decode JSON string to PHP associative array
            $data = json_decode($input, true);
            
            // Validate that all required fields are present
            if (!isset($data['name']) || !isset($data['email']) || !isset($data['phone']) ||
                !isset($data['reservation_date']) || !isset($data['reservation_time']) || !isset($data['guests'])) {
                // Return 400 Bad Request if fields are missing
                http_response_code(400);
                // Send JSON error response
                echo json_encode(['success' => false, 'error' => 'Missing required fields']);
                // Stop execution
                exit();
            }
            
            // Get occasion if provided, otherwise use empty string
            $occasion = isset($data['occasion']) ? $data['occasion'] : '';
            // Get special requests if provided, otherwise use empty string
            $special_requests = isset($data['special_requests']) ? $data['special_requests'] : '';
            
            // Prepare SQL UPDATE statement with placeholders for all reservation fields
            $stmt = $pdo->prepare("UPDATE reservations SET name = ?, email = ?, phone = ?, reservation_date = ?, reservation_time = ?, guests = ?, occasion = ?, special_requests = ? WHERE id = ?");
            // Execute prepared statement with all reservation data and reservation ID
            $stmt->execute([
                $data['name'],                 // Customer's full name
                $data['email'],                // Customer's email address
                $data['phone'],                // Customer's phone number
                $data['reservation_date'],      // Date of reservation
                $data['reservation_time'],      // Time of reservation
                intval($data['guests']),       // Number of guests (converted to integer)
                $occasion,                     // Special occasion (optional)
                $special_requests,              // Special requests (optional)
                $reservation_id                // Reservation ID to update
            ]);
            
            // Return success response
            echo json_encode(['success' => true]);
        }
        // Handle DELETE request to remove a reservation
        elseif ($request_method === 'DELETE') {
            // Delete reservation (Admin only)
            // Verify that user is authenticated as admin
            verifyAdminAuth();
            
            // Prepare SQL DELETE statement with placeholder
            $stmt = $pdo->prepare("DELETE FROM reservations WHERE id = ?");
            // Execute prepared statement with reservation ID
            $stmt->execute([$reservation_id]);
            
            // Return success response
            echo json_encode(['success' => true]);
        }
    }
    // Handle case when no route matches the request
    else {
        // Route not found
        // Return 404 Not Found status code
        http_response_code(404);
        // Send JSON error response
        echo json_encode(['success' => false, 'error' => 'Endpoint not found']);
    }
// Catch database-related exceptions
} catch (PDOException $e) {
    // Return 500 Internal Server Error status code
    http_response_code(500);
    // Send JSON error response with database error message
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
// Catch all other exceptions
} catch (Exception $e) {
    // Return 500 Internal Server Error status code
    http_response_code(500);
    // Send JSON error response with general error message
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
// Close PHP tag
?>
