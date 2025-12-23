# YouTube Playlist Manager

A student project web application that allows users to search YouTube videos, create playlists, and play videos with an intuitive UI. Built with vanilla JavaScript frontend and Node.js/Express backend.

## Features

- **User Authentication**: Register and login with username/password
- **Search YouTube Videos**: Search and discover videos using YouTube Data API v3
- **Create Playlists**: Organize videos into personal playlists
- **Video Management**: Add, remove, and rate videos in playlists
- **YouTube Playback**: Watch videos directly in the app using YouTube IFrame API
- **Playback Queue**: Play videos sequentially with next/previous controls
- **User Profiles**: Display user information and profile images

## Architecture

This application follows a traditional **client-server architecture**:

```
┌─────────────────┐                 ┌──────────────────────┐
│   Client (SPA)  │                 │  Server (Express)    │
│ ────────────    │                 │ ──────────────────   │
│ • Vanilla JS    │◄──── HTTP ─────►│ • Node.js            │
│ • Bootstrap UI  │   JSON REST API │ • Controllers        │
│ • YouTube IFrame│                 │ • JSON File Storage  │
└─────────────────┘                 └──────────────────────┘
```

### Client Side
- **Location**: `client/`
- **Tech**: HTML5, CSS3 (Bootstrap 5), Vanilla JavaScript
- **No build process** - files run directly in browser

### Server Side
- **Location**: `server/`
- **Tech**: Node.js, Express.js
- **Data Storage**: JSON files (no database)
- **API Type**: REST with JSON request/response bodies

## 🛠️ Tech Stack

### Frontend
- HTML5
- Bootstrap 5.3
- Vanilla JavaScript (ES6+)
- YouTube IFrame Player API

### Backend
- Node.js
- Express.js
- YouTube Data API v3 (proxied through server)

### Data Storage
- JSON file-based (no database required)
  - `server/data/users.json` - User accounts
  - `server/data/playlists.json` - Playlists and songs

## Project Structure

```
Client_Project/
├── README.md                    # This file
├── package.json                 # Root dependencies
├── hw-steps.txt                 # Development notes
│
├── client/                     # Frontend
│   ├── index.html              # Home page with student info
│   ├── index.js                # Home page logic
│   ├── login.html              # Login page
│   ├── login.js                # Login logic
│   ├── register.html           # Registration page
│   ├── register.js             # Registration logic
│   ├── search.html             # Video search page
│   ├── search.js               # Search and video discovery logic
│   ├── common.js               # Shared utilities (logout, etc.)
│   │
│   └── playlists/              # Playlist management module
│       ├── playlists.html      # Playlist UI
│       ├── playlists.js        # Main orchestrator
│       ├── playlistState.js    # State management
│       ├── playlistApi.js      # API communication
│       ├── playlistUI.js       # UI rendering
│       └── playlistPlayer.js   # YouTube player control
│
└── server/                      # Backend API
    ├── index.js                # Express app entry point
    ├── package.json            # Server dependencies
    ├── .env                    # Environment variables (API keys)
    │
    ├── controllers/            # Business logic
    │   ├── authController.js   # User registration & login
    │   ├── playlistController.js  # Playlist CRUD
    │   └── youtubeDataController.js  # YouTube API proxy
    │
    ├── routes/                 # API route definitions
    │   └── api.js              # All REST endpoints
    │
    ├── data/                   # JSON "database" - will be created after registration of the first user
    │   ├── users.json          # User accounts - will be created after registration of the first user
    │   └── playlists.json      # Playlist data - will be created after adding the first playlist
    │
    └── utils/                  # Helper functions
        └── userHelpers.js      # JSON file operations
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm
- YouTube Data API key

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Client_Project
```

2. **Install dependencies**
```bash
# Install server dependencies
cd server
npm install
```

3. **Create `.env` file in `server/` directory**
```bash
# server/.env
API_KEY=your_youtube_api_key_here
PORT=3000
```

Get a YouTube API key:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable YouTube Data API v3
4. Create an API key (restrict to YouTube Data API)
5. Copy the key to your `.env` file

### Running the Application

```bash
# Start the server (from server/ directory)
cd server
node index.js
```

The server will start on `http://localhost:3000` (or the PORT in `.env`)

### Accessing the Application

Open your browser and navigate to:
- **Home**: `http://localhost:3000/index.html` or `http://localhost:3000/`
- **Login**: `http://localhost:3000/login.html`
- **Register**: `http://localhost:3000/register.html`
- **Search**: `http://localhost:3000/search.html` (requires login)
- **Playlists**: `http://localhost:3000/playlists/playlists.html` (requires login)

## Data Models

### User Model
```javascript
{
  "id": "unique-user-id",           // Generated by server
  "username": "john_doe",            // Unique login name
  "email": "john@example.com",       // Unique email
  "firstName": "John",               // Display name
  "imgUrl": "https://...",          // Profile image (URL or data URI)
  "password": "plaintext",           // Educational only - not production-safe
  "playlistIDs": ["id1", "id2"]     // References to user's playlists
}
```

