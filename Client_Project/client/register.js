let submitBtn;
let form;

document.addEventListener('DOMContentLoaded', () => {
    form = document.querySelector('form');
    if (!form) return;

    // cache the submit button so we can disable/enable it safely
    submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', handleSubmit);

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
            const msg = body.message || 'Registration successful.';
            // save username to session storage and redirect to search.html
            try {
                // save username and image URL (best-effort)
                sessionStorage.setItem('currUsername', payload.username || '');
                if (payload.imgUrl) {
                    sessionStorage.setItem('currUserImg', payload.imgUrl);
                }
            } catch (err) {
                // ignore storage errors
            }
            window.location.href = 'search.html';
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
    const imageUrl = form.querySelector('#imageUrl')?.value?.trim() || '';
    const password = form.querySelector('#password')?.value || '';
    const confirmPassword = form.querySelector('#confirmPassword')?.value || '';
    const emailEl = form.querySelector('#email');
    const email = emailEl ? (emailEl.value || '').trim() : '';
    return { username, firstName, imageUrl, password, confirmPassword, email };
}

function validateValues(vals) {
    if (!vals.username || !vals.firstName || !vals.email || !vals.password || !vals.confirmPassword) {
        return { ok: false, msg: 'Registration failed: please fill all required fields.' };
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
        imgUrl: vals.imageUrl,
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