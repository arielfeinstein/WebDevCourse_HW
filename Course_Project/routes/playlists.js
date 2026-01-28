const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');

/**
 * GET /api/playlists
 * Returns a list of playlists. Query parameters may be supported by the
 * controller (e.g. ?owner=username). Responds with 200 and an array of
 * playlists or 501/appropriate error if not implemented.
 */
router.get('/', (req, res) => {
	if (playlistController && typeof playlistController.getPlaylists === 'function') {
		return playlistController.getPlaylists(req, res);
	}
	res.status(501).json({ error: 'Not implemented: playlistController.getPlaylists' });
});

/**
 * POST /api/playlists
 * Creates a new playlist. Expects JSON body with playlist data:
 * { name, username }. Returns 201 with the created playlist on success or
 * 400/404 on validation/user not found errors.
 */
router.post('/', (req, res) => {
	if (playlistController && typeof playlistController.createPlaylist === 'function') {
		return playlistController.createPlaylist(req, res);
	}
	res.status(501).json({ error: 'Not implemented: playlistController.createPlaylist' });
});

/**
 * DELETE /api/playlists/:id
 * Deletes the playlist identified by `:id`. Also removes the playlist ID
 * from the owning user's `playlistIDs` array in the user datastore.
 * Returns 200 on success or 404/400/401 depending on controller logic.
 */
router.delete('/:id', (req, res) => {
	if (playlistController && typeof playlistController.deletePlaylist === 'function') {
		return playlistController.deletePlaylist(req, res);
	}
	res.status(501).json({ error: 'Not implemented: playlistController.deletePlaylist' });
});

/**
 * PUT /api/playlists/:id
 * Updates playlist identified by `:id`. Expects JSON body with fields to
 * update (e.g. title, description). Returns 200 with updated playlist.
 */
router.put('/:id', (req, res) => {
	if (playlistController && typeof playlistController.updatePlaylist === 'function') {
		return playlistController.updatePlaylist(req, res);
	}
	res.status(501).json({ error: 'Not implemented: playlistController.updatePlaylist' });
});

/**
 * POST /api/playlists/:id/songs
 * Adds a song to the playlist `:id`. Expects JSON body such as
 * { youtubeId }. Returns 200/201 on
 * success or 400/404 on failure.
 */
router.post('/:id/songs', (req, res) => {
	if (playlistController && typeof playlistController.addSongToPlaylist === 'function') {
		return playlistController.addSongToPlaylist(req, res);
	}
	res.status(501).json({ error: 'Not implemented: playlistController.addSongToPlaylist' });
});

/**
 * DELETE /api/playlists/:id/songs/:songId
 * Removes song `:songId` from playlist `:id`. Returns 200/204 on success
 * or 404/400 if not found.
 */
router.delete('/:id/songs/:songId', (req, res) => {
	if (playlistController && typeof playlistController.removeSongFromPlaylist === 'function') {
		return playlistController.removeSongFromPlaylist(req, res);
	}
	res.status(501).json({ error: 'Not implemented: playlistController.removeSongFromPlaylist' });
});

/**
 * PUT /api/playlists/:id/songs/:songId
 * Updates song `:songId` in playlist `:id`. Expects JSON body with fields to
 * update (e.g. rating). Returns 200 with updated playlist/song.
 */
router.put('/:id/songs/:songId', (req, res) => {
	if (playlistController && typeof playlistController.updateSongInPlaylist === 'function') {
		return playlistController.updateSongInPlaylist(req, res);
	}
	res.status(501).json({ error: 'Not implemented: playlistController.updateSongInPlaylist' });
});

/**
 * GET /api/playlists/users/:username
 * Returns all playlists belonging to user `:username`. Responds with 200
 * and an array of playlists or 404/400 if user not found.
 */
router.get('/users/:username', (req, res) => {
	if (playlistController && typeof playlistController.getPlaylistsForUser === 'function') {
		return playlistController.getPlaylistsForUser(req, res);
	}
	res.status(501).json({ error: 'Not implemented: playlistController.getPlaylistsForUser' });
});

module.exports = router;
