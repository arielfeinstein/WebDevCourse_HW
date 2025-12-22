const studentDetails = {
    name: "Ariel Feinstein",
    id: "123455678 - not real, real id is found in the moodle submission",
    githubRepo: "https://github.com/arielfeinstein/WebDevCourse_HW",
    deployedLink: "https://example.com/your-deployed-app - replace with your actual deployed link",
    linkToLogin: "/login.html",
    linkToRegister: "/register.html",
    note: "The id isn't real, please check the moodle submission for the actual id."
};

function populateStudentCard(student) {
    const nameEl = document.getElementById('student-name');
    const idEl = document.getElementById('student-id');
    const noteEl = document.getElementById('student-note');
    const githubLink = document.getElementById('github-link');
    const deployedLink = document.getElementById('deployed-link');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');

    if (nameEl) nameEl.textContent = student.name || '';
    if (idEl) idEl.textContent = student.id || '';
    if (noteEl) noteEl.textContent = student.note || '';
    if (githubLink) {
        githubLink.href = student.githubRepo || '#';
        githubLink.textContent = student.githubRepo || 'repo';
    }
    if (deployedLink) {
        deployedLink.href = student.deployedLink || '#';
        deployedLink.textContent = student.deployedLink || 'deployed';
    }
    if (loginBtn) loginBtn.href = student.linkToLogin || '/login.html';
    if (registerBtn) registerBtn.href = student.linkToRegister || '/register.html';
}

document.addEventListener('DOMContentLoaded', () => {
    populateStudentCard(studentDetails);
});

// Export for testing or reuse (optional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { placeholderStudentDetails: studentDetails, populateStudentCard };
}