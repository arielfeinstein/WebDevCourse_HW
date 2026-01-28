/**
 * Repository Index - Export all repositories from a single location
 */

const userRepository = require('./userRepository');
const playlistRepository = require('./playlistRepository');
const playlistSongRepository = require('./playlistSongRepository');

module.exports = {
    userRepository,
    playlistRepository,
    playlistSongRepository
};
