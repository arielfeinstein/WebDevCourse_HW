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
            searchResults = await performYouTubeSearch(query);
        } catch (err) {
            console.error('Search error:', err);
            error = err.message || 'An error occurred while searching';
        }
    }

    res.render('search', {
        query: query || '',
        results: searchResults,
        error: error
    });
};

/**
 * Performs YouTube search and gets video details
 * @param {string} query - Search query
 * @returns {Array} Array of video objects with details
 */
async function performYouTubeSearch(query) {
    const API_KEY = process.env.API_KEY;
    const maxResults = 9;

    // 1. Search for videos
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${API_KEY}`;
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
        throw new Error(`YouTube Search API failed: ${searchResponse.statusText}`);
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.items || searchData.items.length === 0) {
        return [];
    }

    const videoIds = searchData.items.map(item => item.id.videoId).join(',');

    // 2. Get video details (duration, view count, etc.)
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds}&key=${API_KEY}`;
    const detailsResponse = await fetch(detailsUrl);
    
    if (!detailsResponse.ok) {
        throw new Error(`YouTube Videos API failed: ${detailsResponse.statusText}`);
    }
    
    const detailsData = await detailsResponse.json();

    // 3. Merge search results with details
    const videos = searchData.items.map(item => {
        const detail = detailsData.items.find(d => d.id === item.id.videoId);
        
        return {
            videoId: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium.url,
            channelTitle: item.snippet.channelTitle,
            description: item.snippet.description,
            duration: detail ? parseDuration(detail.contentDetails.duration) : '0:00',
            viewCount: detail ? formatViewCount(detail.statistics.viewCount) : '0',
            publishedAt: item.snippet.publishedAt
        };
    });

    return videos;
}

/**
 * Parse ISO 8601 duration to readable format (e.g., "3:45" or "1:23:45")
 */
function parseDuration(duration) {
    if (!duration) return '0:00';
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '0:00';
    
    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');

    let result = '';
    if (hours) {
        result += hours + ':';
        result += (minutes || '0').padStart(2, '0') + ':';
    } else {
        result += (minutes || '0') + ':';
    }
    result += (seconds || '0').padStart(2, '0');
    return result;
}

/**
 * Format view count with commas (e.g., "1,234,567")
 */
function formatViewCount(count) {
    if (!count) return '0';
    return parseInt(count).toLocaleString();
}
