async function logout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        console.warn('Could not logout from server', e);
    }
    window.location.href = '/login';
}
