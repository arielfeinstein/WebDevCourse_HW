const API_KEY = 'AIzaSyCUsiJP9RrSGpvEJjhxcavPNwfphXsxexM'; 
const RESULTS_CONTAINER = document.getElementById('results-container');
const SEARCH_INPUT = document.getElementById('search-input');
const WELCOME_MSG = document.getElementById('welcome-msg');
const PLAYER_MODAL_EL = document.getElementById('playerModal');
const PLAYER_MODAL = new bootstrap.Modal(PLAYER_MODAL_EL);
const PLAYER_IFRAME = document.getElementById('player-iframe');
const PLAYER_MODAL_LABEL = document.getElementById('playerModalLabel');

// Favorites Modal elements
const FAVORITES_MODAL_EL = document.getElementById('favoritesModal');
const FAVORITES_MODAL = new bootstrap.Modal(FAVORITES_MODAL_EL);
const PLAYLISTS_LIST = document.getElementById('playlists-list');
const NEW_PLAYLIST_NAME_INPUT = document.getElementById('new-playlist-name');
const CREATE_NEW_PLAYLIST_BTN = document.getElementById('create-new-playlist-btn');
const CONFIRMATION_MODAL_EL = document.getElementById('confirmationModal');
const CONFIRMATION_MODAL = new bootstrap.Modal(CONFIRMATION_MODAL_EL);

// Track current video being added
let currentVideoId = null;
let currentVideoTitle = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. User Authentication Display
    const username = sessionStorage.getItem('currUsername');
    if (username) {
        WELCOME_MSG.textContent = `Hello ${username}`;
        // Set profile image from sessionStorage (key: 'currUserImg') if available
        const userImgEl = document.getElementById('user-img');
        const currUserImg = sessionStorage.getItem('currUserImg');
        if (userImgEl && currUserImg) {
            userImgEl.src = currUserImg;
        }
    }

    // 2. URL Synchronization & Initial Search
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query) {
        SEARCH_INPUT.value = query;
        performSearch(query);
    }

    // Search Form Submission
    document.getElementById('search-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const newQuery = SEARCH_INPUT.value.trim();
        if (newQuery) {
            updateQueryString(newQuery);
            performSearch(newQuery);
        }
    });
    
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
});

function updateQueryString(query) {
    const url = new URL(window.location);
    url.searchParams.set('q', query);
    // TODO: do we need this?
    window.history.pushState({}, '', url);
}

async function performSearch(query) {
    RESULTS_CONTAINER.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    try {
        let items = [];
        
        // 1. Search for videos
            const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=9&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`);
            if (!searchRes.ok) throw new Error(`YouTube Search API failed: ${searchRes.statusText}`);
            const searchData = await searchRes.json();
            
            if (!searchData.items || searchData.items.length === 0) {
                await renderResults([]);
                return;
            }

            const videoIds = searchData.items.map(item => item.id.videoId).join(',');
            
            // 2. Get Video Details (Duration, View Count)
            const detailsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds}&key=${API_KEY}`);
            if (!detailsRes.ok) throw new Error(`YouTube Videos API failed: ${detailsRes.statusText}`);
            const detailsData = await detailsRes.json();
            
            // Merge data
            items = searchData.items.map(item => {
                const detail = detailsData.items.find(d => d.id === item.id.videoId);
                return {
                    ...item,
                    contentDetails: detail ? detail.contentDetails : {},
                    statistics: detail ? detail.statistics : {}
                };
            });

        await renderResults(items);

    } catch (error) {
        console.error('Search error:', error);
        RESULTS_CONTAINER.innerHTML = `<div class="col-12 text-center text-danger">Error occurred while searching: ${error.message}</div>`;
    }
}

