const { readUsersFromJson, writeUsersToJson } = require('../utils/userHelpers');

const MIN_USERNAME_LENGTH = 6;
const MIN_PASSWORD_LENGTH = 6;

// Helper: generate a stable-unique id for new users
function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.username
 * @param {string} userData.email
 * @param {string} userData.firstName
 * @param {string} userData.imgUrl
 * @param {string} userData.password
 * @param {string} userData.passwordConfirmation
 * @returns {Object} Result object with success flag, user data or error message
 */
exports.registerUser = (userData) => {
    const { username, email, firstName, imgUrl, password, passwordConfirmation } = userData;

    // data validation
    let { isUsernameOkay, usernameStatusMsg } = validateUsername(username);
    if (!isUsernameOkay) {
        return { success: false, error: usernameStatusMsg };
    }

    let { isEmailOkay, emailStatusMsg } = validateEmail(email);
    if (!isEmailOkay) {
        return { success: false, error: emailStatusMsg };
    }

    let { isPasswordOkay, passwordStatusMsg } = validatePassword(password, passwordConfirmation);
    if (!isPasswordOkay) {
        return { success: false, error: passwordStatusMsg };
    }

    let { isFirstNameOkay, firstNameStatusMsg } = validateFirstName(firstName);
    if (!isFirstNameOkay) {
        return { success: false, error: firstNameStatusMsg };
    }

    let { isImgUrlOkay, imgUrlStatusMsg } = validateImgUrl(imgUrl);
    if (!isImgUrlOkay) {
        return { success: false, error: imgUrlStatusMsg };
    }

    // all validations passed, add user to JSON "database"
    const newUser = addUserToJson({ username, email, firstName, imgUrl, password });

    return { success: true, user: newUser };
};

/**
 * Authenticate a user with username and password
 * @param {string} username
 * @param {string} password
 * @returns {Object} Result object with success flag and user data or error message
 */
exports.authenticateUser = (username, password) => {
    const users = readUsersFromJson();
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return { success: false, error: 'Invalid username or password.' };
    }

    return {
        success: true,
        user: {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            imgUrl: user.imgUrl
        }
    };
};

/**
 * Get user's image URL by username
 * @param {string} username
 * @returns {Object} Result object with success flag and imageUrl or error message
 */
exports.getUserImageUrl = (username) => {
    if (!username) {
        return { success: false, error: 'Username is required.' };
    }

    const users = readUsersFromJson();
    const user = users.find(u => u.username === username);

    if (!user) {
        return { success: false, error: 'User not found.' };
    }

    return { success: true, imageUrl: user.imgUrl || '' };
};

// Helper functions

function addUserToJson({ username, email, firstName, imgUrl, password }) {
    const users = readUsersFromJson();

    const newUser = {
        id: generateId(),
        username,
        email,
        firstName,
        imgUrl,
        password,
        playlistIDs: []
    };

    users.push(newUser);

    writeUsersToJson(users);

    return newUser;
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

function validatePassword(password, passwordConfirmation) {
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
