<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT * FROM orders ORDER BY order_date DESC";
    $result = $conn->query($sql);
    
    if ($result) {
        $orders = [];
        while ($row = $result->fetch_assoc()) {
            $orders[] = $row;
        }
        echo json_encode(['success' => true, 'data' => $orders]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}

$conn->close();
?>
