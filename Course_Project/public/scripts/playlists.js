/**
 * YouTube Playlist Manager - Simplified for Server-Side Rendering
 * 
 * This file handles client-side interactions for the playlist page.
 * The playlists and videos are server-rendered, so this file only manages:
 * - User authentication display
 * - YouTube playback controls  
 * - Video rating updates
 * - Video removal
 * - Playlist deletion
 * - Filtering and sorting
 */

// ================================================
// STATE
// ================================================

let player = null;
let playbackQueue = [];
let currentVideoIndex = 0;
let allVideos = []; // Cache of all video elements for filtering/sorting
// Current authenticated user (set by server in EJS template)
const currentUser = window.currentUser;

// ================================================
// INITIALIZATION
// ================================================

document.addEventListener('DOMContentLoaded', async function() {
    // Ensure user is logged in
    if (!currentUser) {
        // Not authenticated - shouldn't happen as server protects route
        window.location.href = '/';
        return;
    }

    // Cache all videos for filtering/sorting
    cacheVideoElements();
    
    // Setup event listeners
    setupEventListeners();
});

// YouTube IFrame API ready callback
window.onYouTubeIframeAPIReady = function() {
    console.log('YouTube IFrame API is ready');
};

// ================================================
// USER DISPLAY
// ================================================

// ================================================
// VIDEO CACHING
// ================================================

function cacheVideoElements() {
    allVideos = Array.from(document.querySelectorAll('.video-item'));
}

function getVisibleVideos() {
    return allVideos.filter(video => !video.classList.contains('d-none'));
}

// ================================================
// YOUTUBE PLAYER
// ================================================

function createPlayer(videoId) {
    const playerContainer = document.getElementById('player-container');
    if (!playerContainer) return;
    
    playerContainer.classList.remove('d-none');
    
    if (!player) {
        player = new YT.Player('youtube-player', {
            height: '100%',
            width: '100%',
            videoId: videoId,
            events: {
                'onStateChange': onPlayerStateChange
            }
        });
    } else if (player.loadVideoById) {
        player.loadVideoById(videoId);
        player.playVideo();
    }
}

function onPlayerStateChange(event) {
    // Auto-play next video when current finishes
    if (event.data === YT.PlayerState.ENDED) {
        playNextVideo();
    }
}

function startPlayback() {
    const visibleVideos = getVisibleVideos();
    
    if (visibleVideos.length === 0) {
        alert('No videos to play');
        return;
    }
    
    playbackQueue = visibleVideos.map(item => ({
        entryId: item.dataset.entryId,
        youtubeId: item.dataset.videoId
    }));
    
    currentVideoIndex = 0;
    createPlayer(playbackQueue[0].youtubeId);
}

function resumePlayback() {
    if (playbackQueue.length > 0 && player) {
        const playerContainer = document.getElementById('player-container');
        if (playerContainer) {
            playerContainer.classList.remove('d-none');
        }
        if (player.playVideo) {
            player.playVideo();
        }
    } else {
        startPlayback();
    }
}

function playNextVideo() {
    if (currentVideoIndex < playbackQueue.length - 1) {
        currentVideoIndex++;
        const nextVideo = playbackQueue[currentVideoIndex];
        if (player && player.loadVideoById) {
            player.loadVideoById(nextVideo.youtubeId);
            player.playVideo();
        }
    }
}

function playPreviousVideo() {
    if (currentVideoIndex > 0) {
        currentVideoIndex--;
        const prevVideo = playbackQueue[currentVideoIndex];
        if (player && player.loadVideoById) {
            player.loadVideoById(prevVideo.youtubeId);
            player.playVideo();
        }
    }
}

function closePlayer() {
    const playerContainer = document.getElementById('player-container');
    if (playerContainer) {
        playerContainer.classList.add('d-none');
    }
    if (player && player.stopVideo) {
        player.stopVideo();
    }
}

// ================================================
// FILTERING
// ================================================

function filterVideos() {
    const filterInput = document.getElementById('filter-input');
    if (!filterInput) return;
    
    const filterText = filterInput.value.toLowerCase();
    
    allVideos.forEach(video => {
        const title = (video.dataset.videoTitle || '').toLowerCase();
        if (title.includes(filterText)) {
            video.classList.remove('d-none');
        } else {
            video.classList.add('d-none');
        }
    });
}

// ================================================
// SORTING
// ================================================

function sortVideos(sortType) {
    const videoList = document.getElementById('video-list');
    if (!videoList) return;
    
    // Update button text
    const sortButton = document.getElementById('sort-dropdown-btn');
    if (sortButton) {
        sortButton.textContent = sortType === 'name' ? 'Sort: Alphabetical' : 'Sort: Rating';
    }
    
    // Get all video items
    const videos = Array.from(videoList.querySelectorAll('.video-item'));
    
    // Sort based on type
    videos.sort((a, b) => {
        if (sortType === 'name') {
            const titleA = (a.dataset.videoTitle || '').toLowerCase();
            const titleB = (b.dataset.videoTitle || '').toLowerCase();
            return titleA.localeCompare(titleB);
        } else if (sortType === 'rating') {
            const ratingA = parseInt(a.querySelector('.rating-input')?.value || '0');
            const ratingB = parseInt(b.querySelector('.rating-input')?.value || '0');
            return ratingB - ratingA; // Descending
        }
        return 0;
    });
    
    // Re-append in sorted order
    videos.forEach(video => videoList.appendChild(video));
    
    // Update cache
    cacheVideoElements();
}

