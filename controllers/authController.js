const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// POST /register
exports.register = async (req, res) => {
  try {
    // 1. Récupérer email + password du body
    const { email, password } = req.body;

    // 2. Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // 3. Créer et sauvegarder le nouvel utilisateur
    const newUser = await User.create({ email, password });
    return res.status(201).json({ message: 'User registered', userId: newUser._id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST /login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.cookie('token', token, { httpOnly: true });
    return res.status(200).json({ message: 'Login successful' });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
