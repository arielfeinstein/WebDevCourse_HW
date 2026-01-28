const session = require("express-session");
const SQLiteStore = require('connect-sqlite3')(session);
const config = require('./envConfig');
const { ensureDataDirExists } = require('../utils/fileHelpers');

const dataDir = ensureDataDirExists();

module.exports = session({
  store: new SQLiteStore({
    db: 'sessions.sqlite',
    dir: dataDir, 
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
