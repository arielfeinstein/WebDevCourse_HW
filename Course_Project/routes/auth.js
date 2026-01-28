const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * POST /api/auth/login
 * Authenticates a user. Expects JSON body: { username, password }.
 * On success returns 200 with { message, ...user } (controller-defined).
 * On failure returns 400/401 with { error: '...' }.
 */
router.post('/login', (req, res) => {
	if (authController && typeof authController.login === 'function') {
		return authController.login(req, res);
	}
	res.status(501).json({ error: 'Not implemented: authController.login' });
});

/**
 * POST /api/auth/register
 * Registers a new user. Expects JSON body with required user fields
 * (e.g. username, password, email, firstName). Returns 201 on success
 * or 400 with { error: '...' } on validation failure.
 */
router.post('/register', (req, res, next) => {
	if (authController && typeof authController.register === 'function') {
		return authController.register(req, res, next);
	}
	res.status(501).json({ error: 'Not implemented: authController.register' });
});

/**
 * POST /api/auth/logout
 * Logs out the current user by destroying their session.
 * Returns 200 on success.
 */
router.post('/logout', (req, res) => {
	if (authController && typeof authController.logout === 'function') {
		return authController.logout(req, res);
	}
	res.status(501).json({ error: 'Not implemented: authController.logout' });
});

/**
 * GET /api/auth/users/:username/image
 * Returns the profile image URL (or image payload) for a given username.
 * Route param: `:username`. Returns 200 with { imageUrl: '...' } or
 * 404/400 with { error: '...' } if not found/invalid.
 */
router.get('/users/:username/image', (req, res) => {
	if (authController && typeof authController.getUserImageUrl === 'function') {
		return authController.getUserImageUrl(req, res);
	}
	res.status(501).json({ error: 'Not implemented: authController.getUserImageUrl' });
});

module.exports = router;
