// ============================================
// RESERVATION FORM SCRIPT
// Handles form submission and date validation
// ============================================

// Get form and confirmation message elements
const reservationForm = document.getElementById('reservationForm');
const confirmationMessage = document.getElementById('confirmationMessage');

// Set minimum date to today (prevent past dates)
setMinimumDate();

// Listen for form submission
reservationForm.addEventListener('submit', handleFormSubmit);

// ============================================
// FUNCTIONS
// ============================================

// Set the minimum date for date picker to today
function setMinimumDate() {
  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Add leading zero
  const day = String(today.getDate()).padStart(2, '0'); // Add leading zero
  const todayString = year + '-' + month + '-' + day;
  
  // Set minimum date attribute
  const dateInput = document.getElementById('date');
  if (dateInput) {
    dateInput.setAttribute('min', todayString);
  }
}

// Handle form submission
function handleFormSubmit(event) {
  // Prevent page reload
  event.preventDefault();
  
  // Get all form data
  const formData = getFormData();
  
  // Send data to server
  sendReservationToServer(formData);
}

// Collect all form field values into an object
function getFormData() {
  return {
    name: getFieldValue('name'),
    email: getFieldValue('email'),
    phone: getFieldValue('phone'),
    reservation_date: getFieldValue('date'),
    reservation_time: getFieldValue('time'),
    guests: getFieldValue('guests'),
    occasion: getFieldValue('occasion'),
    special_requests: getFieldValue('notes')
  };
}

// Helper function to get a field value by ID
function getFieldValue(fieldId) {
  const field = document.getElementById(fieldId);
  return field ? field.value : '';
}

// Send reservation data to the server
function sendReservationToServer(formData) {
  // Show loading message (optional)
  console.log('Sending reservation...');
  
  // Make API request
  fetch('/api/reservations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  })
  .then(function(response) {
    // Convert response to JSON
    return response.json();
  })
  .then(function(data) {
    // Handle server response
    handleServerResponse(data);
  })
  .catch(function(error) {
    // Handle errors
    handleError(error);
  });
}

// Handle successful server response
function handleServerResponse(data) {
  if (data.success) {
    // Success! Show confirmation message
    showConfirmation();
    console.log('Reservation saved! ID: ' + data.id);
  } else {
    // Server returned an error
    showError(data.error || 'Failed to save reservation');
  }
}

// Show confirmation message and hide form
function showConfirmation() {
  reservationForm.style.display = 'none';
  confirmationMessage.style.display = 'block';
}

// Show error message to user
function showError(errorMessage) {
  alert('Error: ' + errorMessage);
  console.error('Error:', errorMessage);
}

// Handle network or other errors
function handleError(error) {
  console.error('Network error:', error);
  alert('Error submitting reservation. Please check your connection and try again.');
}

// Reset form (called from HTML button)
window.resetForm = function() {
  reservationForm.reset();
  reservationForm.style.display = 'flex';
  confirmationMessage.style.display = 'none';
};
