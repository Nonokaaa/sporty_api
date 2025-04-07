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
