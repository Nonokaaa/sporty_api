let express = require('express');
let router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middlewares/auth');

router.post('/register', function(req, res, next) {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  } 
  
  User.findOne({ email })
  .then(existingUser => {
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    // If email doesn't exist, create new user
    const user = new User({ email, password });
    return user.save()
      .then(newUser => {
        // Generate JWT token after successful registration
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '3h' });
        res.json({ message: 'Registration successful', token, user: newUser });
      });
  })
  .catch(next);
});

router.post('/login', function(req, res, next) {
  const { email, password } = req.body;

  User
    .findOne({ email })
    .then(user => {
      if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
      }

      user.comparePassword(password, (err, isMatch) => {
        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '3h' });
        res.json({ message: 'Login successful', token, user });
      });
    })
    .catch(next);
});

router.post('/verify-token', function(req, res, next) {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  const verification = verifyToken(token);
  if (verification.isValid) {
    return res.status(200).json({
      valid: true,
      user: verification.decoded,
    });
  } else {
    res.status(401).json({ 
      valid: false,
      error: verification.error || 'Invalid token',
    });
  }
});

module.exports = router;