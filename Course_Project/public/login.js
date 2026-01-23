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
    // save username to session storage and redirect to search.html
    try {
      // save username
      sessionStorage.setItem('currUsername', username);
      // fetch user's image URL from server and save it too (best-effort)
      try {
        const imgRes = await fetch(`/api/users/${encodeURIComponent(username)}/image`);
        if (imgRes.ok) {
          const imgData = await imgRes.json().catch(() => ({}));
          if (imgData && imgData.imageUrl) {
            sessionStorage.setItem('currUserImg', imgData.imageUrl);
          }
        }
      } catch (err) {
        // ignore image fetch errors and continue
      }
    } catch (err) {
      // sessionStorage might be disabled; ignore failure and continue
    }
    window.location.href = '/search';
  } catch (err) {
    showAlert('Network error: ' + (err.message || err), 'danger');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // If a user is already logged in (stored in sessionStorage, redirect to search
  const existingUser = sessionStorage.getItem('currUsername');
  if (existingUser) {
    window.location.href = '/search';
    return;
  }
  const form = document.querySelector('form');
  if (!form) return;
  form.addEventListener('submit', handleSubmit);
});

// Handle page show event to manage bfcache scenarios (e.g., back button)
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    // If a user is already logged in (stored in sessionStorage, redirect to search
    const existingUser = sessionStorage.getItem('currUsername');
    if (existingUser) {
      window.location.href = '/search';
      return;
    }
  }
});
