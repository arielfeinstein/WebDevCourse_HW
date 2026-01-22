const studentDetails = {
    name: "Ariel Feinstein",
    id: "123455678",
    githubRepo: "https://github.com/arielfeinstein/WebDevCourse_HW/tree/main/Client_Project",
    deployedLink: "https://webdevcourse-hw.onrender.com/index.html",
    linkToLogin: "/login.html",
    linkToRegister: "/register.html",
    notes: [
        "The id isn't real, please check the moodle submission for the actual id.",
        "When clicking on the deployed link, it may take some time to load as the server is hosted on a free tier service."
    ]
};

function populateStudentCard(student) {
    document.getElementById('student-name').textContent = student.name;
    document.getElementById('student-id').textContent = student.id;

    const notesList = document.getElementById('notes-list');
    student.notes.forEach(n => {
        const li = document.createElement('li');
        li.textContent = n;
        notesList.appendChild(li);
    });

    const githubLink = document.getElementById('github-link');
    githubLink.href = student.githubRepo;
    githubLink.textContent = student.githubRepo;

    const deployedLink = document.getElementById('deployed-link');
    deployedLink.href = student.deployedLink;
    deployedLink.textContent = student.deployedLink;

    document.getElementById('login-btn').href = student.linkToLogin;
    document.getElementById('register-btn').href = student.linkToRegister;
}

document.addEventListener('DOMContentLoaded', () => {
    populateStudentCard(studentDetails);
});