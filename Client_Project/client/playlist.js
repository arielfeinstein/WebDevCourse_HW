document.addEventListener('DOMContentLoaded', async () => {
    const currUsername = sessionStorage.getItem('currUsername');
    if (!currUsername) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('welcome-msg').textContent = `Hello ${currUsername}`;
    
    // Fetch user image
    try {
        const res = await fetch(`/api/users/${currUsername}/image`);
        if (res.ok) {
            const data = await res.json();
            if (data.imageUrl) {
                document.getElementById('user-img').src = data.imageUrl;
            }
        }
    } catch (err) {
        console.error('Error fetching user image:', err);
    }

    let allPlaylists = [];
    let currentPlaylist = null;
    /**
     * @typedef {Object} VideoItem
     * @property {string} entryId - Unique ID for this specific song entry in the playlist
     * @property {string} youtubeId - YouTube video ID
     * @property {number} [rating] - User rating (1-10), optional
     * @property {string} title - Video title from YouTube API
     * @property {string} thumbnail - Video thumbnail URL from YouTube API
     */
    /** @type {VideoItem[]} */
    let currentVideos = []; // Stores video details + rating
    let currentSortType = 'none';

    // Elements
    const playlistListEl = document.getElementById('playlist-list');
    const playlistContentEl = document.getElementById('playlist-content');
    const noPlaylistSelectedEl = document.getElementById('no-playlist-selected');
    const currentPlaylistNameEl = document.getElementById('current-playlist-name');
    const videoListEl = document.getElementById('video-list');
    const filterInput = document.getElementById('filter-input');
    const deletePlaylistBtn = document.getElementById('delete-playlist-btn');
    const createPlaylistBtn = document.getElementById('create-playlist-btn');
    const newPlaylistNameInput = document.getElementById('playlist-name');
    const sortDropdownBtn = document.getElementById('sort-dropdown-btn');
    const sortOptions = document.querySelectorAll('.sort-option');

    // Initial Load
    await loadPlaylists();

    // Check URL for playlist ID
    const urlParams = new URLSearchParams(window.location.search);
    const playlistIdFromUrl = urlParams.get('id');

    if (playlistIdFromUrl) {
        selectPlaylist(playlistIdFromUrl);
    } else if (allPlaylists.length > 0) {
        selectPlaylist(allPlaylists[0].id);
    }

    // Event Listeners
    createPlaylistBtn.addEventListener('click', createPlaylist);
    deletePlaylistBtn.addEventListener('click', deleteCurrentPlaylist);
    filterInput.addEventListener('input', renderVideos);
    
    sortOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            const sortType = e.target.dataset.sort;
            sortCurrentVideos(sortType);
            renderVideos();
        });
    });

    async function loadPlaylists() {
        try {
            const res = await fetch(`/api/users/${currUsername}/playlists`);
            if (res.ok) {
                allPlaylists = await res.json();
                renderPlaylistSidebar();
            } else {
                console.error('Failed to fetch playlists');
            }
        } catch (err) {
            console.error('Error loading playlists:', err);
        }
    }

    function renderPlaylistSidebar() {
        playlistListEl.innerHTML = '';
        allPlaylists.forEach(playlist => {
            const item = document.createElement('button');
            item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center playlist-item';
            item.dataset.id = playlist.id;
            item.innerHTML = `
                <span class="text-truncate">${playlist.name}</span>
                <button class="btn btn-sm btn-outline-secondary play-playlist-btn" title="Play (Placeholder)">&#9658;</button>
            `;
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('play-playlist-btn')) {
                    selectPlaylist(playlist.id);
                }
            });
            playlistListEl.appendChild(item);
        });
    }

    async function selectPlaylist(id) {
        currentPlaylist = allPlaylists.find(p => p.id === id);
        if (!currentPlaylist) return;

        // Update UI
        document.querySelectorAll('.playlist-item').forEach(el => {
            el.classList.toggle('active', el.dataset.id === id);
        });

        noPlaylistSelectedEl.classList.add('d-none');
        playlistContentEl.classList.remove('d-none');
        currentPlaylistNameEl.textContent = currentPlaylist.name;

        // Update URL without reloading
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('id', id);
        window.history.pushState({}, '', newUrl);

        await loadPlaylistVideos();
    }

    async function loadPlaylistVideos() {
        videoListEl.innerHTML = '<div class="text-center">Loading videos...</div>';
        currentVideos = [];

        if (!currentPlaylist.songs || currentPlaylist.songs.length === 0) {
            videoListEl.innerHTML = '<div class="text-center">No videos in this playlist.</div>';
            return;
        }

        // Fetch details for all songs
        
        // Batching requests to YouTube API, assuming no more than 50 videos per playlist for simplicity
        const videoIds = currentPlaylist.songs.map(s => s.youtubeId).join(',');
        
        try {
            const response = await fetch(`/api/youtube/videos?part=snippet&id=${videoIds}`);
            const data = await response.json();
            
            if (data.items) {
                // Map API results back to playlist songs (preserving order and entryId)
                currentVideos = currentPlaylist.songs.map(song => {
                    const details = data.items.find(item => item.id === song.youtubeId);
                    return {
                        ...song, // includes entryId, youtubeId, rating (if exists)
                        title: details ? details.snippet.title : 'Unknown Title',
                        thumbnail: details ? details.snippet.thumbnails.default.url : 'https://via.placeholder.com/120x90'
                    };
                });
                
                if (currentSortType !== 'none') {
                    sortCurrentVideos(currentSortType);
                } 
                renderVideos();
                
            } else {
                videoListEl.innerHTML = '<div class="text-center text-danger">Failed to load video details. Check API Key.</div>';
            }
        } catch (err) {
            console.error('Error fetching from YouTube:', err);
            videoListEl.innerHTML = '<div class="text-center text-danger">Error loading videos.</div>';
        }
    }

    function renderVideos() {
        const filterText = filterInput.value.toLowerCase();
        const filteredVideos = currentVideos.filter(v => v.title.toLowerCase().includes(filterText));

        videoListEl.innerHTML = '';
        
        if (filteredVideos.length === 0) {
            videoListEl.innerHTML = '<div class="text-center">No videos found.</div>';
            return;
        }

        filteredVideos.forEach(video => {
            const item = document.createElement('div');
            item.className = 'list-group-item d-flex align-items-center';
            
            const ratingVal = video.rating !== undefined ? video.rating : '-';
            
            item.innerHTML = `
                <img src="${video.thumbnail}" class="video-thumbnail me-3" alt="${video.title}">
                <div class="flex-grow-1">
                    <h5 class="mb-1">${video.title}</h5>
                    <div class="d-flex align-items-center mt-2">
                        <label class="me-2">Rating:</label>
                        <select class="form-select form-select-sm w-auto me-2 rating-select" data-entry-id="${video.entryId}">
                            <option value="" disabled ${video.rating === undefined ? 'selected' : ''}>Select</option>
                            ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => 
                                `<option value="${num}" ${video.rating == num ? 'selected' : ''}>${num}</option>`
                            ).join('')}
                        </select>
                        <span class="badge bg-secondary">${ratingVal}</span>
                    </div>
                </div>
                <button class="btn btn-danger btn-sm delete-video-btn" data-entry-id="${video.entryId}">Delete</button>
            `;
            
            // Event listeners for this item
            item.querySelector('.rating-select').addEventListener('change', (e) => {
                updateRating(video.entryId, e.target.value);
            });
            
            item.querySelector('.delete-video-btn').addEventListener('click', () => {
                deleteVideo(video.entryId);
            });

            videoListEl.appendChild(item);
        });
    }

    function sortCurrentVideos(type) {
        currentSortType = type;

        const sortLabels = {
            'name': 'Alphabetical',
            'rating': 'Rating',
            'none': 'Sort By'
        };
        if (sortDropdownBtn) sortDropdownBtn.textContent = sortLabels[type] || 'Sort By';

        if (type === 'name') {
            currentVideos.sort((a, b) => a.title.localeCompare(b.title));
        } else if (type === 'rating') {
            currentVideos.sort((a, b) => {
                const ratingA = a.rating !== undefined ? a.rating : 0;
                const ratingB = b.rating !== undefined ? b.rating : 0;
                return ratingB - ratingA; // Descending order
            });
        }
    }

    async function updateRating(entryId, newRating) {
        try {
            const res = await fetch(`/api/playlists/${currentPlaylist.id}/songs/${entryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating: parseInt(newRating) })
            });

            if (res.ok) {
                // Update local state
                const video = currentVideos.find(v => v.entryId === entryId);
                if (video) {
                    video.rating = parseInt(newRating);
                    // Also update the song in the currentPlaylist object to keep it in sync
                    const songInPlaylist = currentPlaylist.songs.find(s => s.entryId === entryId);
                    if (songInPlaylist) {
                        songInPlaylist.rating = parseInt(newRating);
                    }
                    
                    if (currentSortType === 'rating') {
                        sortCurrentVideos('rating');
                    }    
                   renderVideos(); // Re-render to update the badge
                    
                }
            } else {
                alert('Failed to update rating');
            }
        } catch (err) {
            console.error('Error updating rating:', err);
        }
    }

    async function deleteVideo(entryId) {
        if (!confirm('Are you sure you want to remove this video?')) return;

        try {
            const res = await fetch(`/api/playlists/${currentPlaylist.id}/songs/${entryId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                // Remove from local state
                currentVideos = currentVideos.filter(v => v.entryId !== entryId);
                currentPlaylist.songs = currentPlaylist.songs.filter(s => s.entryId !== entryId);
                renderVideos();
            } else {
                alert('Failed to delete video');
            }
        } catch (err) {
            console.error('Error deleting video:', err);
        }
    }

    async function deleteCurrentPlaylist() {
        if (!confirm('Are you sure you want to delete this entire playlist?')) return;

        try {
            const res = await fetch(`/api/playlists/${currentPlaylist.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                // Remove from local list
                allPlaylists = allPlaylists.filter(p => p.id !== currentPlaylist.id);
                currentPlaylist = null;
                
                // Reset UI
                renderPlaylistSidebar();
                
                if (allPlaylists.length > 0) {
                    selectPlaylist(allPlaylists[0].id);
                } else {
                    noPlaylistSelectedEl.classList.remove('d-none');
                    playlistContentEl.classList.add('d-none');
                    // Clear URL param
                    const newUrl = new URL(window.location);
                    newUrl.searchParams.delete('id');
                    window.history.pushState({}, '', newUrl);
                }
            } else {
                alert('Failed to delete playlist');
            }
        } catch (err) {
            console.error('Error deleting playlist:', err);
        }
    }

    async function createPlaylist() {
        const name = newPlaylistNameInput.value.trim();
        if (!name) return;

        try {
            const res = await fetch('/api/playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username: currUsername })
            });

            if (res.ok) {
                const newPlaylist = await res.json();
                allPlaylists.push(newPlaylist);
                renderPlaylistSidebar();
                
                // Close modal
                const modalEl = document.getElementById('newPlaylistModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                modal.hide();
                newPlaylistNameInput.value = '';

                // Select the new playlist
                selectPlaylist(newPlaylist.id);
            } else {
                alert('Failed to create playlist');
            }
        } catch (err) {
            console.error('Error creating playlist:', err);
        }
    }
});
