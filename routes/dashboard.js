const express = require('express');
const router = express.Router();

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

// Admin dashboard
router.get('/admin', requireAuth, (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.redirect('/dashboard/' + req.session.user.role);
  }
  res.render('dashboard/admin', { user: req.session.user });
});

// User dashboard
router.get('/user', requireAuth, (req, res) => {
  if (req.session.user.role !== 'user') {
    return res.redirect('/dashboard/' + req.session.user.role);
  }
  res.render('dashboard/user', { user: req.session.user });
});

// Expert dashboard
router.get('/expert', requireAuth, (req, res) => {
  if (req.session.user.role !== 'expert') {
    return res.redirect('/dashboard/' + req.session.user.role);
  }
  res.render('dashboard/expert', { user: req.session.user });
});

module.exports = router;