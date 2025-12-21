// ============================================
// MENU AND SHOPPING CART SCRIPT
// Handles menu display, cart management, and checkout
// ============================================

// Global variables
let cart = [];           // Array to store cart items
let menuItems = [];      // Array to store all menu items

// ============================================
// INITIALIZATION
// ============================================

// When page loads, load menu items
document.addEventListener('DOMContentLoaded', function() {
  loadMenuItems();
});

// ============================================
// MENU FUNCTIONS
// ============================================

// Load menu items from the API
function loadMenuItems() {
  console.log('Loading menu items...');
  
  // Make API request
  fetch('/api/menu-items')
    .then(function(response) {
      // Check if request was successful
      if (!response.ok) {
        throw new Error('Failed to load menu items');
      }
      // Convert response to JSON
      return response.json();
    })
    .then(function(data) {
      // Extract items from response
      let items = [];
      if (data.success && data.items) {
        items = data.items;
      } else if (Array.isArray(data)) {
        items = data;
      } else {
        throw new Error('Unexpected data format');
      }
      
      // Store items and display them
      menuItems = items;
      displayMenuItems(items);
      console.log('Loaded ' + items.length + ' menu items');
    })
    .catch(function(error) {
      // Show error message
      showMenuError(error.message);
    });
}

// Display menu items on the page
function displayMenuItems(items) {
  const container = document.getElementById('menuContainer');
  
  // Check if there are any items
  if (!items || items.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 40px;"><p>No menu items available.</p></div>';
    return;
  }

  // Group items by category
  const itemsByCategory = groupItemsByCategory(items);
  
  // Generate HTML for all categories
  const html = generateAllCategoriesHTML(itemsByCategory);
  
  // Display the HTML
  container.innerHTML = html;
}

// Group menu items by their category
function groupItemsByCategory(items) {
  const grouped = {};
  
  items.forEach(function(item) {
    const category = item.category || 'Other';
    
    if (!grouped[category]) {
      grouped[category] = [];
    }
    
    grouped[category].push(item);
  });
  
  return grouped;
}

// Generate HTML for all categories
function generateAllCategoriesHTML(itemsByCategory) {
  let html = '';
  const categoryOrder = ['Appetizers', 'Main Courses', 'Desserts', 'Beverages'];
  
  // First, show categories in preferred order
  categoryOrder.forEach(function(category) {
    if (itemsByCategory[category] && itemsByCategory[category].length > 0) {
      html += generateCategoryHTML(category, itemsByCategory[category]);
      delete itemsByCategory[category];
    }
  });
  
  // Then show any remaining categories
  Object.keys(itemsByCategory).forEach(function(category) {
    html += generateCategoryHTML(category, itemsByCategory[category]);
  });
  
  return html;
}

// Generate HTML for a single category
function generateCategoryHTML(category, items) {
  let itemsHTML = '';
  
  items.forEach(function(item) {
    itemsHTML += generateMenuItemHTML(item);
  });
  
  return '<div class="menu-category">' +
         '<h2>' + escapeHtml(category) + '</h2>' +
         '<div class="menu-grid">' + itemsHTML + '</div>' +
         '</div>';
}

// Generate HTML for a single menu item
function generateMenuItemHTML(item) {
  const price = formatPrice(item.price);
  const name = escapeHtml(item.name);
  const description = escapeHtml(item.description);
  
  return '<div class="menu-item">' +
         '<div class="menu-item-header">' +
         '<h3>' + name + '</h3>' +
         '<span class="price">Rs. ' + price + '</span>' +
         '</div>' +
         '<p>' + description + '</p>' +
         '<button class="btn-secondary" onclick="addToCart(\'' + name + '\', ' + item.price + ')">Add to Cart</button>' +
         '</div>';
}

// Show error message if menu fails to load
function showMenuError(errorMessage) {
  const container = document.getElementById('menuContainer');
  container.innerHTML = '<div style="text-align: center; padding: 40px;">' +
                       '<p style="color: #f44336;">Error: ' + errorMessage + '</p>' +
                       '<button onclick="loadMenuItems()" style="margin-top: 20px; padding: 12px 24px; background-color: #2d5016; color: white; border: none; border-radius: 8px; cursor: pointer;">Retry</button>' +
                       '</div>';
}

