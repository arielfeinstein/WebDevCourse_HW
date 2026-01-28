/*
Playlist Controller

Handles HTTP request/response for playlist-related operations.
Business logic is delegated to playlistService.
*/

const playlistService = require('../services/playlistService');

// GET /playlists (render playlists page with data)
exports.renderPlaylistsPage = async (req, res) => {
    const playlistId = req.query.id ? parseInt(req.query.id, 10) : null;
    let playlists = [];
    let selectedPlaylist = null;
    let videosWithDetails = [];
    let error = null;

    try {
        // Get all playlists for the current user
        if (req.session.user && req.session.user.id) {
            playlists = await playlistService.getPlaylistsForUser(req.session.user.id);
        }

        // If a specific playlist is selected, fetch video details
        if (playlistId) {
            const result = await playlistService.getPlaylistWithVideoDetails(playlistId);
            if (result) {
                selectedPlaylist = result.playlist;
                videosWithDetails = result.videos;
            }
        }
    } catch (err) {
        console.error('Error loading playlists:', err);
        error = err.message || 'An error occurred while loading playlists';
    }

    res.render('playlists', {
        playlists,
        selectedPlaylist,
        videos: videosWithDetails,
        error,
        user: req.session.user
    });
};

// GET /api/playlists
exports.getPlaylists = async (req, res) => {
    try {
        // Note: This returns all playlists - consider if this should be restricted
        const { playlistRepository } = require('../repositories');
        const playlists = await playlistRepository.findAll();
        res.status(200).json(playlists);
    } catch (error) {
        console.error('Error fetching playlists:', error);
        res.status(500).json({ error: 'An error occurred while fetching playlists.' });
    }
};

// POST /api/playlists
exports.createPlaylist = async (req, res) => {
    try {
        const { name, username } = req.body;
        const newPlaylist = await playlistService.createPlaylist(name, username);
        res.status(201).json(newPlaylist);
    } catch (error) {
        console.error('Error creating playlist:', error);
        
        // Handle specific errors
        if (error.message === 'Playlist name is required and cannot be empty' ||
            error.message === 'Username is required') {
            return res.status(400).json({ error: error.message });
        }
        if (error.message === 'User not found') {
            return res.status(404).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'An error occurred while creating playlist.' });
    }
};

// DELETE /api/playlists/:id
exports.deletePlaylist = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid playlist ID' });
        }

        await playlistService.deletePlaylist(id);
        res.status(200).json({ message: 'Playlist deleted successfully' });
    } catch (error) {
        console.error('Error deleting playlist:', error);
        
        if (error.message === 'Playlist not found') {
            return res.status(404).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'An error occurred while deleting playlist.' });
    }
};

// PUT /api/playlists/:id
exports.updatePlaylist = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { name } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid playlist ID' });
        }

        const updatedPlaylist = await playlistService.updatePlaylist(id, name);
        res.status(200).json(updatedPlaylist);
    } catch (error) {
        console.error('Error updating playlist:', error);
        
        if (error.message === 'Playlist name is required and cannot be empty') {
            return res.status(400).json({ error: error.message });
        }
        if (error.message === 'Playlist not found') {
            return res.status(404).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'An error occurred while updating playlist.' });
    }
};

// POST /api/playlists/:id/songs
exports.addSongToPlaylist = async (req, res) => {
    try {
        const playlistId = parseInt(req.params.id, 10);
        const { youtubeId } = req.body;

        if (isNaN(playlistId)) {
            return res.status(400).json({ error: 'Invalid playlist ID' });
        }

        const updatedPlaylist = await playlistService.addSongToPlaylist(playlistId, youtubeId);
        res.status(200).json(updatedPlaylist);
    } catch (error) {
        console.error('Error adding song to playlist:', error);
        
        if (error.message === 'youtubeId is required') {
            return res.status(400).json({ error: error.message });
        }
        if (error.message === 'Playlist not found') {
            return res.status(404).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'An error occurred while adding song to playlist.' });
    }
};

// DELETE /api/playlists/:id/songs/:songId
exports.removeSongFromPlaylist = async (req, res) => {
    try {
        const playlistId = parseInt(req.params.id, 10);
        const songId = parseInt(req.params.songId, 10);

        if (isNaN(playlistId) || isNaN(songId)) {
            return res.status(400).json({ error: 'Invalid playlist or song ID' });
        }

        const updatedPlaylist = await playlistService.removeSongFromPlaylist(playlistId, songId);
        res.status(200).json(updatedPlaylist);
    } catch (error) {
        console.error('Error removing song from playlist:', error);
        
        if (error.message === 'Playlist not found' || error.message === 'Song not found in playlist') {
            return res.status(404).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'An error occurred while removing song from playlist.' });
    }
};

// GET /api/users/:username/playlists
exports.getPlaylistsForUser = async (req, res) => {
    try {
        const { username } = req.params;
        const playlists = await playlistService.getPlaylistsByUsername(username);
        res.status(200).json(playlists);
    } catch (error) {
        console.error('Error fetching user playlists:', error);
        
        if (error.message === 'User not found') {
            return res.status(404).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'An error occurred while fetching user playlists.' });
    }
};

// PUT /api/playlists/:id/songs/:songId
exports.updateSongInPlaylist = async (req, res) => {
    try {
        const playlistId = parseInt(req.params.id, 10);
        const songId = parseInt(req.params.songId, 10);
        const { rating } = req.body;

        if (isNaN(playlistId) || isNaN(songId)) {
            return res.status(400).json({ error: 'Invalid playlist or song ID' });
        }

        const updatedSong = await playlistService.updateSongRating(playlistId, songId, rating);
        res.status(200).json(updatedSong);
    } catch (error) {
        console.error('Error updating song in playlist:', error);
        
        if (error.message === 'Rating is required' || 
            error.message === 'Rating must be a number between 1 and 10') {
            return res.status(400).json({ error: error.message });
        }
        if (error.message === 'Playlist not found' || error.message === 'Song not found in playlist') {
            return res.status(404).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'An error occurred while updating song in playlist.' });
    }
};
