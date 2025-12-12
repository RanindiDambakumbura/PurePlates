<?php
include 'config.php';

$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$request_method = $_SERVER['REQUEST_METHOD'];

// Route handling
if (strpos($request_uri, '/api/orders') !== false) {
    if ($request_method === 'GET') {
        // Get all orders
        $sql = "SELECT * FROM orders ORDER BY order_date DESC";
        $result = $conn->query($sql);
        $orders = [];
        
        while ($row = $result->fetch_assoc()) {
            $orders[] = $row;
        }
        
        echo json_encode(['success' => true, 'data' => $orders]);
    } elseif ($request_method === 'POST') {
        // Create new order
        $data = json_decode(file_get_contents('php://input'), true);
        
        $customer_name = $conn->real_escape_string($data['customer_name']);
        $customer_email = $conn->real_escape_string($data['customer_email']);
        $customer_phone = $conn->real_escape_string($data['customer_phone']);
        $street_address = $conn->real_escape_string($data['street_address']);
        $city = $conn->real_escape_string($data['city']);
        $zip_code = $conn->real_escape_string($data['zip_code']);
        $special_instructions = isset($data['special_instructions']) ? $conn->real_escape_string($data['special_instructions']) : '';
        $items = json_encode($data['items']);
        $total_price = floatval($data['total_price']);
        $payment_method = $conn->real_escape_string($data['payment_method']);
        
        $sql = "INSERT INTO orders (customer_name, customer_email, customer_phone, street_address, city, zip_code, special_instructions, items, total_price, payment_method) 
                VALUES ('$customer_name', '$customer_email', '$customer_phone', '$street_address', '$city', '$zip_code', '$special_instructions', '$items', $total_price, '$payment_method')";
        
        if ($conn->query($sql)) {
            echo json_encode(['success' => true, 'message' => 'Order placed successfully', 'order_id' => $conn->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to place order']);
        }
    }
} elseif (strpos($request_uri, '/api/reservations') !== false) {
    if ($request_method === 'GET') {
        // Get all reservations
        $sql = "SELECT * FROM reservations ORDER BY reservation_date DESC";
        $result = $conn->query($sql);
        $reservations = [];
        
        while ($row = $result->fetch_assoc()) {
            $reservations[] = $row;
        }
        
        echo json_encode(['success' => true, 'data' => $reservations]);
    } elseif ($request_method === 'POST') {
        // Create new reservation
        $data = json_decode(file_get_contents('php://input'), true);
        
        $name = $conn->real_escape_string($data['name']);
        $email = $conn->real_escape_string($data['email']);
        $phone = $conn->real_escape_string($data['phone']);
        $reservation_date = $conn->real_escape_string($data['reservation_date']);
        $reservation_time = $conn->real_escape_string($data['reservation_time']);
        $guests = intval($data['guests']);
        $occasion = isset($data['occasion']) ? $conn->real_escape_string($data['occasion']) : '';
        $special_requests = isset($data['special_requests']) ? $conn->real_escape_string($data['special_requests']) : '';
        
        $sql = "INSERT INTO reservations (name, email, phone, reservation_date, reservation_time, guests, occasion, special_requests) 
                VALUES ('$name', '$email', '$phone', '$reservation_date', '$reservation_time', $guests, '$occasion', '$special_requests')";
        
        if ($conn->query($sql)) {
            echo json_encode(['success' => true, 'message' => 'Reservation created successfully', 'reservation_id' => $conn->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to create reservation']);
        }
    }
} else {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Endpoint not found']);
}

$conn->close();
?>