// ================================================
// RATING UPDATE
// ================================================

async function updateRating(entryId, newRating) {
    const playlistId = getCurrentPlaylistId();
    if (!playlistId) return;
    
    try {
        const response = await fetch(`/api/playlists/${playlistId}/songs/${entryId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating: parseInt(newRating) })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update rating');
        }
        
        console.log('Rating updated successfully');
    } catch (error) {
        console.error('Error updating rating:', error);
        alert('Failed to update rating');
    }
}

// ================================================
// VIDEO REMOVAL
// ================================================

async function removeVideo(entryId) {
    if (!confirm('Are you sure you want to remove this video?')) {
        return;
    }
    
    const playlistId = getCurrentPlaylistId();
    if (!playlistId) return;
    
    try {
        const response = await fetch(`/api/playlists/${playlistId}/songs/${entryId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to remove video');
        }
        
        // Remove from DOM
        const videoItem = document.querySelector(`.video-item[data-entry-id="${entryId}"]`);
        if (videoItem) {
            videoItem.remove();
        }
        
        // Update cache
        cacheVideoElements();
        
        // Reload page to reflect changes
        window.location.reload();
    } catch (error) {
        console.error('Error removing video:', error);
        alert('Failed to remove video');
    }
}

// ================================================
// PLAYLIST MANAGEMENT
// ================================================

function getCurrentPlaylistId() {
    const deleteBtn = document.getElementById('delete-playlist-btn');
    return deleteBtn ? deleteBtn.dataset.playlistId : null;
}

async function createPlaylist() {
    const nameInput = document.getElementById('playlist-name');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('Please enter a playlist name');
        return;
    }
    
    if (!currentUser) {
        alert('Please log in to create playlists');
        return;
    }
    
    try {
        const response = await fetch('/api/playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, username: currentUser.username })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create playlist');
        }
        
        const newPlaylist = await response.json();
        
        // Close modal
        const modalEl = document.getElementById('newPlaylistModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) {
            modal.hide();
        }
        
        // Redirect to new playlist
        window.location.href = `/playlists?id=${newPlaylist.id}`;
    } catch (error) {
        console.error('Error creating playlist:', error);
        alert('Failed to create playlist');
    }
}

async function deletePlaylist() {
    const playlistId = getCurrentPlaylistId();
    if (!playlistId) return;
    
    if (!confirm('Are you sure you want to delete this entire playlist?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/playlists/${playlistId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete playlist');
        }
        
        // Redirect to playlists page
        window.location.href = '/playlists';
    } catch (error) {
        console.error('Error deleting playlist:', error);
        alert('Failed to delete playlist');
    }
}

// ================================================
// EVENT LISTENERS
// ================================================

function setupEventListeners() {
    // Playback controls
    const startOverBtn = document.getElementById('start-over-btn');
    if (startOverBtn) {
        startOverBtn.addEventListener('click', startPlayback);
    }
    
    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', resumePlayback);
    }
    
    const closePlayerBtn = document.getElementById('close-player-btn');
    if (closePlayerBtn) {
        closePlayerBtn.addEventListener('click', closePlayer);
    }
    
    const prevBtn = document.getElementById('prev-video-btn');
    if (prevBtn) {
        prevBtn.addEventListener('click', playPreviousVideo);
    }
    
    const nextBtn = document.getElementById('next-video-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', playNextVideo);
    }
    
    // Playlist management
    const createBtn = document.getElementById('create-playlist-btn');
    if (createBtn) {
        createBtn.addEventListener('click', createPlaylist);
    }
    
    const deleteBtn = document.getElementById('delete-playlist-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', deletePlaylist);
    }
    
    // Filtering
    const filterInput = document.getElementById('filter-input');
    if (filterInput) {
        filterInput.addEventListener('input', filterVideos);
    }
    
    // Sorting
    document.querySelectorAll('.sort-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            const sortType = e.target.dataset.sort;
            sortVideos(sortType);
        });
    });
    
    // Rating inputs (event delegation)
    const videoList = document.getElementById('video-list');
    if (videoList) {
        videoList.addEventListener('change', (e) => {
            if (e.target.classList.contains('rating-input')) {
                const entryId = e.target.dataset.entryId;
                const newRating = e.target.value;
                if (entryId && newRating) {
                    updateRating(entryId, newRating);
                }
            }
        });
    }
    
    // Remove video buttons (event delegation)
    if (videoList) {
        videoList.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-video-btn') || 
                e.target.closest('.remove-video-btn')) {
                const btn = e.target.classList.contains('remove-video-btn') ? 
                    e.target : e.target.closest('.remove-video-btn');
                const entryId = btn.dataset.entryId;
                if (entryId) {
                    removeVideo(entryId);
                }
            }
        });
    }
}
