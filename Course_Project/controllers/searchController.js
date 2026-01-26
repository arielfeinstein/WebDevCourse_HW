const youtubeService = require('../services/youtubeDataService');

/**
 * Renders the search page with optional search results
 * GET /search?q=query
 */
exports.renderSearchPage = async (req, res) => {
    const query = req.query.q;
    let searchResults = null;
    let error = null;

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
        user: req.session.user
    });
};
