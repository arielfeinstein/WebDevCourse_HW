/*
Playlist Controller

Handles all playlist-related operations using SQLite database through repositories.
*/

const { playlistRepository, playlistSongRepository, userRepository } = require('../repositories');
const youtubeService = require('../services/youtubeDataService');

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
            playlists = await playlistRepository.findByUserId(req.session.user.id);
        }

        // If a specific playlist is selected, fetch video details
        if (playlistId) {
            selectedPlaylist = await playlistRepository.findById(playlistId);
            
            if (selectedPlaylist && selectedPlaylist.songs && selectedPlaylist.songs.length > 0) {
                const youtubeIds = selectedPlaylist.songs.map(song => song.youtubeId);
                const videoDetails = await youtubeService.getCompleteVideoInfo(youtubeIds);
                
                // Merge with song entries (to preserve entryId and rating)
                videosWithDetails = selectedPlaylist.songs.map(song => {
                    const details = videoDetails.find(v => v.videoId === song.youtubeId);
                    return {
                        entryId: song.entryId,
                        youtubeId: song.youtubeId,
                        rating: song.rating || null,
                        ...details
                    };
                });
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

        // Check playlist name is not empty
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ error: 'Playlist name is required and cannot be empty' });
        }

        // Check username is provided
        if (!username || typeof username !== 'string' || username.trim() === '') {
            return res.status(400).json({ error: 'Username is required' });
        }

        // Verify user exists and get user ID
        const user = await userRepository.findByUsername(username);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const newPlaylist = await playlistRepository.create({
            userId: user.id,
            title: name.trim()
        });

        res.status(201).json(newPlaylist);
    } catch (error) {
        console.error('Error creating playlist:', error);
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

        const deleted = await playlistRepository.delete(id);

        if (!deleted) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        res.status(200).json({ message: 'Playlist deleted successfully' });
    } catch (error) {
        console.error('Error deleting playlist:', error);
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

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ error: 'Playlist name is required and cannot be empty' });
        }

        const updatedPlaylist = await playlistRepository.update(id, { title: name.trim() });

        if (!updatedPlaylist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        res.status(200).json(updatedPlaylist);
    } catch (error) {
        console.error('Error updating playlist:', error);
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

        if (!youtubeId || typeof youtubeId !== 'string' || youtubeId.trim() === '') {
            return res.status(400).json({ error: 'youtubeId is required' });
        }

        // Check if playlist exists
        const playlist = await playlistRepository.findById(playlistId);
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        // Add song to playlist
        await playlistSongRepository.create({
            playlistId,
            youtubeId: youtubeId.trim(),
            rating: 0
        });

        // Return updated playlist
        const updatedPlaylist = await playlistRepository.findById(playlistId);
        res.status(200).json(updatedPlaylist);
    } catch (error) {
        console.error('Error adding song to playlist:', error);
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

        // Check if playlist exists
        const playlist = await playlistRepository.findById(playlistId);
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        // Check if song exists in playlist
        const songExists = await playlistSongRepository.existsInPlaylist(songId, playlistId);
        if (!songExists) {
            return res.status(404).json({ error: 'Song not found in playlist' });
        }

        // Delete song
        await playlistSongRepository.delete(songId);

        // Return updated playlist
        const updatedPlaylist = await playlistRepository.findById(playlistId);
        res.status(200).json(updatedPlaylist);
    } catch (error) {
        console.error('Error removing song from playlist:', error);
        res.status(500).json({ error: 'An error occurred while removing song from playlist.' });
    }
};

// GET /api/users/:username/playlists
exports.getPlaylistsForUser = async (req, res) => {
    try {
        const { username } = req.params;

        // Verify user exists and get user ID
        const user = await userRepository.findByUsername(username);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const playlists = await playlistRepository.findByUserId(user.id);
        res.status(200).json(playlists);
    } catch (error) {
        console.error('Error fetching user playlists:', error);
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

        if (rating === undefined) {
            return res.status(400).json({ error: 'Rating is required' });
        }

        // Validate rating is between 1-10
        const ratingNum = parseInt(rating, 10);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 10) {
            return res.status(400).json({ error: 'Rating must be a number between 1 and 10' });
        }

        // Check if playlist exists
        const playlist = await playlistRepository.findById(playlistId);
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        // Check if song exists in playlist
        const songExists = await playlistSongRepository.existsInPlaylist(songId, playlistId);
        if (!songExists) {
            return res.status(404).json({ error: 'Song not found in playlist' });
        }

        // Update song rating
        const updatedSong = await playlistSongRepository.update(songId, { rating });

        res.status(200).json(updatedSong);
    } catch (error) {
        console.error('Error updating song in playlist:', error);
        res.status(500).json({ error: 'An error occurred while updating song in playlist.' });
    }
};
