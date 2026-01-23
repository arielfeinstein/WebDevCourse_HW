// imports
require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api');
const searchController = require('./controllers/searchController');
const playlistController = require('./controllers/playlistController');

// load environment variables
const apiKey = process.env.API_KEY;
const PORT = process.env.PORT || 3000;

// init express app and set port
const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// parse JSON and urlencoded request bodies
app.use(express.json());

// Serve static files (CSS, JS, images) from public directory
app.use(express.static(path.join(__dirname, '../public')));

// use custom API routes 
app.use('/api', apiRoutes);

// View rendering routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/search', searchController.renderSearchPage);

app.get('/playlists', playlistController.renderPlaylistsPage);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});