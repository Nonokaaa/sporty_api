let express = require('express');
let router = express.Router();
const User = require('../models/User');

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
      res.json(user);
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
        
        res.json({ 
          message: 'Login successful',
          user: {
            id: user._id,
            email: user.email
          }
        });
      });
    })
    .catch(next);
});

module.exports = router;