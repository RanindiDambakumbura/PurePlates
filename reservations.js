const form = document.getElementById('reservationForm');
const confirmationMessage = document.getElementById('confirmationMessage');

const today = new Date().toISOString().split('T')[0];
document.getElementById('date').setAttribute('min', today);

form.addEventListener('submit', function(e) {
  e.preventDefault();

  const formData = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    date: document.getElementById('date').value,
    time: document.getElementById('time').value,
    guests: document.getElementById('guests').value,
    occasion: document.getElementById('occasion').value,
    notes: document.getElementById('notes').value
  };

  console.log('Reservation submitted:', formData);

  form.style.display = 'none';
  confirmationMessage.style.display = 'block';
});

window.resetForm = function() {
  form.reset();
  form.style.display = 'flex';
  confirmationMessage.style.display = 'none';
};
