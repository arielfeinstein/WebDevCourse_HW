/**
 * YouTube Data API Service
 * Centralizes all YouTube API interactions
 */

const API_KEY = process.env.API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Search for YouTube videos
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum number of results (default: 9)
 * @returns {Promise<Array>} Array of video IDs and snippets
 */
async function searchVideos(query, maxResults = 9) {
    const searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${API_KEY}`;
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
        throw new Error(`YouTube Search API failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.items || [];
}

/**
 * Get video details by video IDs
 * @param {string|Array<string>} videoIds - Single video ID or array of video IDs
 * @param {string} parts - Comma-separated parts (snippet, contentDetails, statistics, etc.)
 * @returns {Promise<Array>} Array of video details
 */
async function getVideoDetails(videoIds, parts = 'contentDetails,statistics') {
    const ids = Array.isArray(videoIds) ? videoIds.join(',') : videoIds;
    
    if (!ids) {
        return [];
    }
    
    const detailsUrl = `${YOUTUBE_API_BASE}/videos?part=${parts}&id=${ids}&key=${API_KEY}`;
    const response = await fetch(detailsUrl);
    
    if (!response.ok) {
        throw new Error(`YouTube Videos API failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.items || [];
}

/**
 * Get complete video information including search snippet and details
 * @param {string|Array<string>} videoIds - Single video ID or array of video IDs
 * @returns {Promise<Array>} Array of complete video objects
 */
async function getCompleteVideoInfo(videoIds) {
    const ids = Array.isArray(videoIds) ? videoIds : [videoIds];
    
    if (ids.length === 0) {
        return [];
    }
    
    const details = await getVideoDetails(ids, 'snippet,contentDetails,statistics');
    
    return details.map(video => ({
        videoId: video.id,
        title: video.snippet.title,
        thumbnail: video.snippet.thumbnails.medium.url,
        channelTitle: video.snippet.channelTitle,
        description: video.snippet.description,
        duration: parseDuration(video.contentDetails.duration),
        viewCount: formatViewCount(video.statistics.viewCount),
        publishedAt: video.snippet.publishedAt
    }));
}

/**
 * Perform complete search with details
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum number of results
 * @returns {Promise<Array>} Array of videos with complete information
 */
async function searchWithDetails(query, maxResults = 9) {
    // 1. Search for videos
    const searchResults = await searchVideos(query, maxResults);
    
    if (searchResults.length === 0) {
        return [];
    }
    
    const videoIds = searchResults.map(item => item.id.videoId);
    
    // 2. Get video details
    const details = await getVideoDetails(videoIds, 'contentDetails,statistics');
    
    // 3. Merge search results with details
    return searchResults.map(item => {
        const detail = details.find(d => d.id === item.id.videoId);
        
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
}

/**
 * Parse ISO 8601 duration to readable format (e.g., "3:45" or "1:23:45")
 * @param {string} duration - ISO 8601 duration (e.g., "PT3M45S")
 * @returns {string} Formatted duration
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
 * @param {string|number} count - View count
 * @returns {string} Formatted view count
 */
function formatViewCount(count) {
    if (!count) return '0';
    return parseInt(count).toLocaleString();
}

module.exports = {
    searchVideos,
    getVideoDetails,
    getCompleteVideoInfo,
    searchWithDetails,
    parseDuration,
    formatViewCount
};
