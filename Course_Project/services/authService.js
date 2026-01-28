const bcrypt = require('bcrypt');
const { userRepository } = require('../repositories');

const MIN_USERNAME_LENGTH = 6;
const MIN_PASSWORD_LENGTH = 6;
const SALT_ROUNDS = 10;

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Result object with success flag, user data or error message
 */
exports.registerUser = async (userData) => {
    const { username, email, firstName, lastName, imgUrl, password, passwordConfirmation } = userData;

    // Data validation
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
        return { success: false, error: usernameValidation.message };
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
        return { success: false, error: emailValidation.message };
    }

    const passwordValidation = validatePassword(password, passwordConfirmation);
    if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.message };
    }

    const firstNameValidation = validateFirstName(firstName);
    if (!firstNameValidation.isValid) {
        return { success: false, error: firstNameValidation.message };
    }

    const imgUrlValidation = validateImgUrl(imgUrl);
    if (!imgUrlValidation.isValid) {
        return { success: false, error: imgUrlValidation.message };
    }

    // Check if username already exists
    const usernameExists = await userRepository.usernameExists(username);
    if (usernameExists) {
        return { success: false, error: 'Username is already taken.' };
    }

    // Check if email already exists
    const emailExists = await userRepository.emailExists(email);
    if (emailExists) {
        return { success: false, error: 'Email is already registered.' };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user in database
    const newUser = await userRepository.create({
        username,
        email,
        firstName,
        lastName: lastName || null,
        imgUrl,
        password: hashedPassword
    });

    return { success: true, user: newUser };
};

/**
 * Authenticate a user with username and password
 * @param {string} username
 * @param {string} password
 * @returns {Promise<Object>} Result object with success flag and user data or error message
 */
exports.authenticateUser = async (username, password) => {
    const user = await userRepository.findByUsername(username);

    if (!user) {
        return { success: false, error: 'Invalid username or password.' };
    }

    // Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return { success: false, error: 'Invalid username or password.' };
    }

    return {
        success: true,
        user: {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            imgUrl: user.imgUrl
        }
    };
};

/**
 * Get user's image URL by username
 * @param {string} username
 * @returns {Promise<Object>} Result object with success flag and imageUrl or error message
 */
exports.getUserImageUrl = async (username) => {
    if (!username) {
        return { success: false, error: 'Username is required.' };
    }

    const user = await userRepository.findByUsername(username);

    if (!user) {
        return { success: false, error: 'User not found.' };
    }

    return { success: true, imageUrl: user.imgUrl || '' };
};

/**
 * Get user by username
 * @param {string} username
 * @returns {Promise<Object|null>} User object or null
 */
exports.getUserByUsername = async (username) => {
    return userRepository.findByUsername(username);
};

/**
 * Get user by ID
 * @param {number} id
 * @returns {Promise<Object|null>} User object or null
 */
exports.getUserById = async (id) => {
    return userRepository.findById(id);
};

// Validation helper functions

function validateUsername(username) {
    if (!username || typeof username !== 'string' || username.length < MIN_USERNAME_LENGTH) {
        return { 
            isValid: false, 
            message: `Username must be at least ${MIN_USERNAME_LENGTH} characters long.` 
        };
    }
    return { isValid: true, message: 'Valid username.' };
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
        return { isValid: false, message: 'Invalid email format.' };
    }
    return { isValid: true, message: 'Valid email.' };
}

function validatePassword(password, passwordConfirmation) {
    if (!password || typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
        return { 
            isValid: false, 
            message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` 
        };
    }

    // At least one letter and one non-letter
    const letterRegex = /[A-Za-z]/;
    const nonLetterRegex = /[^A-Za-z]/;

    if (!letterRegex.test(password) || !nonLetterRegex.test(password)) {
        return { 
            isValid: false, 
            message: 'Password must contain at least one letter and one non-letter character.' 
        };
    }

    return { isValid: true, message: 'Valid password.' };
}

function validateFirstName(firstName) {
    if (!firstName || typeof firstName !== 'string' || firstName.trim() === '') {
        return { isValid: false, message: 'First name cannot be empty.' };
    }

    // No digits allowed
    const digitRegex = /\d/;
    if (digitRegex.test(firstName)) {
        return { isValid: false, message: 'First name cannot contain digits.' };
    }
    
    return { isValid: true, message: 'Valid first name.' };
}

function validateImgUrl(imgUrl) {
    if (!imgUrl || typeof imgUrl !== 'string' || imgUrl.trim() === '') {
        return { isValid: false, message: 'Image URL cannot be empty.' };
    }

    // Only accept SVG filenames for avatars
    if (imgUrl.endsWith('.svg')) {
        return { isValid: true, message: 'Valid image URL.' };
    }

    // Also allow full URLs for backwards compatibility
    try {
        new URL(imgUrl);
    } catch (e) {
        return { isValid: false, message: 'Invalid image URL format.' };
    }

    return { isValid: true, message: 'Valid image URL.' };
}
