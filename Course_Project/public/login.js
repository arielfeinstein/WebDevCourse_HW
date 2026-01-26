// Use simple alert dialogs for feedback
function showAlert(message, type = 'info') {
  // type can be 'info', 'success', 'danger' — kept for potential future use.
  alert(message);
}

// Handle form submission for login
async function handleSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('username')?.value ?? '';
  const password = document.getElementById('password')?.value ?? '';

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username, password: password })
    });

    let data;
    try {
      data = await res.json();
    } catch (err) {
      data = { error: 'Invalid JSON response from server' };
    }

    if (!res.ok) {
      const msg = data && data.error ? data.error : `Login failed (status ${res.status})`;
      showAlert(msg, 'danger');
      return;
    }
    // Server sets session cookie - redirect to search
    window.location.href = '/search';
  } catch (err) {
    showAlert('Network error: ' + (err.message || err), 'danger');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  if (!form) return;
  form.addEventListener('submit', handleSubmit);
});
