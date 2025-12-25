const form = document.getElementById('reservationForm');
const confirmationMessage = document.getElementById('confirmationMessage');

// Prevent selecting past dates
const today = new Date().toISOString().split('T')[0];
document.getElementById('date').setAttribute('min', today);

form.addEventListener('submit', function(e) {
  e.preventDefault();

  const formData = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    reservation_date: document.getElementById('date').value,
    reservation_time: document.getElementById('time').value,
    guests: document.getElementById('guests').value,
    occasion: document.getElementById('occasion').value,
    special_requests: document.getElementById('notes').value
  };

  console.log('📤 Sending reservation to backend:', formData);

  fetch('https://pureplates.ct.ws/api/reservations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  })
  .then(response => response.json())
  .then(data => {
    console.log('✅ Reservation response:', data);
    if (data.success) {
      form.style.display = 'none';
      confirmationMessage.style.display = 'block';
      console.log('✅ Reservation saved to database with ID:', data.id);
    } else {
      alert('Error: ' + (data.error || 'Failed to save reservation'));
      console.error('❌ Error:', data.error);
    }
  })
  .catch(error => {
    console.error('❌ Network error:', error);
    alert('Error submitting reservation: ' + error.message);
  });
});

// Global function called from HTML reset button
window.resetForm = function() {
  form.reset();
  form.style.display = 'flex';
  confirmationMessage.style.display = 'none';
};
