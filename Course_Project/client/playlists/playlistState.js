/**
 * Shared state management for the playlists page.
 * All state is stored in a single object for easy access across modules.
 */

const PlaylistState = {
    // Current logged-in username
    currUsername: null,

    // All playlists belonging to the user
    allPlaylists: [],

    // Currently selected playlist object
    currentPlaylist: null,

    /**
     * Videos in the selected playlist with full details
     * @type {Array<{entryId: string, youtubeId: string, rating?: number, title: string, thumbnail: string}>}
     */
    selectedPlaylistVideos: [],

    // Currently visible videos (after filtering)
    visibleVideos: [],

    // Queue of videos for sequential playback
    playbackQueue: [],

    // Current sort type: 'none', 'name', or 'rating'
    currentSortType: 'none',

    // YouTube player instance
    player: null,

    // Index of currently playing video in the queue
    currentVideoIndex: -1,

    /**
     * Reset playback state (when switching playlists)
     */
    resetPlayback() {
        this.playbackQueue = [];
        this.currentVideoIndex = -1;
    },

    /**
     * Reset all state (useful for testing or logout)
     */
    resetAll() {
        this.currUsername = null;
        this.allPlaylists = [];
        this.currentPlaylist = null;
        this.selectedPlaylistVideos = [];
        this.visibleVideos = [];
        this.playbackQueue = [];
        this.currentSortType = 'none';
        this.player = null;
        this.currentVideoIndex = -1;
    }
};

// Prevent accidental reassignment of the state object
Object.seal(PlaylistState);
