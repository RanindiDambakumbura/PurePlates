import express from 'express';
import mysql from 'mysql2';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const PORT = 3000;

// Middleware
app.use(express.static('.')); // Serve static files from root directory
app.use(bodyParser.json());
app.use(cors());

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Leave empty if no password, or enter your MySQL password
  database: 'resturent_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.connect((err) => {
  if (err) {
    console.error('⚠️ Database connection failed:', err.message);
    console.log('Attempting to reconnect in 5 seconds...');
    setTimeout(() => {
      db.connect((retryErr) => {
        if (retryErr) {
          console.error('❌ Reconnection failed:', retryErr.message);
        } else {
          console.log('✅ Database reconnected successfully');
        }
      });
    }, 5000);
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
  const query = 'INSERT INTO reservations (name, email, phone, reservation_date, reservation_time, guests, occasion, special_requests) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [name, email, phone, reservation_date, reservation_time, guests, occasion, special_requests];

  db.query(query, values, (err, results) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).json({ id: results.insertId, ...req.body });
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
  const { customer_name, customer_email, customer_phone, street_address, city, zip_code, special_instructions, items, total_price, payment_method } = req.body;
  
  // Validate required fields
  if (!customer_name || !customer_email || !customer_phone || !street_address || !city || !zip_code || !items || !total_price || !payment_method) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const query = 'INSERT INTO orders (customer_name, customer_email, customer_phone, street_address, city, zip_code, special_instructions, items, total_price, payment_method, order_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [customer_name, customer_email, customer_phone, street_address, city, zip_code, special_instructions || '', JSON.stringify(items), total_price, payment_method, 'Pending'];

  db.query(query, values, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.status(201).json({ success: true, order_id: results.insertId });
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});