// ============================================
// CART FUNCTIONS
// ============================================

// Add item to cart
function addToCart(itemName, itemPrice) {
  // Check if item already in cart
  const existingItem = findItemInCart(itemName);
  
  if (existingItem) {
    // Increase quantity if already in cart
    existingItem.quantity += 1;
  } else {
    // Add new item to cart
    cart.push({
      name: itemName,
      price: itemPrice,
      quantity: 1
    });
  }
  
  // Update cart display
  updateCart();
  
  // Show confirmation popup
  showAddToCartPopup(itemName);
}

// Find an item in the cart by name
function findItemInCart(itemName) {
  for (let i = 0; i < cart.length; i++) {
    if (cart[i].name === itemName) {
      return cart[i];
    }
  }
  return null;
}

// Update cart display
function updateCart() {
  const cartItemsContainer = document.getElementById('cartItems');
  const cartSummary = document.getElementById('cartSummary');
  const cartTotal = document.getElementById('cartTotal');

  // If cart is empty
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p>Your cart is empty. Start adding dishes!</p>';
    cartSummary.style.display = 'none';
    return;
  }

  // Clear previous cart display
  cartItemsContainer.innerHTML = '';
  
  // Calculate total and display items
  let total = 0;
  
  cart.forEach(function(item, index) {
    total += item.price * item.quantity;
    
    const cartItemHTML = createCartItemHTML(item, index);
    cartItemsContainer.innerHTML += cartItemHTML;
  });

  // Update total and show summary
  cartTotal.textContent = formatPrice(total);
  cartSummary.style.display = 'block';
}

// Create HTML for a cart item
function createCartItemHTML(item, index) {
  const itemTotal = item.price * item.quantity;
  const formattedPrice = formatPrice(item.price);
  const formattedTotal = formatPrice(itemTotal);
  
  return '<div class="cart-item">' +
         '<p><strong>' + item.name + '</strong><br/>' +
         'Rs. ' + formattedPrice + ' × ' + item.quantity + ' = <strong>Rs. ' + formattedTotal + '</strong></p>' +
         '<button class="btn-small" onclick="removeFromCart(' + index + ')">Remove</button>' +
         '</div>';
}

// Remove item from cart
function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

// Clear entire cart
function clearCart() {
  cart = [];
  updateCart();
}

// ============================================
// CHECKOUT FUNCTIONS
// ============================================

// Start checkout process
function proceedToCheckout() {
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }
  
  showDeliveryDetailsForm();
}

// Show delivery details form
function showDeliveryDetailsForm() {
  const total = calculateCartTotal();
  const formattedTotal = formatPrice(total);
  
  // Create form HTML
  const formHTML = createDeliveryFormHTML(formattedTotal);
  
  // Add form to page
  document.body.insertAdjacentHTML('beforeend', formHTML);
}

// Calculate total price of all items in cart
function calculateCartTotal() {
  let total = 0;
  cart.forEach(function(item) {
    total += item.price * item.quantity;
  });
  return total;
}

// Create delivery form HTML
function createDeliveryFormHTML(total) {
  return '<div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 9999;" id="deliveryOverlay">' +
         '<div style="background: white; padding: 40px; border-radius: 12px; max-width: 450px;">' +
         '<h2 style="color: #2d5016; margin-bottom: 25px; text-align: center;">Delivery Details</h2>' +
         '<form id="deliveryForm" style="display: flex; flex-direction: column; gap: 15px;">' +
         createFormField('Full Name', 'deliveryName', 'text', true) +
         createFormField('Phone Number', 'deliveryPhone', 'tel', true) +
         createFormField('Email Address', 'deliveryEmail', 'email', true) +
         createFormField('Street Address', 'deliveryAddress', 'text', true) +
         '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">' +
         createFormField('City', 'deliveryCity', 'text', true) +
         createFormField('ZIP Code', 'deliveryZip', 'text', true) +
         '</div>' +
         createFormField('Special Instructions (Optional)', 'deliveryInstructions', 'textarea', false) +
         '<div style="background: #f0f8ff; padding: 12px; border-radius: 6px; margin: 10px 0;">' +
         '<p style="margin: 0;"><strong>Total: Rs. ' + total + '</strong></p>' +
         '</div>' +
         '<button type="button" onclick="submitDeliveryDetails()" style="width: 100%; padding: 14px; background-color: #2d5016; color: white; border: none; border-radius: 8px; cursor: pointer;">Continue to Payment</button>' +
         '<button type="button" onclick="closeDeliveryForm()" style="width: 100%; padding: 12px; background-color: #ccc; color: #333; border: none; border-radius: 8px; cursor: pointer;">Cancel</button>' +
         '</form>' +
         '</div>' +
         '</div>';
}

