function logout() {
    try {
        sessionStorage.clear();
    } catch (e) {
        console.warn('Could not clear sessionStorage', e);
    }
    window.location.href = '/';
}
