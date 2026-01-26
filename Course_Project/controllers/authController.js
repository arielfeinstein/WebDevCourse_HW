/*
User JSON structure (file: data/users.json)

Overall file shape:
An array of user objects
[
    {
        "id": "string",          // unique user id (string)
        "username": "string",    // unique username
        "email": "string",       // user's email address
        "firstName": "string",   // user's first name
        "imgUrl": "string",      // URL to user's avatar/image
        "password": "string",    // plaintext password (student project)
        "playlistIDs": ["string"]// array of playlist ids owned by the user (may be empty)
    },
    ...
]

Notes:
- the user's 'id' currently has no functional purpose beyond being a unique identifier as the specification was added later.
  for all practical purposes, 'username' is the unique identifier for users. 
- Passwords are stored in plaintext for this exercise as requested.
- `playlistIDs` is an array of playlist `id` values referencing entries in `data/playlists.json`.
- Validation helpers in this controller expect `username`, `email`, `firstName`, `imgUrl`, and `password` to be present when registering.
*/

const authService = require('../services/authService');

exports.register = (req, res) => {
    const result = authService.registerUser(req.body);

    if (!result.success) {
        return res.status(400).json({ error: result.error });
    }

    res.status(201).json({ message: 'User registered successfully.' });
};

exports.login = (req, res) => {
    const { username, password } = req.body;

    const result = authService.authenticateUser(username, password);

    if (!result.success) {
        return res.status(401).json({ error: result.error });
    }

    // Set session with user data
    req.session.user = result.user;

    res.status(200).json({ 
        message: 'Login successful.',
        user: {
            username: result.user.username,
            firstName: result.user.firstName,
            imgUrl: result.user.imgUrl
        }
    });
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.status(200).json({ message: 'Logged out successfully' });
    });
};

// return user's image URL by username
exports.getUserImageUrl = (req, res) => {
    const username = req.params && req.params.username;

    const result = authService.getUserImageUrl(username);

    if (!result.success) {
        const statusCode = result.error === 'Username is required.' ? 400 : 404;
        return res.status(statusCode).json({ error: result.error });
    }

    return res.status(200).json({ imageUrl: result.imageUrl });
};

