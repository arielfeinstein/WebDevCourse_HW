// imports
const config = require('./config/envConfig');
const express = require('express');
const path = require('path');
const sessionMiddleware = require('./config/session');
const { initializeDatabase } = require('./config/database');

// Route imports
const authRoutes = require('./routes/auth');
const playlistRoutes = require('./routes/playlists');
const viewRoutes = require('./routes/views');

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

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/', viewRoutes);

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