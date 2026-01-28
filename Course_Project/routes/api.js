const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const playlistRoutes = require('./playlists');

// Mount auth routes at /api/auth
router.use('/auth', authRoutes);

// Mount playlist routes at /api/playlists
router.use('/playlists', playlistRoutes);

module.exports = router;
