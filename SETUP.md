# PurePlates - Setup Guide

## Project Structure

```
PurePlates/
├── index.html
├── menu.html
├── about.html
├── reservations.html
├── style.css
├── main.js
├── counter.js
├── reservations.js
├── package.json
├── README.md
├── public/
│   └── hero-background.jpg
├── database/
│   └── resturent_db.sql
└── backend/
    ├── config.php
    ├── api.php
    ├── place_order.php
    └── get_orders.php
```

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: PHP
- **Database**: MySQL

## Installation Steps

### 1. Database Setup

1. Open your MySQL client (phpMyAdmin or MySQL Command Line)
2. Run the SQL script from `database/resturent_db.sql`:
   ```bash
   mysql -u root -p < database/resturent_db.sql
   ```
3. This will create the `resturent_db` database with all necessary tables

### 2. Server Configuration

#### Option A: Using XAMPP/WAMP/LAMP

1. Copy the entire PurePlates folder to:
   - **XAMPP**: `C:\xampp\htdocs\PurePlates`
   - **WAMP**: `C:\wamp\www\PurePlates`
   - **LAMP**: `/var/www/html/PurePlates`

2. Start Apache and MySQL services

3. Access the application at: `http://localhost/PurePlates/`

#### Option B: Using PHP Built-in Server

```bash
cd PurePlates
php -S localhost:8000
```

Access at: `http://localhost:8000/`

### 3. Database Configuration

Edit `backend/config.php` if needed:

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');  // Set your MySQL password
define('DB_NAME', 'resturent_db');
```

## Features

### Frontend (HTML, CSS, JS)
- Responsive design
- Shopping cart functionality
- Order management
- Reservation system
- Payment options popup
- Delivery details collection

### Backend (PHP)
- REST API endpoints
- Order management
- Reservation handling
- Database integration
- CORS support

### Database (MySQL)
- Reservations table
- Menu items table
- Orders table
- Users table (for admin)

## API Endpoints

### Orders

**GET** `/backend/get_orders.php`
- Retrieve all orders

**POST** `/backend/place_order.php`
- Create a new order
- Required fields: customer_name, customer_email, customer_phone, street_address, city, zip_code, items, total_price, payment_method

### Reservations

**GET** `/backend/api.php` (with `/api/reservations`)
- Retrieve all reservations

**POST** `/backend/api.php` (with `/api/reservations`)
- Create a new reservation

## Usage

1. **Menu Page**: Browse items and add to cart
2. **Checkout Process**:
   - Click "Proceed to Checkout"
   - Enter delivery details
   - Select payment method
   - Order confirmation

3. **Reservations**: Book a table through the reservations page

## Notes

- All prices are displayed in Indian Rupees (Rs.)
- Orders are stored with JSON items data
- Delivery details are collected before payment
- CORS is enabled for cross-origin requests
