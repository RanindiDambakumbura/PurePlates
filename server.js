import express from 'express';
import mysql from 'mysql2';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Replace with your MySQL password
  database: 'resturent_db'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to the database');
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
  const { customer_name, customer_email, customer_phone, items, total_price } = req.body;
  const query = 'INSERT INTO orders (customer_name, customer_email, customer_phone, items, total_price) VALUES (?, ?, ?, ?, ?)';
  const values = [customer_name, customer_email, customer_phone, JSON.stringify(items), total_price];

  db.query(query, values, (err, results) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).json({ id: results.insertId, ...req.body });
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});