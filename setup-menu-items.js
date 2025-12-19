import mysql from 'mysql2';

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root@SQL4',
  database: 'resturent_db'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to the database');
  populateMenuItems();
});

const menuItems = [
  // Appetizers
  { name: 'Garden Fresh Salad', description: 'Mixed greens, cherry tomatoes, cucumber, and balsamic vinaigrette', price: 1200, category: 'Appetizers' },
  { name: 'Quinoa Bowl', description: 'Organic quinoa with roasted vegetables and tahini dressing', price: 1400, category: 'Appetizers' },
  { name: 'Avocado Toast', description: 'Smashed avocado on artisan bread with cherry tomatoes', price: 1100, category: 'Appetizers' },
  
  // Main Courses
  { name: 'Grilled Salmon', description: 'Wild-caught salmon with seasonal vegetables and lemon butter', price: 2800, category: 'Main Courses' },
  { name: 'Herb Chicken', description: 'Free-range chicken breast with herb sauce and roasted potatoes', price: 2400, category: 'Main Courses' },
  { name: 'Vegetable Pasta', description: 'Fresh pasta with seasonal vegetables and pesto sauce', price: 2200, category: 'Main Courses' },
  { name: 'Grass-Fed Steak', description: 'Premium cut with garlic butter and seasonal greens', price: 3200, category: 'Main Courses' },
  
  // Desserts
  { name: 'Fresh Fruit Platter', description: 'Seasonal fruits with honey yogurt dip', price: 1000, category: 'Desserts' },
  { name: 'Dark Chocolate Mousse', description: 'Rich dark chocolate mousse with fresh berries', price: 1200, category: 'Desserts' },
  { name: 'Lemon Tart', description: 'Homemade lemon tart with meringue topping', price: 1100, category: 'Desserts' },
  
  // Beverages
  { name: 'Fresh Juices', description: 'Orange, apple, carrot, or green detox blend', price: 600, category: 'Beverages' },
  { name: 'Organic Coffee', description: 'Espresso, cappuccino, or latte', price: 500, category: 'Beverages' },
  { name: 'Herbal Tea', description: 'Selection of premium loose leaf teas', price: 400, category: 'Beverages' }
];

function populateMenuItems() {
  // First, clear existing menu items
  db.query('DELETE FROM menu_items', (err) => {
    if (err) {
      console.error('❌ Error clearing menu items:', err.message);
      db.end();
      process.exit(1);
    }
    console.log('✅ Cleared existing menu items');

    // Insert all menu items
    let inserted = 0;
    menuItems.forEach((item, index) => {
      const query = 'INSERT INTO menu_items (name, description, price, category) VALUES (?, ?, ?, ?)';
      const values = [item.name, item.description, item.price, item.category];

      db.query(query, values, (err) => {
        if (err) {
          console.error(`❌ Error inserting "${item.name}":`, err.message);
        } else {
          inserted++;
          console.log(`✅ Inserted: ${item.name} (Rs. ${item.price}) - ${item.category}`);
        }

        // Close connection after last item
        if (index === menuItems.length - 1) {
          setTimeout(() => {
            console.log(`\n✅ Successfully added ${inserted}/${menuItems.length} menu items to the database`);
            db.end();
            process.exit(0);
          }, 500);
        }
      });
    });
  });
}
