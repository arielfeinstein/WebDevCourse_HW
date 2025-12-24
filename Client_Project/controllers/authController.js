/*
User JSON structure (file: data/users.json)

Overall file shape:
An array of user objects
[
    {
        "username": "string",    // unique username
        "email": "string",       // user's email address
        "firstName": "string",   // user's first name
        "imgUrl": "string",      // URL to user's avatar/image
        "password": "string",    // plaintext password (student project)
        "playlistIDs": ["string"]// array of playlist ids owned by the user (may be empty)
    },
    ...
]

Notes:
- Passwords are stored in plaintext for this exercise; do NOT do this in production.
- `playlistIDs` is an array of playlist `id` values referencing entries in `data/playlists.json`.
- Validation helpers in this controller expect `username`, `email`, `firstName`, `imgUrl`, and `password` to be present when registering.
*/

const { readUsersFromJson, writeUsersToJson } = require('../utils/userHelpers');

const MIN_USERNAME_LENGTH = 6;
const MIN_PASSWORD_LENGTH = 6;

exports.register = (req, res) => {
    const { username, email, firstName, imgUrl, password, passwordConfirmation } = req.body;

    // data validation
    let {isUsernameOkay, usernameStatusMsg} = validateUsername(username);
    if (!isUsernameOkay) {
        return res.status(400).json({ error: usernameStatusMsg });
    }

    let {isEmailOkay, emailStatusMsg} = validateEmail(email);
    if (!isEmailOkay) {
        return res.status(400).json({ error: emailStatusMsg });
    }

    let {isPasswordOkay, passwordStatusMsg} = validatePassword(password, passwordConfirmation);
    if (!isPasswordOkay) {
        return res.status(400).json({ error: passwordStatusMsg });
    }

    let {isFirstNameOkay, firstNameStatusMsg} = validateFirstName(firstName);
    if (!isFirstNameOkay) {
        return res.status(400).json({ error: firstNameStatusMsg });
    }

    let {isImgUrlOkay, imgUrlStatusMsg} = validateImgUrl(imgUrl);
    if (!isImgUrlOkay) {
        return res.status(400).json({ error: imgUrlStatusMsg });
    }

    // all validations passed, add user to JSON "database"
    addUserToJson({ username, email, firstName, imgUrl, password });

    // respond with success
    res.status(201).json({ message: 'User registered successfully.' });
}

exports.login = (req, res) => {
    const { username, password } = req.body;

    const users = readUsersFromJson();
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // In a real application, you would generate and return a JWT or session here
    res.status(200).json({ message: 'Login successful.' });
}

// return user's image URL by username
exports.getUserImageUrl = (req, res) => {
    const username = req.params && req.params.username;

    if (!username) {
        return res.status(400).json({ error: 'Username is required.' });
    }

    const users = readUsersFromJson();
    const user = users.find(u => u.username === username);

    if (!user) {
        return res.status(404).json({ error: 'User not found.' });
    }

    const imageUrl = user.imgUrl || '';
    return res.status(200).json({ imageUrl });
}

// Helper functions

function addUserToJson({ username, email, firstName, imgUrl, password }) {
    const users = readUsersFromJson();

    users.push({ username, email, firstName, imgUrl, password, playlistIDs: [] });

    writeUsersToJson(users);
}

function validateUsername(username) {
    if (!username || typeof username !== 'string' || username.length < MIN_USERNAME_LENGTH) {
        return { isUsernameOkay: false, usernameStatusMsg: `Username must be at least ${MIN_USERNAME_LENGTH} characters long.` };
    }

    const users = readUsersFromJson();
    const usernames = users.map(user => user.username);
    
    if (usernames.includes(username)) {
        return { isUsernameOkay: false, usernameStatusMsg: 'Username is already taken.' };
    }

    return { isUsernameOkay: true, usernameStatusMsg: 'Valid username.' };
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
        return { isEmailOkay: false, emailStatusMsg: 'Invalid email format.' };
    }

    const users = readUsersFromJson();
    const emails = users.map(user => user.email);
    
    if (emails.includes(email)) {
        return { isEmailOkay: false, emailStatusMsg: 'Email is already registered.' };
    }

    return { isEmailOkay: true, emailStatusMsg: 'Valid email.' };
}

function validatePassword(password) {
    if (!password || typeof password !== 'string' || password.length < 6) {
        return { isPasswordOkay: false, passwordStatusMsg: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` };
    }

    // atleast one letter and one non letter
    const letterRegex = /[A-Za-z]/;
    const nonLetterRegex = /[^A-Za-z]/;

    if (!letterRegex.test(password) || !nonLetterRegex.test(password)) {
        return { isPasswordOkay: false, passwordStatusMsg: 'Password must contain at least one letter and one non-letter character.' };
    }

    return { isPasswordOkay: true, passwordStatusMsg: 'Valid password.' };
}

function validateFirstName(firstName) {
    if (!firstName || typeof firstName !== 'string' || firstName.trim() === '') {
        return { isFirstNameOkay: false, firstNameStatusMsg: 'First name cannot be empty.' };
    }

    // no digits allowed
    const digitRegex = /\d/;
    if (digitRegex.test(firstName)) {
        return { isFirstNameOkay: false, firstNameStatusMsg: 'First name cannot contain digits.' };
    }
    
    return { isFirstNameOkay: true, firstNameStatusMsg: 'Valid first name.' };
}

function validateImgUrl(imgUrl) {
    if (!imgUrl || typeof imgUrl !== 'string' || imgUrl.trim() === '') {
        return { isImgUrlOkay: false, imgUrlStatusMsg: 'Image URL cannot be empty.' };
    }

    try {
        new URL(imgUrl);
    } catch (e) {
        return { isImgUrlOkay: false, imgUrlStatusMsg: 'Invalid image URL format.' };
    }

    return { isImgUrlOkay: true, imgUrlStatusMsg: 'Valid image URL.' };
}

