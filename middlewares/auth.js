const jwt = require('jsonwebtoken');

exports.auth = async (req, res, next) => {
  let token = req.headers['authorization']?.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = decoded;
    next();
  });
};

/**
 * Verifies a JWT token and returns the decoded payload or an error
 * @param {string} token - The JWT token to verify
 * @returns {Object} - Object with success status and either decoded token or error message
 */
exports.verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { 
      isValid: true, 
      decoded,
      error: null
    };
  } catch (error) {
    return { 
      isValid: false, 
      decoded: null,
      error: error.message
    };
  }
};