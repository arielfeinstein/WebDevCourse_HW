/**
 * Main orchestrator for the playlists page.
 * Coordinates between state, API, UI, and player modules.
 * 
 * Dependencies (loaded before this file):
 * - playlistState.js  - Shared state management
 * - playlistApi.js    - API communication
 * - playlistPlayer.js - YouTube player handling
 * - playlistUI.js     - UI rendering
 * - common.js         - Shared utilities (logout)
 */

document.addEventListener('DOMContentLoaded', async () => {
    // ============================================
    // AUTHENTICATION CHECK
    // ============================================
    
    const currUsername = sessionStorage.getItem('currUsername');
    if (!currUsername) {
        window.location.href = '/login';
        return;
    }
    PlaylistState.currUsername = currUsername;

    // ============================================
    // INITIALIZE MODULES
    // ============================================
    
    PlaylistUI.init(handlePlaylistSelect);
    PlaylistPlayer.init();
    
    // ============================================
    // SETUP USER DISPLAY
    // ============================================
    
    const imageUrl = await PlaylistApi.fetchUserImage(currUsername);
    PlaylistUI.updateUserDisplay(currUsername, imageUrl);

    // ============================================
    // LOAD INITIAL DATA
    // ============================================
    
    await loadPlaylists();
    selectInitialPlaylist();

    // ============================================
    // SETUP EVENT LISTENERS
    // ============================================
    
    setupEventListeners();
});


// ================================================
// DATA LOADING FUNCTIONS
// ================================================

/**
 * Load all playlists for the current user
 */
async function loadPlaylists() {
    PlaylistState.allPlaylists = await PlaylistApi.fetchUserPlaylists(PlaylistState.currUsername);
    PlaylistUI.renderPlaylistSidebar();
}

/**
 * Select initial playlist based on URL param or first available
 */
function selectInitialPlaylist() {
    const urlParams = new URLSearchParams(window.location.search);
    const playlistIdFromUrl = urlParams.get('id');

    if (playlistIdFromUrl) {
        handlePlaylistSelect(playlistIdFromUrl, false);
    } else if (PlaylistState.allPlaylists.length > 0) {
        handlePlaylistSelect(PlaylistState.allPlaylists[0].id, false);
    }
}

/**
 * Load video details for the current playlist
 */
async function loadPlaylistVideos() {
    PlaylistUI.showVideoLoading();
    PlaylistState.selectedPlaylistVideos = [];
    PlaylistState.visibleVideos = [];

    const currentPlaylist = PlaylistState.currentPlaylist;
    
    if (!currentPlaylist.songs || currentPlaylist.songs.length === 0) {
        PlaylistUI.showEmptyPlaylist();
        return;
    }

    // Fetch video details from YouTube API
    const videoIds = currentPlaylist.songs.map(s => s.youtubeId).join(',');
    const videoDetails = await PlaylistApi.fetchVideoDetails(videoIds);

    if (videoDetails.length === 0) {
        PlaylistUI.showVideoError('Failed to load video details. Check API Key.');
        return;
    }

    // Merge API results with playlist song data
    PlaylistState.selectedPlaylistVideos = currentPlaylist.songs.map(song => {
        const details = videoDetails.find(item => item.id === song.youtubeId);
        return {
            ...song,
            title: details ? details.snippet.title : 'Unknown Title',
            thumbnail: details ? details.snippet.thumbnails.default.url : 'https://via.placeholder.com/120x90'
        };
    });

    // Apply current sort if any
    if (PlaylistState.currentSortType !== 'none') {
        sortVideos(PlaylistState.currentSortType);
    }

    renderVideoList();
}


// ================================================
// PLAYLIST SELECTION & MANAGEMENT
// ================================================

/**
 * Handle playlist selection (callback for UI)
 * @param {string} playlistId - ID of selected playlist
 * @param {boolean} shouldPlay - Whether to start playback immediately
 */
async function handlePlaylistSelect(playlistId, shouldPlay = false) {
    PlaylistState.currentPlaylist = PlaylistState.allPlaylists.find(p => p.id === playlistId);
    if (!PlaylistState.currentPlaylist) return;

    // Reset playback state when switching playlists
    PlaylistPlayer.closePlayer();
    PlaylistState.resetPlayback();

    // Update UI
    PlaylistUI.setActivePlaylist(playlistId);
    PlaylistUI.showPlaylistContent(PlaylistState.currentPlaylist.name);

    // Update URL without page reload
    updateUrlWithPlaylistId(playlistId);

    // Load videos
    await loadPlaylistVideos();

    // Start playback if requested
    if (shouldPlay && PlaylistState.visibleVideos.length > 0) {
        PlaylistPlayer.startFromBeginning();
    }
}

/**
 * Update browser URL with playlist ID
 * @param {string} playlistId 
 */
function updateUrlWithPlaylistId(playlistId) {
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('id', playlistId);
    window.history.pushState({}, '', newUrl);
}

/**
 * Clear playlist ID from URL
 */
function clearUrlPlaylistId() {
    const newUrl = new URL(window.location);
    newUrl.searchParams.delete('id');
    window.history.pushState({}, '', newUrl);
}


// ================================================
// VIDEO MANAGEMENT
// ================================================

/**
 * Render the video list with current filters
 */
function renderVideoList() {
    PlaylistUI.renderVideos(handleRatingChange, handleVideoDelete, handleVideoPlay);
}

/**
 * Handle playing a specific video from the list
 * @param {string} entryId 
 */
function handleVideoPlay(entryId) {
    const state = PlaylistState;
    const index = state.visibleVideos.findIndex(v => v.entryId === entryId);
    
    if (index !== -1) {
        // Update queue to start from this video
        state.playbackQueue = state.visibleVideos.slice(index);
        state.currentVideoIndex = 0;
        
        if (state.playbackQueue.length > 0) {
            PlaylistPlayer.playVideo(state.playbackQueue[0].youtubeId, true);
        }
    }
}

