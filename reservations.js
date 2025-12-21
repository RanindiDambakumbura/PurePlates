// Get reference to the reservation form element
const form = document.getElementById('reservationForm');
// Get reference to the confirmation message element
const confirmationMessage = document.getElementById('confirmationMessage');

// Get today's date in YYYY-MM-DD format for date input minimum value
const today = new Date().toISOString().split('T')[0];
// Set minimum date attribute to prevent selecting past dates
document.getElementById('date').setAttribute('min', today);

// Add submit event listener to the form
form.addEventListener('submit', function(e) {
  // Prevent default form submission (page reload)
  e.preventDefault();

  // Collect form data into an object
  const formData = {
    name: document.getElementById('name').value,                    // Get customer name
    email: document.getElementById('email').value,                  // Get customer email
    phone: document.getElementById('phone').value,                 // Get customer phone
    reservation_date: document.getElementById('date').value,        // Get reservation date
    reservation_time: document.getElementById('time').value,       // Get reservation time
    guests: document.getElementById('guests').value,                // Get number of guests
    occasion: document.getElementById('occasion').value,           // Get special occasion (optional)
    special_requests: document.getElementById('notes').value        // Get special requests (optional)
  };

  // Log form data to console for debugging
  console.log('📤 Sending reservation to backend:', formData);

  // Send reservation to backend API
  fetch('/api/reservations', {
    method: 'POST',  // Use POST method to create new reservation
    headers: {
      'Content-Type': 'application/json'  // Specify JSON content type
    },
    body: JSON.stringify(formData)  // Convert form data to JSON string
  })
  .then(response => response.json())  // Parse response as JSON
  .then(data => {
    // Log response data to console
    console.log('✅ Reservation response:', data);
    // Check if reservation was successfully created
    if (data.success) {
      // Hide the form
      form.style.display = 'none';
      // Show confirmation message
      confirmationMessage.style.display = 'block';
      // Log success message with reservation ID
      console.log('✅ Reservation saved to database with ID:', data.id);
    } else {
      // Show error alert to user
      alert('Error: ' + (data.error || 'Failed to save reservation'));
      // Log error to console
      console.error('❌ Error:', data.error);
    }
  })
  .catch(error => {
    // Handle network or other errors
    console.error('❌ Network error:', error);
    // Show error alert to user
    alert('Error submitting reservation: ' + error.message);
  });
});

// Define global function to reset the form (called from HTML)
window.resetForm = function() {
  // Reset all form fields to their default values
  form.reset();
  // Show the form again
  form.style.display = 'flex';
  // Hide the confirmation message
  confirmationMessage.style.display = 'none';
};