### Playlist Model
```javascript
{
  "id": "unique-playlist-id",        // Generated by server
  "name": "My Favorite Songs",       // Playlist name
  "songs": [
    {
      "entryId": "unique-entry-id",  // ID for this specific entry
      "youtubeId": "dQw4w9WgXcQ",    // YouTube video ID
      "rating": 8                     // Optional 1-10 rating
    }
  ]
}
```

**Key Design Decision**: Using `entryId` allows the same YouTube video to be added multiple times to a playlist and removed individually. Currently the instructions of the homework do not allow this, but added for possible future changes.

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `GET /api/users/:username/image` - Get user profile image

### Playlists
- `GET /api/playlists` - Get all playlists
- `POST /api/playlists` - Create playlist
- `DELETE /api/playlists/:id` - Delete playlist
- `PUT /api/playlists/:id` - Update playlist
- `GET /api/users/:username/playlists` - Get user's playlists

### Playlist Songs
- `POST /api/playlists/:id/songs` - Add song to playlist
- `DELETE /api/playlists/:id/songs/:songId` - Remove song (by entryId)
- `PUT /api/playlists/:id/songs/:songId` - Update song (e.g., rating)

### YouTube Integration
- `GET /api/youtube/search` - Search videos (query params: `q`, `maxResults`)
- `GET /api/youtube/videos` - Get video details (query params: `id`, `part`)

## Security & Important Notes

**This is an educational student project with intentional security anti-patterns:**

- ✗ Passwords stored in **plaintext** JSON
- ✗ No session management (username in sessionStorage)
- ✗ No JWT or authentication tokens
- ✗ API key exposed to client

**Do NOT use this approach in production!** This is for learning purposes only.

**Production improvements would include:**
- Hash passwords with bcrypt
- Implement JWT authentication
- Use proper database (PostgreSQL, MongoDB, etc.)
- Keep API keys server-side only
- Add CSRF protection
- Implement HTTPS

## How to Use

### 1. Register & Login
- Go to `/register.html` and create an account
- Username, email, first name, and password are required
- Profile image is optional
- Login with your credentials

### 2. Search Videos
- Navigate to `/search.html` (requires login)
- Enter a search query (artist name, song title, etc.)
- Click search or press Enter
- Results show video thumbnail, duration, and view count

### 3. Add to Playlist
- Click "Add to Favorites" on any video search result
- Select an existing playlist or create a new one
- Video is added and you'll see a confirmation

### 4. Manage Playlists
- Go to `/playlists/playlists.html` to view your library
- Click a playlist to view its videos
- Features include:
  - Sort videos by name or rating
  - Filter videos by title
  - Rate videos (1-10)
  - Remove videos
  - Delete entire playlists
  - Play videos sequentially

### 5. Play Videos
- Select a playlist and click "Start Over" to begin playback
- Use "Previous" and "Next" buttons to navigate
- Use "Resume" to continue from where you left off
- Click "Close Player" to hide the player

## Client State Management for playlists page

The application uses **modular state management** with separate modules for different concerns:

- **playlistState.js**: Central state store for playlist data and playback queue
- **playlistApi.js**: API communication layer
- **playlistPlayer.js**: YouTube player lifecycle management
- **playlistUI.js**: DOM manipulation and rendering
- **playlists.js**: Main orchestrator connecting all modules

Each module has clear responsibilities and minimal coupling.

## Development Workflow

### Adding a New Feature

1. **Define the API route** in `server/routes/api.js`
2. **Implement controller logic** in appropriate controller file
3. **Handle JSON file operations** (read/write)
4. **Add client-side fetch call** with error handling
5. **Update UI** to reflect changes

### Example: Adding a New API Endpoint

```javascript
// 1. Add route in server/routes/api.js
router.get('/playlists/:id/stats', (req, res) => {
  if (playlistController && typeof playlistController.getStats === 'function') {
    return playlistController.getStats(req, res);
  }
  res.status(501).json({ error: 'Not implemented' });
});

// 2. Implement in server/controllers/playlistController.js
exports.getStats = (req, res) => {
  const { id } = req.params;
  const playlists = readPlaylistsFromJson();
  const playlist = playlists.find(p => p.id === id);
  
  if (!playlist) {
    return res.status(404).json({ error: 'Playlist not found' });
  }
  
  const stats = {
    songCount: (playlist.songs || []).length,
    avgRating: calculateAvgRating(playlist.songs)
  };
  
  res.status(200).json(stats);
};

// 3. Call from client
const stats = await fetch(`/api/playlists/${playlistId}/stats`);
const data = await stats.json();
```

## Common Pitfalls

1. **Forgot `sessionStorage` check** - Protected pages must check `sessionStorage.getItem('currUsername')`
2. **Missing entryId** - Always generate unique `entryId` when adding songs
3. **YouTube API quota** - Batch video ID requests to minimize API calls (e.g., `?id=id1,id2,id3`)

## File I/O Pattern

The application uses a consistent synchronous file I/O pattern:

```javascript
// Read
function readPlaylistsFromJson() {
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(data);
}

// Write
function writePlaylistsToJson(playlists) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(playlists, null, 2), 'utf8');
}

// Usage
const playlists = readPlaylistsFromJson();
// ... modify playlists ...
writePlaylistsToJson(playlists);
```