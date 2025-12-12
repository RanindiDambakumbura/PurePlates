<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration
$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'resturent_db';

// Create connection
$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $conn->connect_error]);
    exit();
}

$conn->set_charset("utf8");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get the raw JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // Validate that JSON was decoded properly
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON input: ' . json_last_error_msg()]);
        exit();
    }
    
    // Validate required fields
    if (!isset($data['customer_name']) || !isset($data['customer_email']) || !isset($data['customer_phone']) ||
        !isset($data['street_address']) || !isset($data['city']) || !isset($data['zip_code']) ||
        !isset($data['items']) || !isset($data['total_price']) || !isset($data['payment_method'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing required fields']);
        exit();
    }
    
    // Sanitize and prepare data
    $customer_name = $conn->real_escape_string($data['customer_name']);
    $customer_email = $conn->real_escape_string($data['customer_email']);
    $customer_phone = $conn->real_escape_string($data['customer_phone']);
    $street_address = $conn->real_escape_string($data['street_address']);
    $city = $conn->real_escape_string($data['city']);
    $zip_code = $conn->real_escape_string($data['zip_code']);
    $special_instructions = isset($data['special_instructions']) ? $conn->real_escape_string($data['special_instructions']) : '';
    $items = $conn->real_escape_string(json_encode($data['items']));
    $total_price = floatval($data['total_price']);
    $payment_method = $conn->real_escape_string($data['payment_method']);
    
    // Insert order into database
    $sql = "INSERT INTO orders (customer_name, customer_email, customer_phone, street_address, city, zip_code, special_instructions, items, total_price, payment_method) 
            VALUES ('$customer_name', '$customer_email', '$customer_phone', '$street_address', '$city', '$zip_code', '$special_instructions', '$items', $total_price, '$payment_method')";
    
    if ($conn->query($sql)) {
        $order_id = $conn->insert_id;
        echo json_encode(['success' => true, 'message' => 'Order placed successfully', 'order_id' => $order_id]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]);
    }
    
    $conn->close();
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
?>