// Helper to create form field HTML
function createFormField(label, id, type, required) {
  const requiredText = required ? ' *' : '';
  if (type === 'textarea') {
    return '<div><label style="display: block; margin-bottom: 5px; font-weight: 600;">' + label + requiredText + '</label>' +
           '<textarea id="' + id + '" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; box-sizing: border-box;" rows="3"></textarea></div>';
  } else {
    return '<div><label style="display: block; margin-bottom: 5px; font-weight: 600;">' + label + requiredText + '</label>' +
           '<input type="' + type + '" id="' + id + '" ' + (required ? 'required' : '') + ' style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; box-sizing: border-box;"></div>';
  }
}

// Submit delivery details
function submitDeliveryDetails() {
  // Get all form values
  const name = document.getElementById('deliveryName').value;
  const phone = document.getElementById('deliveryPhone').value;
  const email = document.getElementById('deliveryEmail').value;
  const address = document.getElementById('deliveryAddress').value;
  const city = document.getElementById('deliveryCity').value;
  const zip = document.getElementById('deliveryZip').value;
  const instructions = document.getElementById('deliveryInstructions').value;

  // Validate required fields
  if (!name || !phone || !email || !address || !city || !zip) {
    alert('Please fill in all required fields');
    return;
  }

  // Save delivery details
  const deliveryDetails = {
    name: name,
    phone: phone,
    email: email,
    address: address,
    city: city,
    zip: zip,
    instructions: instructions
  };
  
  localStorage.setItem('delivery_details', JSON.stringify(deliveryDetails));

  // Close form and show payment options
  closeDeliveryForm();
  showPaymentOptionsPopup();
}

// Close delivery form
function closeDeliveryForm() {
  const overlay = document.getElementById('deliveryOverlay');
  if (overlay) {
    overlay.remove();
  }
}

// Show payment options
function showPaymentOptionsPopup() {
  const total = calculateCartTotal();
  const formattedTotal = formatPrice(total);
  
  const paymentHTML = '<div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 9999;" id="paymentOverlay">' +
                     '<div style="background: white; padding: 40px; border-radius: 12px; max-width: 400px;">' +
                     '<h2 style="color: #2d5016; margin-bottom: 20px; text-align: center;">Payment Options</h2>' +
                     '<p style="text-align: center; margin-bottom: 30px;"><strong>Total: Rs. ' + formattedTotal + '</strong></p>' +
                     '<button onclick="selectPayment(\'credit_card\')" style="width: 100%; padding: 15px; margin-bottom: 12px; background-color: #6b8e23; color: white; border: none; border-radius: 8px; cursor: pointer;">💳 Credit/Debit Card</button>' +
                     '<button onclick="selectPayment(\'cod\')" style="width: 100%; padding: 15px; margin-bottom: 20px; background-color: #6b8e23; color: white; border: none; border-radius: 8px; cursor: pointer;">💵 Cash on Delivery</button>' +
                     '<button onclick="closePaymentPopup()" style="width: 100%; padding: 12px; background-color: #ccc; color: #333; border: none; border-radius: 8px; cursor: pointer;">Cancel</button>' +
                     '</div>' +
                     '</div>';
  
  document.body.insertAdjacentHTML('beforeend', paymentHTML);
}

