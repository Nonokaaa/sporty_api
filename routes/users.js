let express = require('express');
let router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

router.post('/register', function(req, res, next) {
  const { email, password } = req.body;

  const user = new User({ email, password });
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  } else {
    user.save()
    .then(user => {
      // Generate JWT token after successful registration
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '3h' });
      res.json({ message: 'Registration successful', token, user });
    })
    .catch(next);
  }
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

module.exports = router;