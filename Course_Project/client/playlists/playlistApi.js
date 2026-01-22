/**
 * API functions for playlist operations.
 * All server communication is handled here.
 */

const PlaylistApi = {
    /**
     * Fetch user's profile image URL
     * @param {string} username 
     * @returns {Promise<string|null>} Image URL or null if not found
     */
    async fetchUserImage(username) {
        try {
            const response = await fetch(`/api/users/${username}/image`);
            if (response.ok) {
                const data = await response.json();
                return data.imageUrl || null;
            }
        } catch (error) {
            console.error('Error fetching user image:', error);
        }
        return null;
    },

    /**
     * Fetch all playlists for a user
     * @param {string} username 
     * @returns {Promise<Array>} Array of playlist objects
     */
    async fetchUserPlaylists(username) {
        try {
            const response = await fetch(`/api/users/${username}/playlists`);
            if (response.ok) {
                return await response.json();
            }
            console.error('Failed to fetch playlists');
        } catch (error) {
            console.error('Error loading playlists:', error);
        }
        return [];
    },

    /**
     * Create a new playlist
     * @param {string} name - Playlist name
     * @param {string} username - Owner username
     * @returns {Promise<Object|null>} Created playlist or null on failure
     */
    async createPlaylist(name, username) {
        try {
            const response = await fetch('/api/playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username })
            });

            if (response.ok) {
                return await response.json();
            }
            console.error('Failed to create playlist');
        } catch (error) {
            console.error('Error creating playlist:', error);
        }
        return null;
    },

    /**
     * Delete a playlist
     * @param {string} playlistId 
     * @returns {Promise<boolean>} True if successful
     */
    async deletePlaylist(playlistId) {
        try {
            const response = await fetch(`/api/playlists/${playlistId}`, {
                method: 'DELETE'
            });
            return response.ok;
        } catch (error) {
            console.error('Error deleting playlist:', error);
            return false;
        }
    },

    /**
     * Fetch video details from YouTube API (via server proxy)
     * @param {string} videoIds - Comma-separated video IDs
     * @returns {Promise<Array>} Array of video detail objects
     */
    async fetchVideoDetails(videoIds) {
        try {
            const response = await fetch(`/api/youtube/videos?part=snippet&id=${videoIds}`);
            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.error('Error fetching video details:', error);
            return [];
        }
    },

    /**
     * Update a song's rating in a playlist
     * @param {string} playlistId 
     * @param {string} entryId - Song entry ID
     * @param {number} rating - New rating value
     * @returns {Promise<boolean>} True if successful
     */
    async updateSongRating(playlistId, entryId, rating) {
        try {
            const response = await fetch(`/api/playlists/${playlistId}/songs/${entryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating: parseInt(rating) })
            });
            return response.ok;
        } catch (error) {
            console.error('Error updating rating:', error);
            return false;
        }
    },

    /**
     * Remove a song from a playlist
     * @param {string} playlistId 
     * @param {string} entryId - Song entry ID
     * @returns {Promise<boolean>} True if successful
     */
    async removeSongFromPlaylist(playlistId, entryId) {
        try {
            const response = await fetch(`/api/playlists/${playlistId}/songs/${entryId}`, {
                method: 'DELETE'
            });
            return response.ok;
        } catch (error) {
            console.error('Error deleting video:', error);
            return false;
        }
    }
};
