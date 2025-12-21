<?php
require_once 'config.php';

// Get request URI and method
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$request_method = $_SERVER['REQUEST_METHOD'];

// Extract the API path
// Check query parameter first (from .htaccess rewrite), then PATH_INFO, then parse from URI
$path = '';
if (isset($_GET['path'])) {
    $path = trim($_GET['path'], '/');
} elseif (isset($_SERVER['PATH_INFO'])) {
    $path = trim($_SERVER['PATH_INFO'], '/');
} else {
    // Extract from REQUEST_URI
    if (strpos($request_uri, '/api/') !== false) {
        $path = substr($request_uri, strpos($request_uri, '/api/') + 5);
    } elseif (strpos($request_uri, '/backend/api.php') !== false) {
        $path = substr($request_uri, strpos($request_uri, '/backend/api.php') + 17);
        if (strpos($path, '/api/') === 0) {
            $path = substr($path, 5);
        }
    }
}

$path = trim($path, '/');
$path_parts = !empty($path) ? explode('/', $path) : [];

// Route handling
try {
    // ========== ADMIN AUTHENTICATION ==========
    if ($path === 'admin/login' && $request_method === 'POST') {
        // Admin Login
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!isset($data['username']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Missing username or password']);
            exit();
        }
        
        $username = $data['username'];
        $password = $data['password'];
        
        // Verify credentials
        if ($username === ADMIN_USERNAME && $password === ADMIN_PASSWORD) {
            // Set session variables
            $_SESSION['admin_logged_in'] = true;
            $_SESSION['admin_username'] = $username;
            
            // Generate token for backwards compatibility with frontend
            $token = 'token_' . bin2hex(random_bytes(16));
            if (!isset($_SESSION['admin_tokens'])) {
                $_SESSION['admin_tokens'] = [];
            }
            $_SESSION['admin_tokens'][] = $token;
            
            echo json_encode(['success' => true, 'token' => $token]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
        }
    }
    elseif ($path === 'admin/logout' && $request_method === 'POST') {
        // Admin Logout
        $_SESSION['admin_logged_in'] = false;
        $_SESSION['admin_username'] = null;
        $_SESSION['admin_tokens'] = [];
        session_destroy();
        echo json_encode(['success' => true]);
    }
    
    // ========== MENU ITEMS ==========
    elseif ($path === 'menu-items' && $request_method === 'GET') {
        // Get all menu items
        $stmt = $pdo->query("SELECT * FROM menu_items ORDER BY category, id");
        $items = $stmt->fetchAll();
        echo json_encode(['success' => true, 'items' => $items]);
    }
    elseif ($path === 'menu-items' && $request_method === 'POST') {
        // Create menu item (Admin only)
        verifyAdminAuth();
        
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!isset($data['name']) || !isset($data['description']) || !isset($data['price']) || !isset($data['category'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Missing required fields']);
            exit();
        }
        
        $stmt = $pdo->prepare("INSERT INTO menu_items (name, description, price, category) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data['name'], $data['description'], $data['price'], $data['category']]);
        
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    }
    elseif (isset($path_parts[0]) && $path_parts[0] === 'menu-items' && isset($path_parts[1]) && is_numeric($path_parts[1])) {
        $item_id = intval($path_parts[1]);
        
        if ($request_method === 'PUT') {
            // Update menu item (Admin only)
            verifyAdminAuth();
            
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!isset($data['name']) || !isset($data['description']) || !isset($data['price']) || !isset($data['category'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Missing required fields']);
                exit();
            }
            
            $stmt = $pdo->prepare("UPDATE menu_items SET name = ?, description = ?, price = ?, category = ? WHERE id = ?");
            $stmt->execute([$data['name'], $data['description'], $data['price'], $data['category'], $item_id]);
            
            echo json_encode(['success' => true]);
        }
        elseif ($request_method === 'DELETE') {
            // Delete menu item (Admin only)
            verifyAdminAuth();
            
            $stmt = $pdo->prepare("DELETE FROM menu_items WHERE id = ?");
            $stmt->execute([$item_id]);
            
            echo json_encode(['success' => true]);
        }
    }
    
    // ========== ORDERS ==========
    elseif ($path === 'orders' && $request_method === 'GET') {
        // Get all orders
        $stmt = $pdo->query("SELECT * FROM orders ORDER BY order_date DESC");
        $orders = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $orders]);
    }
    elseif ($path === 'orders' && $request_method === 'POST') {
        // Create new order
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!isset($data['customer_name']) || !isset($data['customer_email']) || !isset($data['customer_phone']) ||
            !isset($data['street_address']) || !isset($data['city']) || !isset($data['zip_code']) ||
            !isset($data['items']) || !isset($data['total_price']) || !isset($data['payment_method'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Missing required fields']);
            exit();
        }
        
        $items_json = json_encode($data['items']);
        $special_instructions = isset($data['special_instructions']) ? $data['special_instructions'] : '';
        $order_status = isset($data['order_status']) ? $data['order_status'] : 'Pending';
        
        $stmt = $pdo->prepare("INSERT INTO orders (customer_name, customer_email, customer_phone, street_address, city, zip_code, special_instructions, items, total_price, payment_method, order_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['customer_name'],
            $data['customer_email'],
            $data['customer_phone'],
            $data['street_address'],
            $data['city'],
            $data['zip_code'],
            $special_instructions,
            $items_json,
            $data['total_price'],
            $data['payment_method'],
            $order_status
        ]);
        
        echo json_encode(['success' => true, 'order_id' => $pdo->lastInsertId()]);
    }
    elseif (isset($path_parts[0]) && $path_parts[0] === 'orders' && isset($path_parts[1]) && is_numeric($path_parts[1])) {
        $order_id = intval($path_parts[1]);
        
        if ($request_method === 'PUT') {
            // Update order status (Admin only)
            verifyAdminAuth();
            
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!isset($data['order_status'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Missing order status']);
                exit();
            }
            
            $stmt = $pdo->prepare("UPDATE orders SET order_status = ? WHERE id = ?");
            $stmt->execute([$data['order_status'], $order_id]);
            
            echo json_encode(['success' => true]);
        }
        elseif ($request_method === 'DELETE') {
            // Delete order (Admin only)
            verifyAdminAuth();
            
            $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
            $stmt->execute([$order_id]);
            
            echo json_encode(['success' => true]);
        }
    }
    
    // ========== RESERVATIONS ==========
    elseif ($path === 'reservations' && $request_method === 'GET') {
        // Get all reservations (public)
        $stmt = $pdo->query("SELECT * FROM reservations ORDER BY reservation_date DESC, reservation_time DESC");
        $reservations = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $reservations]);
    }
    elseif ($path === 'reservations-admin' && $request_method === 'GET') {
        // Get all reservations (Admin view)
        verifyAdminAuth();
        
        $stmt = $pdo->query("SELECT * FROM reservations ORDER BY reservation_date DESC, reservation_time DESC");
        $reservations = $stmt->fetchAll();
        echo json_encode($reservations);
    }
    elseif ($path === 'reservations' && $request_method === 'POST') {
        // Create new reservation
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!isset($data['name']) || !isset($data['email']) || !isset($data['phone']) ||
            !isset($data['reservation_date']) || !isset($data['guests'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Missing required fields']);
            exit();
        }
        
        $reservation_time = isset($data['reservation_time']) ? $data['reservation_time'] : '';
        $occasion = isset($data['occasion']) ? $data['occasion'] : '';
        $special_requests = isset($data['special_requests']) ? $data['special_requests'] : '';
        
        $stmt = $pdo->prepare("INSERT INTO reservations (name, email, phone, reservation_date, reservation_time, guests, occasion, special_requests) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['name'],
            $data['email'],
            $data['phone'],
            $data['reservation_date'],
            $reservation_time,
            intval($data['guests']),
            $occasion,
            $special_requests
        ]);
        
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId(), 'message' => 'Reservation created successfully']);
    }
    elseif (isset($path_parts[0]) && $path_parts[0] === 'reservations' && isset($path_parts[1]) && is_numeric($path_parts[1])) {
        $reservation_id = intval($path_parts[1]);
        
        if ($request_method === 'PUT') {
            // Update reservation (Admin only)
            verifyAdminAuth();
            
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!isset($data['name']) || !isset($data['email']) || !isset($data['phone']) ||
                !isset($data['reservation_date']) || !isset($data['reservation_time']) || !isset($data['guests'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Missing required fields']);
                exit();
            }
            
            $occasion = isset($data['occasion']) ? $data['occasion'] : '';
            $special_requests = isset($data['special_requests']) ? $data['special_requests'] : '';
            
            $stmt = $pdo->prepare("UPDATE reservations SET name = ?, email = ?, phone = ?, reservation_date = ?, reservation_time = ?, guests = ?, occasion = ?, special_requests = ? WHERE id = ?");
            $stmt->execute([
                $data['name'],
                $data['email'],
                $data['phone'],
                $data['reservation_date'],
                $data['reservation_time'],
                intval($data['guests']),
                $occasion,
                $special_requests,
                $reservation_id
            ]);
            
            echo json_encode(['success' => true]);
        }
        elseif ($request_method === 'DELETE') {
            // Delete reservation (Admin only)
            verifyAdminAuth();
            
            $stmt = $pdo->prepare("DELETE FROM reservations WHERE id = ?");
            $stmt->execute([$reservation_id]);
            
            echo json_encode(['success' => true]);
        }
    }
    else {
        // Route not found
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Endpoint not found']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>
