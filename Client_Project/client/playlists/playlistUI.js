/**
 * UI rendering functions for the playlists page.
 * Handles sidebar, video list, and user interface updates.
 */

const PlaylistUI = {
    // DOM element references (initialized in init())
    elements: {
        playlistList: null,
        playlistContent: null,
        noPlaylistSelected: null,
        currentPlaylistName: null,
        videoList: null,
        filterInput: null,
        sortDropdownBtn: null
    },

    // Callback for when a playlist is selected
    onPlaylistSelect: null,

    /**
     * Initialize UI elements
     * @param {Function} onPlaylistSelect - Callback when playlist is selected
     */
    init(onPlaylistSelect) {
        this.elements.playlistList = document.getElementById('playlist-list');
        this.elements.playlistContent = document.getElementById('playlist-content');
        this.elements.noPlaylistSelected = document.getElementById('no-playlist-selected');
        this.elements.currentPlaylistName = document.getElementById('current-playlist-name');
        this.elements.videoList = document.getElementById('video-list');
        this.elements.filterInput = document.getElementById('filter-input');
        this.elements.sortDropdownBtn = document.getElementById('sort-dropdown-btn');
        
        this.onPlaylistSelect = onPlaylistSelect;
    },

    /**
     * Update the welcome message and user image
     * @param {string} username 
     * @param {string|null} imageUrl 
     */
    updateUserDisplay(username, imageUrl) {
        document.getElementById('welcome-msg').textContent = `Hello ${username}`;
        
        if (imageUrl) {
            document.getElementById('user-img').src = imageUrl;
        }
    },

    /**
     * Render the playlist sidebar
     */
    renderPlaylistSidebar() {
        const { playlistList } = this.elements;
        playlistList.innerHTML = '';

        PlaylistState.allPlaylists.forEach(playlist => {
            const item = document.createElement('button');
            item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center playlist-item';
            item.dataset.id = playlist.id;
            
            item.innerHTML = `
                <span class="text-truncate">${playlist.name}</span>
                <button class="btn btn-sm btn-outline-secondary play-playlist-btn" title="Play playlist">&#9658;</button>
            `;
            
            item.addEventListener('click', async (e) => {
                const shouldPlay = e.target.classList.contains('play-playlist-btn');
                if (shouldPlay) {
                    e.stopPropagation();
                }
                
                if (this.onPlaylistSelect) {
                    await this.onPlaylistSelect(playlist.id, shouldPlay);
                }
            });
            
            playlistList.appendChild(item);
        });
    },

    /**
     * Highlight the active playlist in the sidebar
     * @param {string} playlistId 
     */
    setActivePlaylist(playlistId) {
        document.querySelectorAll('.playlist-item').forEach(el => {
            el.classList.toggle('active', el.dataset.id === playlistId);
        });
    },

    /**
     * Show the playlist content area and hide the "no selection" message
     * @param {string} playlistName 
     */
    showPlaylistContent(playlistName) {
        this.elements.noPlaylistSelected.classList.add('d-none');
        this.elements.playlistContent.classList.remove('d-none');
        this.elements.currentPlaylistName.textContent = playlistName;
    },

    /**
     * Show the "no playlist selected" message
     */
    showNoPlaylistSelected() {
        this.elements.noPlaylistSelected.classList.remove('d-none');
        this.elements.playlistContent.classList.add('d-none');
    },

    /**
     * Show loading state in video list
     */
    showVideoLoading() {
        this.elements.videoList.innerHTML = '<div class="text-center">Loading videos...</div>';
    },

    /**
     * Show empty playlist message
     */
    showEmptyPlaylist() {
        this.elements.videoList.innerHTML = '<div class="text-center">No videos in this playlist.</div>';
    },

    /**
     * Show error message in video list
     * @param {string} message 
     */
    showVideoError(message) {
        this.elements.videoList.innerHTML = `<div class="text-center text-danger">${message}</div>`;
    },

    /**
     * Render the video list
     * @param {Function} onRatingChange - Callback for rating changes
     * @param {Function} onVideoDelete - Callback for video deletion
     * @param {Function} onVideoPlay - Callback for video playback
     */
    renderVideos(onRatingChange, onVideoDelete, onVideoPlay) {
        const filterText = this.elements.filterInput.value.toLowerCase();
        
        // Update visible videos based on filter
        PlaylistState.visibleVideos = PlaylistState.selectedPlaylistVideos.filter(
            v => v.title.toLowerCase().includes(filterText)
        );

        this.elements.videoList.innerHTML = '';

        if (PlaylistState.visibleVideos.length === 0) {
            this.elements.videoList.innerHTML = '<div class="text-center">No videos found.</div>';
            return;
        }

        PlaylistState.visibleVideos.forEach(video => {
            const item = this.createVideoListItem(video, onRatingChange, onVideoDelete, onVideoPlay);
            this.elements.videoList.appendChild(item);
        });
    },

    /**
     * Create a single video list item element
     * @param {Object} video - Video data
     * @param {Function} onRatingChange - Rating change callback
     * @param {Function} onVideoDelete - Delete callback
     * @param {Function} onVideoPlay - Play callback
     * @returns {HTMLElement}
     */
    createVideoListItem(video, onRatingChange, onVideoDelete, onVideoPlay) {
        const ratingVal = video.rating !== undefined ? video.rating : '-';

        const item = document.createElement('div');
        item.className = 'list-group-item d-flex align-items-center';

        item.innerHTML = `
            <button class="btn btn-sm btn-primary me-3 play-song-btn" title="Play">&#9658;</button>
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

        // Event listeners
        item.querySelector('.play-song-btn').addEventListener('click', () => {
            if (onVideoPlay) onVideoPlay(video.entryId);
        });

        item.querySelector('.rating-select').addEventListener('change', (e) => {
            onRatingChange(video.entryId, e.target.value);
        });

        item.querySelector('.delete-video-btn').addEventListener('click', () => {
            onVideoDelete(video.entryId);
        });

        return item;
    },

    /**
     * Update the sort dropdown button text
     * @param {string} sortType - 'name', 'rating', or 'none'
     */
    updateSortButtonText(sortType) {
        const sortLabels = {
            'name': 'Alphabetical',
            'rating': 'Rating',
            'none': 'Sort By'
        };
        
        if (this.elements.sortDropdownBtn) {
            this.elements.sortDropdownBtn.textContent = sortLabels[sortType] || 'Sort By';
        }
    },

    /**
     * Get the current filter input value
     * @returns {string}
     */
    getFilterValue() {
        return this.elements.filterInput.value;
    }
};
