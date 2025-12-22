/**
 * YouTube player management for the playlists page.
 * Handles video playback, queue navigation, and player UI.
 */

const PlaylistPlayer = {
    // DOM element references (initialized in init())
    elements: {
        playerContainer: null,
        prevButton: null,
        nextButton: null
    },

    /**
     * Initialize player elements
     */
    init() {
        this.elements.playerContainer = document.getElementById('player-container');
        this.elements.prevButton = document.getElementById('prev-video-btn');
        this.elements.nextButton = document.getElementById('next-video-btn');
    },

    /**
     * Play a specific video by YouTube ID
     * @param {string} videoId - YouTube video ID
     * @param {boolean} autoplay - Whether to start playing immediately
     */
    playVideo(videoId, autoplay = false) {
        this.elements.playerContainer.classList.remove('d-none');

        if (PlaylistState.player && typeof PlaylistState.player.loadVideoById === 'function') {
            PlaylistState.player.loadVideoById(videoId);
            if (autoplay && typeof PlaylistState.player.playVideo === 'function') {
                PlaylistState.player.playVideo();
            }
        } else if (window.YT && window.YT.Player) {
            PlaylistState.player = new YT.Player('youtube-player', {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: {
                    autoplay: autoplay ? 1 : 0
                },
                events: {
                    'onStateChange': this.onPlayerStateChange.bind(this)
                }
            });
        } else {
            console.warn('YouTube API not ready yet');
        }

        this.updateNavigationButtons();
    },

    /**
     * Close the player and stop playback
     */
    closePlayer() {
        this.elements.playerContainer.classList.add('d-none');

        if (PlaylistState.player && typeof PlaylistState.player.stopVideo === 'function') {
            PlaylistState.player.stopVideo();
        }
    },

    /**
     * Play the previous video in the queue
     */
    playPreviousVideo() {
        const state = PlaylistState;
        
        if (state.playbackQueue.length === 0 || state.currentVideoIndex <= 0) {
            return; // At the beginning or no queue
        }

        state.currentVideoIndex--;
        this.playVideo(state.playbackQueue[state.currentVideoIndex].youtubeId);
    },

    /**
     * Play the next video in the queue
     */
    playNextVideo() {
        const state = PlaylistState;
        
        if (state.playbackQueue.length === 0 || state.currentVideoIndex >= state.playbackQueue.length - 1) {
            return; // At the end or no queue
        }

        state.currentVideoIndex++;
        this.playVideo(state.playbackQueue[state.currentVideoIndex].youtubeId);
    },

    /**
     * Start playing the playlist from the beginning
     */
    startFromBeginning() {
        const state = PlaylistState;
        
        if (state.visibleVideos.length > 0) {
            state.playbackQueue = [...state.visibleVideos];
            state.currentVideoIndex = 0;
            this.playVideo(state.playbackQueue[0].youtubeId, true);
        }
    },

    /**
     * Resume playback from current position or start from beginning
     */
    resumePlayback() {
        const state = PlaylistState;
        
        if (state.visibleVideos.length === 0) {
            return;
        }

        // No previous playback - start from beginning
        if (state.playbackQueue.length === 0 || state.currentVideoIndex === -1) {
            this.startFromBeginning();
            return;
        }

        // Resume from current position
        if (state.currentVideoIndex < state.playbackQueue.length) {
            this.playVideo(state.playbackQueue[state.currentVideoIndex].youtubeId, true);
        } else {
            // Reached end - start over
            state.currentVideoIndex = 0;
            this.playVideo(state.playbackQueue[0].youtubeId, true);
        }
    },

    /**
     * Update the enabled/disabled state of prev/next buttons
     */
    updateNavigationButtons() {
        const state = PlaylistState;
        const { prevButton, nextButton } = this.elements;

        if (prevButton && nextButton) {
            prevButton.disabled = state.playbackQueue.length === 0 || state.currentVideoIndex <= 0;
            nextButton.disabled = state.playbackQueue.length === 0 || state.currentVideoIndex >= state.playbackQueue.length - 1;
        }
    },

    /**
     * Handle YouTube player state changes
     * @param {Object} event - YouTube player event
     */
    onPlayerStateChange(event) {
        // Video ended - play next in queue
        if (event.data === YT.PlayerState.ENDED) {
            PlaylistState.currentVideoIndex++;
            
            if (PlaylistState.currentVideoIndex < PlaylistState.playbackQueue.length) {
                this.playVideo(PlaylistState.playbackQueue[PlaylistState.currentVideoIndex].youtubeId);
            } else {
                // Reached end of playlist
                PlaylistState.currentVideoIndex = -1;
            }
        }
    },

    /**
     * Handle video deletion while playing
     * Adjusts queue and continues playback appropriately
     * @param {string} entryId - Entry ID of deleted video
     */
    handleVideoDeleted(entryId) {
        const state = PlaylistState;
        const indexInQueue = state.playbackQueue.findIndex(v => v.entryId === entryId);

        if (indexInQueue === -1) {
            return; // Video not in queue
        }

        if (indexInQueue === state.currentVideoIndex) {
            // Currently playing video is being deleted
            state.playbackQueue.splice(indexInQueue, 1);

            if (state.playbackQueue.length > 0) {
                if (state.currentVideoIndex >= state.playbackQueue.length) {
                    state.currentVideoIndex = state.playbackQueue.length - 1;
                }
                if (state.currentVideoIndex < state.playbackQueue.length) {
                    this.playVideo(state.playbackQueue[state.currentVideoIndex].youtubeId);
                } else {
                    this.closePlayer();
                    state.currentVideoIndex = -1;
                }
            } else {
                this.closePlayer();
                state.currentVideoIndex = -1;
            }
        } else if (indexInQueue < state.currentVideoIndex) {
            // Deleted video is before current - adjust index
            state.playbackQueue.splice(indexInQueue, 1);
            state.currentVideoIndex--;
        } else {
            // Deleted video is after current - just remove
            state.playbackQueue.splice(indexInQueue, 1);
        }
    }
};
