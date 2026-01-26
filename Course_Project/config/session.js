const session = require("express-session");
const config = require('./envConfig');

module.exports = session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60, // 1 hour
  },
});
