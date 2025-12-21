-- Create the database
-- Create database if it doesn't already exist (prevents errors on re-run)
CREATE DATABASE IF NOT EXISTS resturent_db;
-- Switch to the created database for subsequent operations
USE resturent_db;

-- Create a table for reservations
-- Table to store customer table reservation information
CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,           -- Auto-incrementing unique identifier
    name VARCHAR(100) NOT NULL,                  -- Customer's full name (required)
    email VARCHAR(100) NOT NULL,                 -- Customer's email address (required)
    phone VARCHAR(15) NOT NULL,                  -- Customer's phone number (required)
    reservation_date DATE NOT NULL,              -- Date of the reservation (required)
    reservation_time TIME NOT NULL,              -- Time of the reservation (required)
    guests INT NOT NULL,                         -- Number of guests (required)
    occasion VARCHAR(50),                        -- Special occasion type (optional)
    special_requests TEXT,                      -- Additional special requests (optional)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Timestamp when record was created
);

-- Create a table for menu items
-- Table to store restaurant menu items with details
CREATE TABLE IF NOT EXISTS menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,           -- Auto-incrementing unique identifier
    name VARCHAR(100) NOT NULL,                 -- Menu item name (required)
    description TEXT,                           -- Detailed description of the item (optional)
    price DECIMAL(10, 2) NOT NULL,              -- Item price with 2 decimal places (required)
    category VARCHAR(50),                        -- Item category (e.g., Appetizers, Main Courses)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Timestamp when record was created
);

-- Create a table for users (optional, for admin or staff management)
-- Table to store user accounts for admin and staff access
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,           -- Auto-incrementing unique identifier
    username VARCHAR(50) NOT NULL UNIQUE,        -- Unique username for login (required, must be unique)
    password_hash VARCHAR(255) NOT NULL,         -- Hashed password for security (required)
    role ENUM('admin', 'staff') DEFAULT 'staff', -- User role with default 'staff'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Timestamp when record was created
);

-- Create a table for online orders
-- Table to store customer online food orders
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,           -- Auto-incrementing unique identifier
    customer_name VARCHAR(100) NOT NULL,        -- Customer's full name (required)
    customer_email VARCHAR(100) NOT NULL,        -- Customer's email address (required)
    customer_phone VARCHAR(15) NOT NULL,        -- Customer's phone number (required)
    street_address VARCHAR(255) NOT NULL,        -- Delivery street address (required)
    city VARCHAR(100) NOT NULL,                 -- Delivery city (required)
    zip_code VARCHAR(10) NOT NULL,                  -- Postal/ZIP code (required)
    special_instructions TEXT,                   -- Special delivery instructions (optional)
    items JSON NOT NULL,                         -- Order items stored as JSON array (required)
    total_price DECIMAL(10, 2) NOT NULL,         -- Total order price with 2 decimal places (required)
    payment_method VARCHAR(50) NOT NULL,          -- Payment method used (required)
    order_status ENUM('pending', 'confirmed', 'delivered', 'cancelled') DEFAULT 'pending', -- Order status with default 'pending'
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Timestamp when order was placed
);