const { dbAsync } = require('../config/database');

/**
 * Playlist Song Repository - Handles all database operations for playlist songs
 */
class PlaylistSongRepository {
    /**
     * Add a song to a playlist
     * @param {Object} songData
     * @param {number} songData.playlistId - Playlist ID
     * @param {string} songData.youtubeId - YouTube video ID
     * @param {number} songData.rating - Optional rating (default 0)
     * @returns {Promise<Object>} Created song entry
     */
    async create(songData) {
        const { playlistId, youtubeId, rating = 0 } = songData;
        
        const result = await dbAsync.run(
            'INSERT INTO playlist_songs (playlist_id, youtube_id, rating) VALUES (?, ?, ?)',
            [playlistId, youtubeId, rating]
        );

        return {
            entryId: result.lastID,
            playlistId,
            youtubeId,
            rating
        };
    }

    /**
     * Find song entry by ID
     * @param {number} id - Song entry ID (entryId)
     * @returns {Promise<Object|null>} Song entry or null
     */
    async findById(id) {
        const row = await dbAsync.get(
            'SELECT id, playlist_id, youtube_id, rating FROM playlist_songs WHERE id = ?',
            [id]
        );
        
        return row ? this._mapRowToSong(row) : null;
    }

    /**
     * Find all songs in a playlist
     * @param {number} playlistId
     * @returns {Promise<Array>} Array of song entries
     */
    async findByPlaylistId(playlistId) {
        const rows = await dbAsync.all(
            'SELECT id, playlist_id, youtube_id, rating FROM playlist_songs WHERE playlist_id = ?',
            [playlistId]
        );
        
        return rows.map(row => this._mapRowToSong(row));
    }

    /**
     * Update song entry (e.g., rating)
     * @param {number} id - Song entry ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object|null>} Updated song entry or null if not found
     */
    async update(id, updates) {
        const { rating } = updates;
        
        if (rating === undefined) {
            return this.findById(id);
        }

        const result = await dbAsync.run(
            'UPDATE playlist_songs SET rating = ? WHERE id = ?',
            [rating, id]
        );

        if (result.changes === 0) {
            return null;
        }

        return this.findById(id);
    }

    /**
     * Delete song entry
     * @param {number} id - Song entry ID
     * @returns {Promise<boolean>} True if deleted, false if not found
     */
    async delete(id) {
        const result = await dbAsync.run('DELETE FROM playlist_songs WHERE id = ?', [id]);
        return result.changes > 0;
    }

    /**
     * Delete all songs from a playlist
     * @param {number} playlistId
     * @returns {Promise<number>} Number of songs deleted
     */
    async deleteByPlaylistId(playlistId) {
        const result = await dbAsync.run(
            'DELETE FROM playlist_songs WHERE playlist_id = ?',
            [playlistId]
        );
        return result.changes;
    }

    /**
     * Check if song entry exists in playlist
     * @param {number} id - Song entry ID
     * @param {number} playlistId - Playlist ID
     * @returns {Promise<boolean>}
     */
    async existsInPlaylist(id, playlistId) {
        const row = await dbAsync.get(
            'SELECT 1 FROM playlist_songs WHERE id = ? AND playlist_id = ?',
            [id, playlistId]
        );
        return !!row;
    }

    /**
     * Map database row to song object
     * @private
     */
    _mapRowToSong(row) {
        return {
            entryId: row.id,
            playlistId: row.playlist_id,
            youtubeId: row.youtube_id,
            rating: row.rating
        };
    }
}

module.exports = new PlaylistSongRepository();
