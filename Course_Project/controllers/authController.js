/*
Authentication Controller

Handles user registration, login, logout, and user image retrieval.
Uses SQLite database through repositories and bcrypt for password hashing.
*/

const authService = require('../services/authService');

exports.register = async (req, res) => {
    try {
        const result = await authService.registerUser(req.body);

        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        res.status(201).json({ message: 'User registered successfully.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'An error occurred during registration.' });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const result = await authService.authenticateUser(username, password);

        if (!result.success) {
            return res.status(401).json({ error: result.error });
        }

        // Set session with user data
        req.session.user = result.user;

        res.status(200).json({ 
            message: 'Login successful.',
            user: {
                username: result.user.username,
                firstName: result.user.firstName,
                imgUrl: result.user.imgUrl
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'An error occurred during login.' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.status(200).json({ message: 'Logged out successfully' });
    });
};

// return user's image URL by username
exports.getUserImageUrl = async (req, res) => {
    try {
        const username = req.params && req.params.username;

        const result = await authService.getUserImageUrl(username);

        if (!result.success) {
            const statusCode = result.error === 'Username is required.' ? 400 : 404;
            return res.status(statusCode).json({ error: result.error });
        }

        return res.status(200).json({ imageUrl: result.imageUrl });
    } catch (error) {
        console.error('Get user image error:', error);
        res.status(500).json({ error: 'An error occurred while fetching user image.' });
    }
};

