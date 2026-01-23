const dotenv = require('dotenv');
const path = require('path');

// Load environment variables once
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Helper to ensure we don't start the server without critical info
const requiredEnv = ['SESSION_SECRET', 'YOUTUBE_DATA_API_KEY'];
requiredEnv.forEach((name) => {
  if (!process.env[name]) {
    throw new Error(`Environment Variable ${name} is missing!`);
  }
});

module.exports = {
  port: process.env.PORT || 3000,
  sessionSecret: process.env.SESSION_SECRET,
  youtubeApiKey: process.env.YOUTUBE_DATA_API_KEY,
  isProduction: process.env.NODE_ENV === 'production'
};