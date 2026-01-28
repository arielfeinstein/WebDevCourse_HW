const { dbAsync } = require('../config/database');

/**
 * Playlist Repository - Handles all database operations for playlists
 */
class PlaylistRepository {
    /**
     * Create a new playlist
     * @param {Object} playlistData
     * @param {number} playlistData.userId - Owner's user ID
     * @param {string} playlistData.title - Playlist title
     * @returns {Promise<Object>} Created playlist with id
     */
    async create(playlistData) {
        const { userId, title } = playlistData;
        
        const result = await dbAsync.run(
            'INSERT INTO playlists (user_id, title) VALUES (?, ?)',
            [userId, title]
        );

        return {
            id: result.lastID,
            userId,
            title,
            songs: []
        };
    }

    /**
     * Find playlist by ID
     * @param {number} id - Playlist ID
     * @returns {Promise<Object|null>} Playlist object or null
     */
    async findById(id) {
        const row = await dbAsync.get(
            'SELECT id, user_id, title FROM playlists WHERE id = ?',
            [id]
        );
        
        if (!row) return null;

        const songs = await this._getSongsForPlaylist(id);
        return this._mapRowToPlaylist(row, songs);
    }

    /**
     * Get all playlists
     * @returns {Promise<Array>} Array of playlist objects
     */
    async findAll() {
        const rows = await dbAsync.all('SELECT id, user_id, title FROM playlists');
        
        const playlists = [];
        for (const row of rows) {
            const songs = await this._getSongsForPlaylist(row.id);
            playlists.push(this._mapRowToPlaylist(row, songs));
        }
        
        return playlists;
    }

    /**
     * Get all playlists for a specific user
     * @param {number} userId - User ID
     * @returns {Promise<Array>} Array of playlist objects
     */
    async findByUserId(userId) {
        const rows = await dbAsync.all(
            'SELECT id, user_id, title FROM playlists WHERE user_id = ?',
            [userId]
        );
        
        const playlists = [];
        for (const row of rows) {
            const songs = await this._getSongsForPlaylist(row.id);
            playlists.push(this._mapRowToPlaylist(row, songs));
        }
        
        return playlists;
    }

    /**
     * Update playlist
     * @param {number} id - Playlist ID
     * @param {Object} updates - Fields to update (title)
     * @returns {Promise<Object|null>} Updated playlist or null if not found
     */
    async update(id, updates) {
        const { title } = updates;
        
        if (!title) {
            return this.findById(id);
        }

        const result = await dbAsync.run(
            'UPDATE playlists SET title = ? WHERE id = ?',
            [title, id]
        );

        if (result.changes === 0) {
            return null;
        }

        return this.findById(id);
    }

    /**
     * Delete playlist
     * @param {number} id - Playlist ID
     * @returns {Promise<boolean>} True if deleted, false if not found
     */
    async delete(id) {
        const result = await dbAsync.run('DELETE FROM playlists WHERE id = ?', [id]);
        return result.changes > 0;
    }

    /**
     * Check if playlist belongs to user
     * @param {number} playlistId
     * @param {number} userId
     * @returns {Promise<boolean>}
     */
    async belongsToUser(playlistId, userId) {
        const row = await dbAsync.get(
            'SELECT 1 FROM playlists WHERE id = ? AND user_id = ?',
            [playlistId, userId]
        );
        return !!row;
    }

    /**
     * Get songs for a playlist
     * @private
     */
    async _getSongsForPlaylist(playlistId) {
        const rows = await dbAsync.all(
            'SELECT id, youtube_id, rating FROM playlist_songs WHERE playlist_id = ?',
            [playlistId]
        );
        
        return rows.map(row => ({
            entryId: row.id,
            youtubeId: row.youtube_id,
            rating: row.rating
        }));
    }

    /**
     * Map database row to playlist object
     * @private
     */
    _mapRowToPlaylist(row, songs = []) {
        return {
            id: row.id,
            userId: row.user_id,
            name: row.title,  // Map 'title' to 'name' for backward compatibility
            title: row.title,
            songs
        };
    }
}

module.exports = new PlaylistRepository();
