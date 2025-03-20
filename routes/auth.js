const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middlewares/auth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');

// Inscription
router.post('/register', authController.register);

// Render register page
router.get('/register', (req, res) => {
  res.render('register');
});

// Render login page
router.get('/login', (req, res) => {
  res.render('login');
});

// Login route
router.post('/login', authController.login);

// Route protégée par JWT
router.get('/profile', auth, (req, res) => {
  // Si on arrive ici, c’est que le token est valide
  return res.json({ message: 'Your secret profile data!', user: req.user });
});

// Afficher la vue d'authentification
router.get('/auth', (req, res) => {
    res.render('auth'); // Rend le fichier auth.twig
});

module.exports = router;