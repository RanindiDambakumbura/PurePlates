import express from 'express';
import mysql from 'mysql2';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware - order matters!
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Serve static files from root directory
app.use(express.static(__dirname));

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root@SQL4',
  database: 'resturent_db'
});

db.connect((err) => {
  if (err) {
    console.error('⚠️ Database connection failed:', err.message);
  } else {
    console.log('✅ Connected to the database');
  }
});

// Routes
// Get all reservations
app.get('/api/reservations', (req, res) => {
  db.query('SELECT * FROM reservations', (err, results) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(results);
    }
  });
});

// Create a new reservation
app.post('/api/reservations', (req, res) => {
  const { name, email, phone, reservation_date, reservation_time, guests, occasion, special_requests } = req.body;
  
  // Validate required fields
  if (!name || !email || !phone || !reservation_date || !guests) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const query = 'INSERT INTO reservations (name, email, phone, reservation_date, reservation_time, guests, occasion, special_requests) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [name, email, phone, reservation_date, reservation_time, guests, occasion, special_requests];

  db.query(query, values, (err, results) => {
    if (err) {
      console.error('❌ Reservation insert error:', err.message);
      res.status(500).json({ success: false, error: err.message });
    } else {
      console.log(`✅ Reservation saved with ID: ${results.insertId}`);
      res.status(201).json({ 
        success: true, 
        id: results.insertId,
        message: 'Reservation created successfully'
      });
    }
  });
});

// Get all orders
app.get('/api/orders', (req, res) => {
  db.query('SELECT * FROM orders', (err, results) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(results);
    }
  });
});

