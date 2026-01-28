const youtubeService = require('../services/youtubeDataService');
const playlistRepository = require('../repositories/playlistRepository');

/**
 * Renders the search page with optional search results
 * GET /search?q=query
 */
exports.renderSearchPage = async (req, res) => {
    const query = req.query.q;
    let searchResults = null;
    let error = null;
    let userYoutubeIds = new Set();

    // Get all YouTube IDs already in user's playlists
    try {
        userYoutubeIds = await playlistRepository.getUserYoutubeIds(req.session.user.id);
    } catch (err) {
        console.error('Error fetching user YouTube IDs:', err);
    }

    if (query && query.trim()) {
        try {
            searchResults = await youtubeService.searchWithDetails(query, 9);
        } catch (err) {
            console.error('Search error:', err);
            error = err.message || 'An error occurred while searching';
        }
    }

    res.render('search', {
        query: query || '',
        results: searchResults,
        error: error,
        user: req.session.user,
        userYoutubeIds: Array.from(userYoutubeIds) // Convert Set to Array for EJS
    });
};
