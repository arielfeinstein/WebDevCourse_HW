const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const searchController = require('../controllers/searchController');
const playlistController = require('../controllers/playlistController');
const requireAuth = require('../middleware/requireAuth');
const redirectIfAuth = require('../middleware/redirectIfAuth');

/**
 * GET /
 * Home page
 */
router.get('/', (req, res) => {
  res.render('index');
});

/**
 * GET /login
 * Login page - redirects authenticated users away
 */
router.get('/login', redirectIfAuth, (req, res) => {
  res.render('login');
});

/**
 * GET /register
 * Registration page - redirects authenticated users away
 * Loads available avatars for selection
 */
router.get('/register', redirectIfAuth, (req, res) => {
  // Read available avatars from the avatars directory
  const avatarsDir = path.join(__dirname, '../public/assets/avatars');
  let avatars = [];
  
  try {
    const files = fs.readdirSync(avatarsDir);
    avatars = files.filter(file => file.endsWith('.svg'));
  } catch (error) {
    console.error('Error reading avatars directory:', error);
  }
  
  res.render('register', { avatars });
});

/**
 * GET /search
 * Protected route: search page
 */
router.get('/search', requireAuth, searchController.renderSearchPage);

/**
 * GET /playlists
 * Protected route: playlists page
 */
router.get('/playlists', requireAuth, playlistController.renderPlaylistsPage);

module.exports = router;