/**
 * Sort videos by the specified type
 * @param {string} sortType - 'name' or 'rating'
 */
function sortVideos(sortType) {
    PlaylistState.currentSortType = sortType;
    PlaylistUI.updateSortButtonText(sortType);

    if (sortType === 'name') {
        PlaylistState.selectedPlaylistVideos.sort((a, b) => 
            a.title.localeCompare(b.title)
        );
    } else if (sortType === 'rating') {
        PlaylistState.selectedPlaylistVideos.sort((a, b) => {
            const ratingA = a.rating !== undefined ? a.rating : 0;
            const ratingB = b.rating !== undefined ? b.rating : 0;
            return ratingB - ratingA; // Descending order
        });
    }
}

/**
 * Handle rating change for a video
 * @param {string} entryId - Video entry ID
 * @param {string} newRating - New rating value
 */
async function handleRatingChange(entryId, newRating) {
    const success = await PlaylistApi.updateSongRating(
        PlaylistState.currentPlaylist.id,
        entryId,
        newRating
    );

    if (!success) {
        alert('Failed to update rating');
        return;
    }

    // Update local state
    const video = PlaylistState.selectedPlaylistVideos.find(v => v.entryId === entryId);
    if (video) {
        video.rating = parseInt(newRating);

        // Also update in the playlist object
        const songInPlaylist = PlaylistState.currentPlaylist.songs.find(s => s.entryId === entryId);
        if (songInPlaylist) {
            songInPlaylist.rating = parseInt(newRating);
        }

        // Re-sort if sorting by rating
        if (PlaylistState.currentSortType === 'rating') {
            sortVideos('rating');
        }

        renderVideoList();
    }
}

/**
 * Handle video deletion
 * @param {string} entryId - Video entry ID
 */
async function handleVideoDelete(entryId) {
    if (!confirm('Are you sure you want to remove this video?')) {
        return;
    }

    const success = await PlaylistApi.removeSongFromPlaylist(
        PlaylistState.currentPlaylist.id,
        entryId
    );

    if (!success) {
        alert('Failed to delete video');
        return;
    }

    // Handle player queue adjustment
    PlaylistPlayer.handleVideoDeleted(entryId);

    // Remove from local state
    PlaylistState.selectedPlaylistVideos = PlaylistState.selectedPlaylistVideos.filter(
        v => v.entryId !== entryId
    );
    PlaylistState.currentPlaylist.songs = PlaylistState.currentPlaylist.songs.filter(
        s => s.entryId !== entryId
    );

    renderVideoList();
}


// ================================================
// PLAYLIST CRUD OPERATIONS
// ================================================

/**
 * Create a new playlist
 */
async function createPlaylist() {
    const nameInput = document.getElementById('playlist-name');
    const name = nameInput.value.trim();
    
    if (!name) return;

    const newPlaylist = await PlaylistApi.createPlaylist(name, PlaylistState.currUsername);
    
    if (!newPlaylist) {
        alert('Failed to create playlist');
        return;
    }

    // Update state and UI
    PlaylistState.allPlaylists.push(newPlaylist);
    PlaylistUI.renderPlaylistSidebar();

    // Close modal
    const modalEl = document.getElementById('newPlaylistModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
    nameInput.value = '';

    // Select the new playlist
    handlePlaylistSelect(newPlaylist.id, false);
}

/**
 * Delete the currently selected playlist
 */
async function deleteCurrentPlaylist() {
    if (!confirm('Are you sure you want to delete this entire playlist?')) {
        return;
    }

    const success = await PlaylistApi.deletePlaylist(PlaylistState.currentPlaylist.id);
    
    if (!success) {
        alert('Failed to delete playlist');
        return;
    }

    // Remove from local state
    PlaylistState.allPlaylists = PlaylistState.allPlaylists.filter(
        p => p.id !== PlaylistState.currentPlaylist.id
    );
    PlaylistState.currentPlaylist = null;

    // Update UI
    PlaylistUI.renderPlaylistSidebar();

    if (PlaylistState.allPlaylists.length > 0) {
        handlePlaylistSelect(PlaylistState.allPlaylists[0].id, false);
    } else {
        PlaylistUI.showNoPlaylistSelected();
        clearUrlPlaylistId();
    }
}


// ================================================
// EVENT LISTENERS SETUP
// ================================================

/**
 * Setup all event listeners for the page
 */
function setupEventListeners() {
    // Playlist management
    document.getElementById('create-playlist-btn').addEventListener('click', createPlaylist);
    document.getElementById('delete-playlist-btn').addEventListener('click', deleteCurrentPlaylist);

    // Playback controls
    document.getElementById('start-over-btn').addEventListener('click', () => {
        PlaylistPlayer.startFromBeginning();
    });

    document.getElementById('resume-btn').addEventListener('click', () => {
        PlaylistPlayer.resumePlayback();
    });

    document.getElementById('close-player-btn').addEventListener('click', () => {
        PlaylistPlayer.closePlayer();
    });

    document.getElementById('prev-video-btn').addEventListener('click', () => {
        PlaylistPlayer.playPreviousVideo();
    });

    document.getElementById('next-video-btn').addEventListener('click', () => {
        PlaylistPlayer.playNextVideo();
    });

    // Filtering
    document.getElementById('filter-input').addEventListener('input', renderVideoList);

    // Sorting
    document.querySelectorAll('.sort-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            const sortType = e.target.dataset.sort;
            sortVideos(sortType);
            renderVideoList();
        });
    });
}