// Handle payment selection
function selectPayment(method) {
  const total = calculateCartTotal();
  const paymentMethodNames = {
    'credit_card': 'Credit/Debit Card',
    'cod': 'Cash on Delivery'
  };
  
  // Get delivery details
  const deliveryDetails = JSON.parse(localStorage.getItem('delivery_details'));
  
  // Prepare order data
  const orderData = {
    customer_name: deliveryDetails.name,
    customer_email: deliveryDetails.email,
    customer_phone: deliveryDetails.phone,
    street_address: deliveryDetails.address,
    city: deliveryDetails.city,
    zip_code: deliveryDetails.zip,
    special_instructions: deliveryDetails.instructions,
    items: cart,
    total_price: total,
    payment_method: method
  };

  // Send order to server
  fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderData)
  })
  .then(function(response) {
    if (!response.ok) {
      throw new Error('Failed to place order');
    }
    return response.json();
  })
  .then(function(data) {
    if (data.success) {
      // Clear cart and show success
      cart = [];
      updateCart();
      localStorage.removeItem('delivery_details');
      closePaymentPopup();
      showSuccessPopup(total, paymentMethodNames[method], data.order_id);
    } else {
      alert('Error: ' + (data.error || 'Failed to place order'));
    }
  })
  .catch(function(error) {
    alert('Error placing order: ' + error.message);
  });
}

// Close payment popup
function closePaymentPopup() {
  const overlay = document.getElementById('paymentOverlay');
  if (overlay) {
    overlay.remove();
  }
}

// Show success message
function showSuccessPopup(total, paymentMethod, orderId) {
  const formattedTotal = formatPrice(total);
  const successHTML = '<div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 9999;" id="successOverlay">' +
                     '<div style="background: white; padding: 50px 40px; border-radius: 16px; max-width: 450px; text-align: center;">' +
                     '<div style="font-size: 4em; margin-bottom: 20px;">✅</div>' +
                     '<h2 style="color: #2d5016; margin-bottom: 15px;">Order Placed Successfully!</h2>' +
                     '<p style="margin-bottom: 15px;">Order ID: #' + orderId + '</p>' +
                     '<p style="margin-bottom: 15px;">Total: Rs. ' + formattedTotal + '</p>' +
                     '<p style="margin-bottom: 25px;">Payment: ' + paymentMethod + '</p>' +
                     '<button onclick="closeSuccessPopup()" style="width: 100%; padding: 16px; background-color: #2d5016; color: white; border: none; border-radius: 8px; cursor: pointer;">Close</button>' +
                     '</div>' +
                     '</div>';
  
  document.body.insertAdjacentHTML('beforeend', successHTML);
}

// Close success popup
function closeSuccessPopup() {
  const overlay = document.getElementById('successOverlay');
  if (overlay) {
    overlay.remove();
  }
}

// Show add to cart popup
function showAddToCartPopup(itemName) {
  const popupHTML = '<div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 8999;" id="addToCartOverlay" onclick="closeAddToCartPopup()">' +
                   '<div style="background: white; padding: 30px 40px; border-radius: 12px; text-align: center;" onclick="event.stopPropagation();">' +
                   '<div style="font-size: 3em; margin-bottom: 15px;">🛒</div>' +
                   '<h3 style="color: #2d5016; margin-bottom: 10px;">Added to Cart!</h3>' +
                   '<p style="margin-bottom: 20px;">' + itemName + ' has been added to your cart.</p>' +
                   '<button onclick="closeAddToCartPopup()" style="width: 100%; padding: 12px; background-color: #6b8e23; color: white; border: none; border-radius: 8px; cursor: pointer;">Continue Shopping</button>' +
                   '</div>' +
                   '</div>';
  
  document.body.insertAdjacentHTML('beforeend', popupHTML);
  
  // Auto-close after 2 seconds
  setTimeout(closeAddToCartPopup, 2000);
}

// Close add to cart popup
function closeAddToCartPopup() {
  const overlay = document.getElementById('addToCartOverlay');
  if (overlay) {
    overlay.remove();
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Format price with commas
function formatPrice(price) {
  return parseFloat(price).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Escape HTML to prevent XSS attacks
function escapeHtml(text) {
  if (!text) return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return String(text).replace(/[&<>"']/g, function(m) {
    return map[m];
  });
}

