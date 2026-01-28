/**
 * Playlist Service
 * Contains business logic for playlist operations
 */

const { playlistRepository, playlistSongRepository, userRepository } = require('../repositories');
const youtubeService = require('./youtubeDataService');

/**
 * Validates playlist name
 * @param {string} name - Playlist name to validate
 * @throws {Error} If validation fails
 */
function validatePlaylistName(name) {
    if (!name || typeof name !== 'string' || name.trim() === '') {
        throw new Error('Playlist name is required and cannot be empty');
    }
}

/**
 * Validates username
 * @param {string} username - Username to validate
 * @throws {Error} If validation fails
 */
function validateUsername(username) {
    if (!username || typeof username !== 'string' || username.trim() === '') {
        throw new Error('Username is required');
    }
}

/**
 * Validates YouTube ID
 * @param {string} youtubeId - YouTube video ID to validate
 * @throws {Error} If validation fails
 */
function validateYoutubeId(youtubeId) {
    if (!youtubeId || typeof youtubeId !== 'string' || youtubeId.trim() === '') {
        throw new Error('youtubeId is required');
    }
}

/**
 * Validates rating value
 * @param {*} rating - Rating value to validate
 * @throws {Error} If validation fails
 */
function validateRating(rating) {
    if (rating === undefined) {
        throw new Error('Rating is required');
    }
    
    // Validate rating is between 1-10
    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 10) {
        throw new Error('Rating must be a number between 1 and 10');
    }
}

/**
 * Get all playlists for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of playlists
 */
async function getPlaylistsForUser(userId) {
    return await playlistRepository.findByUserId(userId);
}

/**
 * Get playlist with video details
 * @param {number} playlistId - Playlist ID
 * @returns {Promise<Object>} Playlist with video details
 */
async function getPlaylistWithVideoDetails(playlistId) {
    const playlist = await playlistRepository.findById(playlistId);
    
    if (!playlist) {
        return null;
    }

    let videosWithDetails = [];
    
    if (playlist.songs && playlist.songs.length > 0) {
        const youtubeIds = playlist.songs.map(song => song.youtubeId);
        const videoDetails = await youtubeService.getCompleteVideoInfo(youtubeIds);
        
        // Merge with song entries (to preserve entryId and rating)
        videosWithDetails = playlist.songs.map(song => {
            const details = videoDetails.find(v => v.videoId === song.youtubeId);
            return {
                entryId: song.entryId,
                youtubeId: song.youtubeId,
                rating: song.rating || null,
                ...details
            };
        });
    }

    return {
        playlist,
        videos: videosWithDetails
    };
}

/**
 * Create a new playlist for a user
 * @param {string} name - Playlist name
 * @param {string} username - Username of the owner
 * @returns {Promise<Object>} Created playlist
 * @throws {Error} If validation fails or user not found
 */
async function createPlaylist(name, username) {
    validatePlaylistName(name);
    validateUsername(username);

    // Verify user exists and get user ID
    const user = await userRepository.findByUsername(username);
    if (!user) {
        throw new Error('User not found');
    }

    return await playlistRepository.create({
        userId: user.id,
        title: name.trim()
    });
}

/**
 * Update a playlist's name
 * @param {number} playlistId - Playlist ID
 * @param {string} name - New playlist name
 * @returns {Promise<Object>} Updated playlist
 * @throws {Error} If validation fails or playlist not found
 */
async function updatePlaylist(playlistId, name) {
    validatePlaylistName(name);

    const updatedPlaylist = await playlistRepository.update(playlistId, { title: name.trim() });

    if (!updatedPlaylist) {
        throw new Error('Playlist not found');
    }

    return updatedPlaylist;
}

/**
 * Delete a playlist
 * @param {number} playlistId - Playlist ID
 * @returns {Promise<boolean>} True if deleted successfully
 * @throws {Error} If playlist not found
 */
async function deletePlaylist(playlistId) {
    const deleted = await playlistRepository.delete(playlistId);

    if (!deleted) {
        throw new Error('Playlist not found');
    }

    return true;
}

/**
 * Add a song to a playlist
 * @param {number} playlistId - Playlist ID
 * @param {string} youtubeId - YouTube video ID
 * @returns {Promise<Object>} Updated playlist
 * @throws {Error} If validation fails or playlist not found
 */
async function addSongToPlaylist(playlistId, youtubeId) {
    validateYoutubeId(youtubeId);

    // Check if playlist exists
    const playlist = await playlistRepository.findById(playlistId);
    if (!playlist) {
        throw new Error('Playlist not found');
    }

    // Add song to playlist
    await playlistSongRepository.create({
        playlistId,
        youtubeId: youtubeId.trim(),
        rating: 0
    });

    // Return updated playlist
    return await playlistRepository.findById(playlistId);
}

/**
 * Remove a song from a playlist
 * @param {number} playlistId - Playlist ID
 * @param {number} songId - Song entry ID
 * @returns {Promise<Object>} Updated playlist
 * @throws {Error} If playlist or song not found
 */
async function removeSongFromPlaylist(playlistId, songId) {
    // Check if playlist exists
    const playlist = await playlistRepository.findById(playlistId);
    if (!playlist) {
        throw new Error('Playlist not found');
    }

    // Check if song exists in playlist
    const songExists = await playlistSongRepository.existsInPlaylist(songId, playlistId);
    if (!songExists) {
        throw new Error('Song not found in playlist');
    }

    // Delete song
    await playlistSongRepository.delete(songId);

    // Return updated playlist
    return await playlistRepository.findById(playlistId);
}

/**
 * Update a song's rating in a playlist
 * @param {number} playlistId - Playlist ID
 * @param {number} songId - Song entry ID
 * @param {number} rating - New rating value
 * @returns {Promise<Object>} Updated song
 * @throws {Error} If validation fails or song/playlist not found
 */
async function updateSongRating(playlistId, songId, rating) {
    validateRating(rating);

    // Check if playlist exists
    const playlist = await playlistRepository.findById(playlistId);
    if (!playlist) {
        throw new Error('Playlist not found');
    }

    // Check if song exists in playlist
    const songExists = await playlistSongRepository.existsInPlaylist(songId, playlistId);
    if (!songExists) {
        throw new Error('Song not found in playlist');
    }

    // Update song rating
    return await playlistSongRepository.update(songId, { rating });
}

/**
 * Get playlists by username
 * @param {string} username - Username
 * @returns {Promise<Array>} Array of playlists
 * @throws {Error} If user not found
 */
async function getPlaylistsByUsername(username) {
    // Verify user exists and get user ID
    const user = await userRepository.findByUsername(username);
    if (!user) {
        throw new Error('User not found');
    }

    return await playlistRepository.findByUserId(user.id);
}

module.exports = {
    getPlaylistsForUser,
    getPlaylistWithVideoDetails,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    updateSongRating,
    getPlaylistsByUsername
};
