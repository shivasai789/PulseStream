const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  let token =
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer '))
      ? req.headers.authorization.split(' ')[1]
      : req.query.token;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    delete req.query.token;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

module.exports = auth;