// Create a new order
app.post('/api/orders', (req, res) => {
  try {
    console.log('📦 Received order request:', JSON.stringify(req.body));
    
    const { customer_name, customer_email, customer_phone, street_address, city, zip_code, special_instructions, items, total_price, payment_method } = req.body;
    
    // Validate required fields
    if (!customer_name || !customer_email || !customer_phone || !street_address || !city || !zip_code || !items || !total_price || !payment_method) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const query = 'INSERT INTO orders (customer_name, customer_email, customer_phone, street_address, city, zip_code, special_instructions, items, total_price, payment_method, order_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [customer_name, customer_email, customer_phone, street_address, city, zip_code, special_instructions || '', JSON.stringify(items), total_price, payment_method, 'Pending'];

    db.query(query, values, (err, results) => {
      if (err) {
        console.error('❌ Database error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
      console.log('✅ Order saved with ID:', results.insertId);
      res.status(201).json({ success: true, order_id: results.insertId });
    });
  } catch (error) {
    console.error('❌ Server error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== ADMIN AUTHENTICATION ==========
// Simple admin credentials (in production, use proper authentication)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';
const adminSessions = {}; // Store active sessions

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = 'token_' + Math.random().toString(36).substr(2, 9);
    adminSessions[token] = { username, loginTime: new Date() };
    console.log('✅ Admin login successful');
    res.json({ success: true, token });
  } else {
    console.log('❌ Admin login failed');
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

// Middleware to verify admin token
function verifyAdminToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (token && adminSessions[token]) {
    req.adminToken = token;
    next();
  } else {
    res.status(401).json({ success: false, error: 'Unauthorized' });
  }
}

// ========== MENU ITEMS MANAGEMENT ==========
// Get all menu items
app.get('/api/menu-items', (req, res) => {
  db.query('SELECT * FROM menu_items ORDER BY category, id', (err, results) => {
    if (err) {
      console.error('❌ Database error:', err.message);
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.json({ success: true, items: results });
    }
  });
});

// Create a new menu item (Admin only)
app.post('/api/menu-items', verifyAdminToken, (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    
    if (!name || !description || !price || !category) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const query = 'INSERT INTO menu_items (name, description, price, category) VALUES (?, ?, ?, ?)';
    const values = [name, description, price, category];

    db.query(query, values, (err, results) => {
      if (err) {
        console.error('❌ Database error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
      console.log('✅ Menu item created with ID:', results.insertId);
      res.status(201).json({ success: true, id: results.insertId });
    });
  } catch (error) {
    console.error('❌ Server error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update a menu item (Admin only)
app.put('/api/menu-items/:id', verifyAdminToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category } = req.body;
    
    if (!name || !description || !price || !category) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const query = 'UPDATE menu_items SET name = ?, description = ?, price = ?, category = ? WHERE id = ?';
    const values = [name, description, price, category, id];

    db.query(query, values, (err, results) => {
      if (err) {
        console.error('❌ Database error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
      console.log('✅ Menu item updated with ID:', id);
      res.json({ success: true });
    });
  } catch (error) {
    console.error('❌ Server error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a menu item (Admin only)
app.delete('/api/menu-items/:id', verifyAdminToken, (req, res) => {
  try {
    const { id } = req.params;

    const query = 'DELETE FROM menu_items WHERE id = ?';
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error('❌ Database error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
      console.log('✅ Menu item deleted with ID:', id);
      res.json({ success: true });
    });
  } catch (error) {
    console.error('❌ Server error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin Logout
app.post('/api/admin/logout', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token && adminSessions[token]) {
    delete adminSessions[token];
    console.log('✅ Admin logout successful');
    res.json({ success: true });
  } else {
    res.json({ success: false, error: 'Invalid token' });
  }
});

// ========== ORDERS MANAGEMENT (Admin) ==========
// Update order status (Admin only)
app.put('/api/orders/:id', verifyAdminToken, (req, res) => {
  try {
    const { id } = req.params;
    const { order_status } = req.body;
    
    if (!order_status) {
      return res.status(400).json({ success: false, error: 'Missing order status' });
    }

    const query = 'UPDATE orders SET order_status = ? WHERE id = ?';
    db.query(query, [order_status, id], (err, results) => {
      if (err) {
        console.error('❌ Database error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
      console.log('✅ Order status updated:', id);
      res.json({ success: true });
    });
  } catch (error) {
    console.error('❌ Server error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete order (Admin only)
app.delete('/api/orders/:id', verifyAdminToken, (req, res) => {
  try {
    const { id } = req.params;

    const query = 'DELETE FROM orders WHERE id = ?';
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error('❌ Database error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
      console.log('✅ Order deleted with ID:', id);
      res.json({ success: true });
    });
  } catch (error) {
    console.error('❌ Server error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== RESERVATIONS MANAGEMENT ==========
// Get all reservations
app.get('/api/reservations-admin', verifyAdminToken, (req, res) => {
  db.query('SELECT * FROM reservations ORDER BY reservation_date DESC, reservation_time DESC', (err, results) => {
    if (err) {
      console.error('❌ Database error:', err.message);
      res.status(500).json({ success: false, error: err.message });
    } else {
      console.log(`✅ Reservations query returned ${results ? results.length : 0} rows`);
      if (results && results.length > 0) {
        console.log('📊 First reservation:', JSON.stringify(results[0], null, 2));
      }
      res.json(results);
    }
  });
});

// Update reservation (Admin only)
app.put('/api/reservations/:id', verifyAdminToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, reservation_date, reservation_time, guests, occasion, special_requests } = req.body;
    
    if (!name || !email || !phone || !reservation_date || !reservation_time || !guests) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const query = 'UPDATE reservations SET name = ?, email = ?, phone = ?, reservation_date = ?, reservation_time = ?, guests = ?, occasion = ?, special_requests = ? WHERE id = ?';
    const values = [name, email, phone, reservation_date, reservation_time, guests, occasion || '', special_requests || '', id];

    db.query(query, values, (err, results) => {
      if (err) {
        console.error('❌ Database error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
      console.log('✅ Reservation updated with ID:', id);
      res.json({ success: true });
    });
  } catch (error) {
    console.error('❌ Server error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete reservation (Admin only)
app.delete('/api/reservations/:id', verifyAdminToken, (req, res) => {
  try {
    const { id } = req.params;

    const query = 'DELETE FROM reservations WHERE id = ?';
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error('❌ Database error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
      console.log('✅ Reservation deleted with ID:', id);
      res.json({ success: true });
    });
  } catch (error) {
    console.error('❌ Server error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});