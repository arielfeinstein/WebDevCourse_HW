
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const playlistController = require('../controllers/playlistController');

// POST /api/login
// Authenticates a user. Expects JSON body: { username, password }.
// On success returns 200 with { message, ...user } (controller-defined).
// On failure returns 400/401 with { error: '...' }.
router.post('/login', (req, res) => {
	if (authController && typeof authController.login === 'function') {
		return authController.login(req, res);
	}
	res.status(501).json({ error: 'Not implemented: authController.login' });
});

// POST /api/register
// Registers a new user. Expects JSON body with required user fields
// (e.g. username, password, email, firstName). Returns 201 on success
// or 400 with { error: '...' } on validation failure.
router.post('/register', (req, res, next) => {
	if (authController && typeof authController.register === 'function') {
		return authController.register(req, res, next);
	}
	res.status(501).json({ error: 'Not implemented: authController.register' });
});

// POST /api/logout
// Logs out the current user by destroying their session.
// Returns 200 on success.
router.post('/logout', (req, res) => {
	if (authController && typeof authController.logout === 'function') {
		return authController.logout(req, res);
	}
	res.status(501).json({ error: 'Not implemented: authController.logout' });
});

// GET /api/users/:username/image
// Returns the profile image URL (or image payload) for a given username.
// Route param: `:username`. Returns 200 with { imageUrl: '...' } or
// 404/400 with { error: '...' } if not found/invalid.
router.get('/users/:username/image', (req, res) => {
	if (authController && typeof authController.getUserImageUrl === 'function') {
		return authController.getUserImageUrl(req, res);
	}
	res.status(501).json({ error: 'Not implemented: authController.getUserImageUrl' });
});

// GET /api/playlists
// Returns a list of playlists. Query parameters may be supported by the
// controller (e.g. ?owner=username). Responds with 200 and an array of
// playlists or 501/appropriate error if not implemented.
router.get('/playlists', (req, res) => {
	if (playlistController && typeof playlistController.getPlaylists === 'function') {
		return playlistController.getPlaylists(req, res);
	}
	res.status(501).json({ error: 'Not implemented: playlistController.getPlaylists' });
});


// POST /api/playlists
// Creates a new playlist. Expects JSON body with playlist data:
// { name, username }. Returns 201 with the created playlist on success or
// 400/404 on validation/user not found errors.
router.post('/playlists', (req, res) => {
	if (playlistController && typeof playlistController.createPlaylist === 'function') {
		return playlistController.createPlaylist(req, res);
	}
	res.status(501).json({ error: 'Not implemented: playlistController.createPlaylist' });
});


// DELETE /api/playlists/:id
// Deletes the playlist identified by `:id`. Also removes the playlist ID
// from the owning user's `playlistIDs` array in the user datastore.
// Returns 200 on success or 404/400/401 depending on controller logic.
router.delete('/playlists/:id', (req, res) => {
	if (playlistController && typeof playlistController.deletePlaylist === 'function') {
		return playlistController.deletePlaylist(req, res);
	}
	res.status(501).json({ error: 'Not implemented: playlistController.deletePlaylist' });
});


// PUT /api/playlists/:id
// Updates playlist identified by `:id`. Expects JSON body with fields to
// update (e.g. title, description). Returns 200 with updated playlist.
router.put('/playlists/:id', (req, res) => {
	if (playlistController && typeof playlistController.updatePlaylist === 'function') {
		return playlistController.updatePlaylist(req, res);
	}
	res.status(501).json({ error: 'Not implemented: playlistController.updatePlaylist' });
});


// POST /api/playlists/:id/songs
// Adds a song to the playlist `:id`. Expects JSON body such as
// { youtubeId }. Returns 200/201 on
// success or 400/404 on failure.
router.post('/playlists/:id/songs', (req, res) => {
	if (playlistController && typeof playlistController.addSongToPlaylist === 'function') {
		return playlistController.addSongToPlaylist(req, res);
	}
	res.status(501).json({ error: 'Not implemented: playlistController.addSongToPlaylist' });
});


// DELETE /api/playlists/:id/songs/:songId
// Removes song `:songId` from playlist `:id`. Returns 200/204 on success
// or 404/400 if not found.
router.delete('/playlists/:id/songs/:songId', (req, res) => {
	if (playlistController && typeof playlistController.removeSongFromPlaylist === 'function') {
		return playlistController.removeSongFromPlaylist(req, res);
	}
	res.status(501).json({ error: 'Not implemented: playlistController.removeSongFromPlaylist' });
});

// PUT /api/playlists/:id/songs/:songId
// Updates song `:songId` in playlist `:id`. Expects JSON body with fields to
// update (e.g. rating). Returns 200 with updated playlist/song.
router.put('/playlists/:id/songs/:songId', (req, res) => {
	if (playlistController && typeof playlistController.updateSongInPlaylist === 'function') {
		return playlistController.updateSongInPlaylist(req, res);
	}
	res.status(501).json({ error: 'Not implemented: playlistController.updateSongInPlaylist' });
});

// GET /api/users/:username/playlists
// Returns all playlists belonging to user `:username`. Responds with 200
// and an array of playlists or 404/400 if user not found.
router.get('/users/:username/playlists', (req, res) => {
	if (playlistController && typeof playlistController.getPlaylistsForUser === 'function') {
		return playlistController.getPlaylistsForUser(req, res);
	}
	res.status(501).json({ error: 'Not implemented: playlistController.getPlaylistsForUser' });
});

module.exports = router;
