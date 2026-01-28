const studentDetails = {
    name1: "Ariel Feinstein",
    id1: "12345678",
    name2: "Idan Rossin",
    id2: "12345678",
    githubRepo: "https://github.com/arielfeinstein/WebDevCourse_HW/tree/main/Client_Project",
    deployedLink: "https://webdevcourse-hw.onrender.com/",
    linkToLogin: "/login",
    linkToRegister: "/register",
    notes: [
        "The id isn't real, please check the moodle submission for the actual id.",
        "When clicking on the deployed link, it may take some time to load as the server is hosted on a free tier service."
    ]
};

function populateStudentCard(student) {
    document.getElementById('student-name').textContent = student.name1;
    document.getElementById('student-id').textContent = student.id1;
    document.getElementById('student-name-2').textContent = student.name2;
    document.getElementById('student-id-2').textContent = student.id2;

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