async function renderResults(items) {
    const username = sessionStorage.getItem('currUsername');
    let existingIds = new Set();
    if (username) {
        try {
            const res = await fetch(`/api/users/${username}/playlists`);
            if (res.ok) {
                const playlists = await res.json();
                playlists.forEach(playlist => {
                    playlist.songs.forEach(song => {
                        existingIds.add(song.youtubeId);
                    });
                });
            }
        } catch (error) {
            console.error('Error fetching playlists:', error);
        }
    }
    RESULTS_CONTAINER.innerHTML = '';
    
    if (items.length === 0) {
        RESULTS_CONTAINER.innerHTML = '<div class="col-12 text-center">No results found.</div>';
        return;
    }

    items.forEach(item => {
        const videoId = item.id.videoId;
        const title = item.snippet.title;
        const thumbnailUrl = item.snippet.thumbnails.high.url;
        const duration = parseDuration(item.contentDetails.duration);
        const viewCount = parseInt(item.statistics.viewCount || '0').toLocaleString();

        const isAdded = existingIds.has(videoId);
        const buttonHtml = isAdded ?
            `<button class="btn btn-success btn-sm" disabled><i class="bi bi-check-circle"></i> Added</button>` :
            `<button class="btn btn-outline-danger btn-sm" onclick="addToFavorites('${videoId}', event)">Add to Favorites</button>`;

        const col = document.createElement('div');
        col.className = 'col';
        col.innerHTML = `
            <div class="card h-100 shadow-sm">
                <img src="${thumbnailUrl}" class="card-img-top video-card-img" alt="${title}" onclick="playVideo('${videoId}', '${title.replace(/'/g, "\\'")}')">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title video-title" title="${title}" onclick="playVideo('${videoId}', '${title.replace(/'/g, "\\'")}')">${title}</h5>
                    <div class="mt-auto">
                        <p class="card-text text-muted small mb-2">
                            <i class="bi bi-clock"></i> ${duration} &bull; ${viewCount} views
                        </p>
                        <div class="d-flex justify-content-between align-items-center">
                            <button class="btn btn-outline-primary btn-sm" onclick="playVideo('${videoId}', '${title.replace(/'/g, "\\'")}')">
                                Play
                            </button>
                            ${buttonHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
        RESULTS_CONTAINER.appendChild(col);
    });
}

function playVideo(videoId, title) {
    PLAYER_MODAL_LABEL.textContent = title;
    PLAYER_IFRAME.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    PLAYER_MODAL.show();
}

function addToFavorites(videoId, evt) {
    currentVideoId = videoId;
    currentVideoTitle = evt.target.closest('.card-body').querySelector('.card-title').textContent;
    
    // Load playlists and show modal
    loadAndShowPlaylistsModal();
}

async function loadAndShowPlaylistsModal() {
    const username = sessionStorage.getItem('currUsername');
    if (!username) {
        alert('Please log in to add videos to playlists.');
        return;
    }

    try {
        const res = await fetch(`/api/users/${username}/playlists`);
        if (!res.ok) throw new Error('Failed to fetch playlists');
        const userPlaylists = await res.json();

        // Clear existing playlists
        PLAYLISTS_LIST.innerHTML = '';

        if (userPlaylists && userPlaylists.length > 0) {
            const playlistsHTML = userPlaylists.map(playlist => `
                <div class="card mb-2">
                    <div class="card-body d-flex justify-content-between align-items-center p-3">
                        <div>
                            <h6 class="card-title mb-0">${playlist.name}</h6>
                            <small class="text-muted">${playlist.songs ? playlist.songs.length : 0} songs</small>
                        </div>
                        <button class="btn btn-sm btn-primary" onclick="addVideoToPlaylist('${playlist.id}', '${playlist.name}')">Add</button>
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
    const username = sessionStorage.getItem('currUsername');

    if (!playlistName) {
        alert('Please enter a playlist name.');
        return;
    }

    try {
        const res = await fetch('/api/playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: playlistName, username })
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
        const button = document.querySelector(`button[onclick*="addToFavorites('${currentVideoId}'"]`);
        if (button) {
            button.outerHTML = `<button class="btn btn-success btn-sm" disabled><i class="bi bi-check-circle"></i> Added</button>`;
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
    viewPlaylistLink.href = `playlists.html?playlist=${playlistId}`;

    CONFIRMATION_MODAL.show();
}

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
