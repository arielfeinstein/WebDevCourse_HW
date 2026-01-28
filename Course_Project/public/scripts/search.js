// DOM elements (assigned once DOM is loaded)
let WELCOME_MSG;
let PLAYER_MODAL_EL;
let PLAYER_MODAL;
let PLAYER_IFRAME;
let PLAYER_MODAL_LABEL;

// Favorites Modal elements
let FAVORITES_MODAL_EL;
let FAVORITES_MODAL;
let PLAYLISTS_LIST;
let NEW_PLAYLIST_NAME_INPUT;
let CREATE_NEW_PLAYLIST_BTN;
let CONFIRMATION_MODAL_EL;
let CONFIRMATION_MODAL;

// Track current video being added
let currentVideoId = null;
let currentVideoTitle = null;

// Store current user data (set by server in EJS template)
const currentUser = window.currentUser;

document.addEventListener('DOMContentLoaded', async () => {
    if (!currentUser) {
        // Not authenticated - shouldn't happen as server protects route
        window.location.href = '/';
        return;
    }

    // Assign DOM elements
    initializeDOMElements();
    
    // Clear iframe when modal is closed to stop playback
    PLAYER_MODAL_EL.addEventListener('hidden.bs.modal', () => {
        PLAYER_IFRAME.src = '';
        PLAYER_MODAL_LABEL.textContent = 'Video Player';
    });

    // Create new playlist button
    CREATE_NEW_PLAYLIST_BTN.addEventListener('click', handleCreateNewPlaylist);

    // Clear input when favorites modal is closed
    FAVORITES_MODAL_EL.addEventListener('hidden.bs.modal', () => {
        NEW_PLAYLIST_NAME_INPUT.value = '';
    });

    // Event delegation for video cards (play video when clicking image or title)
    document.addEventListener('click', (e) => {
        // Play video when clicking image or title
        if (e.target.classList.contains('video-card-img') || e.target.classList.contains('video-title')) {
            const videoId = e.target.dataset.videoId;
            const videoTitle = e.target.dataset.videoTitle;
            if (videoId && videoTitle) {
                playVideo(videoId, videoTitle);
            }
        }
        
        // Add to playlist when clicking the button
        if (e.target.closest('.add-to-playlist-btn')) {
            const button = e.target.closest('.add-to-playlist-btn');
            const videoId = button.dataset.videoId;
            const videoTitle = button.dataset.videoTitle;
            if (videoId && videoTitle) {
                addToFavorites(videoId, videoTitle);
            }
        }
    });
});

function initializeDOMElements() {
    WELCOME_MSG = document.getElementById('welcome-msg');
    PLAYER_MODAL_EL = document.getElementById('playerModal');
    PLAYER_IFRAME = document.getElementById('player-iframe');
    PLAYER_MODAL_LABEL = document.getElementById('playerModalLabel');
    PLAYER_MODAL = new bootstrap.Modal(PLAYER_MODAL_EL);

    // Favorites Modal elements
    FAVORITES_MODAL_EL = document.getElementById('favoritesModal');
    PLAYLISTS_LIST = document.getElementById('playlists-list');
    NEW_PLAYLIST_NAME_INPUT = document.getElementById('new-playlist-name');
    CREATE_NEW_PLAYLIST_BTN = document.getElementById('create-new-playlist-btn');
    CONFIRMATION_MODAL_EL = document.getElementById('confirmationModal');
    FAVORITES_MODAL = new bootstrap.Modal(FAVORITES_MODAL_EL);
    CONFIRMATION_MODAL = new bootstrap.Modal(CONFIRMATION_MODAL_EL);
}

/**
 * Play video in modal (called from onclick in template)
 * @param {string} videoId - YouTube video ID
 * @param {string} title - Video title
 */
function playVideo(videoId, title) {
    PLAYER_IFRAME.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    PLAYER_MODAL_LABEL.textContent = title;
    PLAYER_MODAL.show();
}

