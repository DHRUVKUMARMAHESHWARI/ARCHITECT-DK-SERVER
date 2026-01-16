const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    console.log("Auth Middleware: No token found in headers or cookies.");
    return res.status(401).json({ success: false, error: 'Not authorized (No Token)' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("Auth Middleware: Token decoded", decoded); 

    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      console.log("Auth Middleware: User not found with ID", decoded.id);
      return res.status(401).json({ success: false, error: 'Not authorized (User Not Found)' });
    }

    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    return res.status(401).json({ success: false, error: `Not authorized (Token Invalid: ${err.message})` });
  }
};

module.exports = { protect };
