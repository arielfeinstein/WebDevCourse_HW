// imports
const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api');


// init express app and set port
const app = express();
const PORT = process.env.PORT || 3000;

// parse JSON and urlencoded request bodies
app.use(express.json());

// use custom API routes 
app.use('/api', apiRoutes);

// sends client to the root client HTML file
app.use(express.static(path.join(__dirname, '../client'))); 
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});