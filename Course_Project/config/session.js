const session = require("express-session");
const SQLiteStore = require('connect-sqlite3')(session);
const config = require('./envConfig');
const path = require('path');

module.exports = session({
  store: new SQLiteStore({
    db: 'sessions.sqlite',
    dir: path.join(__dirname, '../data'),
    table: 'sessions',
    concurrentDB: true
  }),
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60, // 1 hour
  },
});