/**
 * Add video to favorites (called from onclick in template)
 * @param {string} videoId - YouTube video ID
 * @param {string} title - Video title
 */
async function addToFavorites(videoId, title) {
    currentVideoId = videoId;
    currentVideoTitle = title;
    
    // Load playlists and show modal
    await loadAndShowPlaylistsModal();
}

async function loadAndShowPlaylistsModal() {
    if (!currentUser) {
        alert('Please log in to add videos to playlists.');
        return;
    }

    try {
        const res = await fetch(`/api/playlists/users/${currentUser.username}`);
        if (!res.ok) throw new Error('Failed to fetch playlists');
        const userPlaylists = await res.json();

        // Clear existing playlists
        PLAYLISTS_LIST.innerHTML = '';

        if (userPlaylists && userPlaylists.length > 0) {
            const playlistsHTML = userPlaylists.map(playlist => `
                <div class="card mb-2">
                    <div class="card-body d-flex justify-content-between align-items-center p-3">
                        <div>
                            <h6 class="card-title mb-0">${escapeHtml(playlist.name)}</h6>
                            <small class="text-muted">${playlist.songs ? playlist.songs.length : 0} songs</small>
                        </div>
                        <button class="btn btn-sm btn-primary" onclick="addVideoToPlaylist('${playlist.id}', '${escapeHtml(playlist.name)}')">Add</button>
                    </div>
                </div>
            `).join('');
            PLAYLISTS_LIST.innerHTML = playlistsHTML;
        } else {
            PLAYLISTS_LIST.innerHTML = '<p class="text-muted">No playlists yet. Create one below.</p>';
        }

        FAVORITES_MODAL.show();
    } catch (error) {
        console.error('Error loading playlists:', error);
        alert('Error loading playlists. Please try again.');
    }
}

async function handleCreateNewPlaylist() {
    const playlistName = NEW_PLAYLIST_NAME_INPUT.value.trim();

    if (!playlistName) {
        alert('Please enter a playlist name.');
        return;
    }

    if (!currentUser) {
        alert('Please log in to create playlists.');
        return;
    }

    try {
        const res = await fetch('/api/playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: playlistName, username: currentUser.username })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to create playlist');
        }

        const newPlaylist = await res.json();
        NEW_PLAYLIST_NAME_INPUT.value = '';

        // Immediately add the video to the newly created playlist
        await addVideoToPlaylist(newPlaylist.id, newPlaylist.name);
    } catch (error) {
        console.error('Error creating playlist:', error);
        alert('Error creating playlist: ' + error.message);
    }
}

async function addVideoToPlaylist(playlistId, playlistName) {
    try {
        const res = await fetch(`/api/playlists/${playlistId}/songs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ youtubeId: currentVideoId })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to add video to playlist');
        }

        // Close the favorites modal and show confirmation
        FAVORITES_MODAL.hide();
        showConfirmation(playlistId, playlistName);
        
        // Update the button state in the search results to "Added" 
        // Find the button using data attribute
        const button = document.querySelector(`.add-to-playlist-btn[data-video-id="${currentVideoId}"]`);
        if (button) {
            button.disabled = true;
            button.className = 'btn btn-success btn-sm w-100';
            button.innerHTML = '<i class="bi bi-check-circle"></i> Added';
        }
    } catch (error) {
        console.error('Error adding video to playlist:', error);
        alert('Error adding video: ' + error.message);
    }
}

function showConfirmation(playlistId, playlistName) {
    const confirmationMsg = document.getElementById('confirmation-message');
    const viewPlaylistLink = document.getElementById('view-playlist-link');

    confirmationMsg.textContent = `"${currentVideoTitle}" added to "${playlistName}"!`;
    viewPlaylistLink.href = `/playlists?id=${playlistId}`;

    CONFIRMATION_MODAL.show();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
