// Middleware to redirect authenticated users away from login/register pages
module.exports = function redirectIfAuth(req, res, next) {
  if (req.session.user) {
    return res.redirect("/search");
  }
  next();
};
