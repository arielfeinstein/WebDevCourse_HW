// imports
const config = require('./config/envConfig');
const express = require('express');
const path = require('path');
const fs = require('fs');
const apiRoutes = require('./routes/api');
const searchController = require('./controllers/searchController');
const playlistController = require('./controllers/playlistController');
const sessionMiddleware = require('./config/session');
const requireAuth = require('./middleware/requireAuth');
const redirectIfAuth = require('./middleware/redirectIfAuth');
const { initializeDatabase } = require('./config/database');

// load environment variables from config
const PORT = config.port;

// init express app and set port
const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// parse JSON and urlencoded request bodies
app.use(express.json());

// Serve static files (CSS, JS, images) from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Session management
app.use(sessionMiddleware);

// use custom API routes 
app.use('/api', apiRoutes);

// View rendering routes
app.get('/', (req, res) => {
  res.render('index');
});

// Redirect authenticated users away from login/register pages
app.get('/login', redirectIfAuth, (req, res) => {
  res.render('login');
});

// Redirect authenticated users away from login/register pages
app.get('/register', redirectIfAuth, (req, res) => {
  // Read available avatars from the avatars directory
  const avatarsDir = path.join(__dirname, 'public/assets/avatars');
  let avatars = [];
  
  try {
    const files = fs.readdirSync(avatarsDir);
    avatars = files.filter(file => file.endsWith('.svg'));
  } catch (error) {
    console.error('Error reading avatars directory:', error);
  }
  
  res.render('register', { avatars });
});

// Protected route: search page
app.get('/search', requireAuth, searchController.renderSearchPage);

// Protected route: playlists page
app.get('/playlists', requireAuth, playlistController.renderPlaylistsPage);

// Initialize database and start server
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });