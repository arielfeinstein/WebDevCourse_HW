let submitBtn;
let form;

document.addEventListener('DOMContentLoaded', () => {
    form = document.querySelector('form');
    if (!form) return;

    // cache the submit button so we can disable/enable it safely
    submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', handleSubmit);

    // Add click handlers to pre-rendered avatars
    document.querySelectorAll('#avatarSelection > div').forEach(avatarDiv => {
        avatarDiv.addEventListener('click', () => {
            const avatarFilename = avatarDiv.getAttribute('data-avatar');
            selectAvatar(avatarFilename, avatarDiv);
        });
    });
});

async function handleSubmit(e) {
    e.preventDefault();

    const values = getFormValues();

    const validation = validateValues(values);
    if (!validation.ok) {
        window.alert(validation.msg);
        return;
    }

    const payload = buildPayload(values);

    try {
        if (submitBtn) submitBtn.disabled = true;

        const { res, body } = await postRegister(payload);

        if (res.ok && res.status === 201) {
            // Registration successful - redirect to login page
            window.alert(body.message || 'Registration successful. Please login.');
            window.location.href = '/login';
        } else {
            const errMsg = body.error || body.message || `${res.status} ${res.statusText}`;
            window.alert(`Registration failed: ${errMsg}`);
        }
    } catch (err) {
        window.alert(`Registration failed: ${err && err.message ? err.message : 'Network error'}`);
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

function getFormValues() {
    const username = form.querySelector('#username')?.value?.trim() || '';
    const firstName = form.querySelector('#firstName')?.value?.trim() || '';
    const selectedAvatar = form.querySelector('#selectedAvatar')?.value || '';
    const password = form.querySelector('#password')?.value || '';
    const confirmPassword = form.querySelector('#confirmPassword')?.value || '';
    const emailEl = form.querySelector('#email');
    const email = emailEl ? (emailEl.value || '').trim() : '';
    return { username, firstName, selectedAvatar, password, confirmPassword, email };
}

function validateValues(vals) {
    if (!vals.username || !vals.firstName || !vals.email || !vals.password || !vals.confirmPassword) {
        return { ok: false, msg: 'Registration failed: please fill all required fields.' };
    }
    if (!vals.selectedAvatar) {
        const avatarError = document.querySelector('#avatarError');
        if (avatarError) avatarError.classList.remove('d-none');
        return { ok: false, msg: 'Registration failed: please select an avatar.' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(vals.email)) {
        return { ok: false, msg: 'Registration failed: please enter a valid email address.' };
    }
    if (vals.password !== vals.confirmPassword) {
        return { ok: false, msg: 'Registration failed: passwords do not match.' };
    }
    return { ok: true };
}

function buildPayload(vals) {
    return {
        username: vals.username,
        email: vals.email,
        firstName: vals.firstName,
        imgUrl: vals.selectedAvatar,
        password: vals.password,
        passwordConfirmation: vals.confirmPassword
    };
}

async function postRegister(payload) {
    const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const body = await res.json().catch(() => ({}));
    return { res, body };
}

function selectAvatar(avatarFilename, element) {
    // Remove selection from all avatars
    document.querySelectorAll('#avatarSelection > div').forEach(el => {
        el.className = 'border border-2 border-transparent rounded p-1';
    });

    // Add selection to clicked avatar using Bootstrap classes
    element.className = 'border border-2 border-primary rounded p-1 bg-primary bg-opacity-10';

    // Update hidden input with just the filename
    const hiddenInput = document.querySelector('#selectedAvatar');
    if (hiddenInput) {
        hiddenInput.value = avatarFilename;
    }

    // Hide error message if visible
    const avatarError = document.querySelector('#avatarError');
    if (avatarError) {
        avatarError.classList.add('d-none');
    }
}
