// routes/auth.js — Developer login. Credentials live ONLY in environment
// variables on the server. The frontend never sees or stores them.

const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Slow down brute-force attempts on the login endpoint.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});

router.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const validUsername = process.env.DEV_USERNAME;
  const validPassword = process.env.DEV_PASSWORD;

  if (username !== validUsername || password !== validPassword) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const token = jwt.sign(
    { role: 'developer', username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  res.json({ token, expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
});

// Lets the dashboard verify an existing token is still valid on page load.
const { requireDevAuth } = require('../middleware/auth');
router.get('/verify', requireDevAuth, (req, res) => {
  res.json({ valid: true, username: req.developer.username });
});

module.exports = router;
