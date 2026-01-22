/**
 * YouTube Data API Controller
 * Handles server-side YouTube API requests to keep API key secure
 */

/**
 * Search for YouTube videos
 * GET /api/youtube/search?q=query&maxResults=9
 */
async function searchVideos(req, res) {
    try {
        const { q, maxResults = 9 } = req.query;
        
        if (!q) {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }

        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults}&q=${encodeURIComponent(q)}&type=video&key=${process.env.API_KEY}`;
        
        // Note: This header must match the allowed origins configured in the Google Cloud Console.
        // If the API key restriction changes to IP-based, this manual header may no longer be necessary.
        const response = await fetch(searchUrl,
            { headers: { 'Referer': 'http://localhost' } }
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({ 
                error: 'YouTube API request failed', 
                details: errorData 
            });
        }

        const data = await response.json();
        res.json(data);
        
    } catch (error) {
        console.error('Error in searchVideos:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}

/**
 * Get video details by IDs
 * GET /api/youtube/videos?id=videoId1,videoId2&part=snippet,contentDetails,statistics
 */
async function getVideoDetails(req, res) {
    try {
        const { id, part = 'snippet' } = req.query;
        
        if (!id) {
            return res.status(400).json({ error: 'Query parameter "id" is required' });
        }

        const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=${encodeURIComponent(part)}&id=${encodeURIComponent(id)}&key=${process.env.API_KEY}`;
        
        // Note: This header must match the allowed origins configured in the Google Cloud Console.
        // If the API key restriction changes to IP-based, this manual header may no longer be necessary.
        const response = await fetch(videosUrl,
            { headers: { 'Referer': 'http://localhost' } }
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({ 
                error: 'YouTube API request failed', 
                details: errorData 
            });
        }

        const data = await response.json();
        res.json(data);
        
    } catch (error) {
        console.error('Error in getVideoDetails:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}

module.exports = {
    searchVideos,
    getVideoDetails
};
