# YouTube Playlist Manager

**Students:**
- [Student Name 1]
- [Student Name 2]

## Overview

A web application for managing YouTube playlists. Users can register, log in, search for YouTube videos, create playlists, and organize their favorite videos. Built with Node.js/Express following the MVC (Model-View-Controller) architecture pattern.

## Architecture

The application implements the **MVC pattern**:

- **Model**: SQLite database accessed through repository classes
- **View**: EJS templates rendered server-side
- **Controller**: Express route handlers coordinating between services and views

**Technology Stack:**
- Backend: Node.js, Express.js, SQLite3
- Frontend: EJS, Bootstrap 5, Vanilla JavaScript
- Authentication: express-session with bcrypt password hashing
- External API: YouTube Data API v3

## Project Structure

```
Course_Project/
├── index.js                     # Application entry point
├── package.json                 
│
├── config/                      # Configuration
│   ├── database.js              # SQLite connection & schema
│   ├── envConfig.js             # Environment variables
│   └── session.js               # Session middleware
│
├── controllers/                 # Controllers (handle HTTP requests)
│   ├── authController.js        
│   ├── playlistController.js    
│   └── searchController.js      
│
├── services/                    # Services (business logic)
│   ├── authService.js           
│   ├── playlistService.js       
│   └── youtubeDataService.js    
│
├── repositories/                # Models (data access layer)
│   ├── userRepository.js        
│   ├── playlistRepository.js    
│   └── playlistSongRepository.js
│
├── routes/                      # Route definitions
│   ├── auth.js                  
│   ├── playlists.js             
│   └── views.js                 
│
├── views/                       # Views (EJS templates)
│   ├── index.ejs                
│   ├── login.ejs                
│   ├── register.ejs             
│   ├── search.ejs               
│   └── playlists.ejs            
│
├── middleware/                  # Express middleware
│   ├── requireAuth.js           
│   └── redirectIfAuth.js        
│
├── public/                      # Static assets
│   ├── scripts/                 # Client-side JavaScript
│   └── assets/                  
│
└── data/                        # Database files (auto-generated)
    ├── database.sqlite          
    └── sessions.sqlite          
```

## Database Schema

**Users Table:**
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT,
    img_url TEXT,
    password TEXT NOT NULL
);
```

**Playlists Table:**
```sql
CREATE TABLE playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Playlist Songs Table:**
```sql
CREATE TABLE playlist_songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playlist_id INTEGER NOT NULL,
    youtube_id TEXT NOT NULL,
    rating INTEGER CHECK(rating >= 1 AND rating <= 10),
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
);
```

## User Workflow

1. **Registration & Login**
   - User navigates to `/register` and creates an account
   - Credentials are validated and password is hashed with bcrypt
   - User logs in at `/login`, creating a server-side session

2. **Search Videos**
   - Authenticated user accesses `/search`
   - Enters search query (e.g., artist name, song title)
   - Application fetches results from YouTube Data API v3
   - Results display with thumbnails, titles, and metadata

3. **Manage Playlists**
   - User creates playlists from `/playlists` page
   - Adds videos from search results to playlists
   - Rates videos on a 1-10 scale
   - Views, edits, and deletes playlists and songs

4. **Play Videos**
   - User selects videos from playlists
   - Videos play using YouTube IFrame Player API
   - Playback controls available for navigation

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```
   API_KEY=your_youtube_api_key
   PORT=3000
   SESSION_SECRET=your_secret_key
   ```

3. Run the application:
   ```bash
   npm start
   ```

4. Access at `http://localhost:3000`

