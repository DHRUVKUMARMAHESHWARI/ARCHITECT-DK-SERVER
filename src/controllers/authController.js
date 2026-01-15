const User = require('../models/User');

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
    options.sameSite = 'none'; // Required for Cross-Site (Frontend -> Backend) Cookies
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide an email and password');
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Track download and enforce limit
// @route   POST /api/auth/track-download
// @access  Private
exports.trackDownload = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const { templateId } = req.body;

    // Premium Template Restriction
    if (templateId === 'deloitte' && !user.isPremium && user.email !== 'dhruv@gmail.com') {
      return res.status(403).json({
        success: false,
        error: 'This is a Premium Template. Please upgrade to use it.'
      });
    }

    if (!user.isPremium && user.downloads >= 1 && user.email !== 'dhruv@gmail.com') {
      return res.status(403).json({ 
        success: false, 
        error: 'Download limit reached. Please upgrade to Premium.' 
      });
    }

    user.downloads += 1;
    await user.save();

    res.status(200).json({
      success: true,
      downloads: user.downloads,
      isPremium: user.isPremium
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upgrade user to premium (Request Admin Approval)
// @route   POST /api/auth/upgrade
// @access  Private
exports.upgradeToPremium = async (req, res, next) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId || transactionId.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid Transaction ID / UTR.'
      });
    }

    const user = await User.findById(req.user.id);
    
    // Do NOT set isPremium to true yet. Wait for admin approval.
    user.paymentStatus = 'pending';
    user.transactionId = transactionId;
    user.paymentDate = Date.now();
    await user.save();

    res.status(200).json({
      success: true,
      data: user,
      message: 'Payment details submitted! Waiting for Admin approval.'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Approve User Payment (Admin)
// @route   POST /api/auth/approve
// @access  Private/Admin
exports.approvePayment = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (req.user.email !== 'dhruv@gmail.com') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.isPremium = true;
    user.paymentStatus = 'approved';
    await user.save();

    res.status(200).json({ success: true, message: 'User approved' });
  } catch (err) {
    next(err);
  }
};

// @desc    Reject User Payment (Admin)
// @route   POST /api/auth/reject
// @access  Private/Admin
exports.rejectPayment = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (req.user.email !== 'dhruv@gmail.com') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.paymentStatus = 'rejected';
    // Optional: Reset transaction ID? Keep it for record.
    await user.save();

    res.status(200).json({ success: true, message: 'Payment rejected' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    // Super Admin Bypass
    let responseUser = user.toObject();
    if (user.email === 'dhruv@gmail.com') {
      responseUser.isPremium = true;
    }

    res.status(200).json({
      success: true,
      data: responseUser,
      isPremium: responseUser.isPremium,
      downloads: user.downloads
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    // Basic Admin Check
    if (req.user.email !== 'dhruv@gmail.com') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const users = await User.find().select('+transactionId +paymentDate +paymentStatus').sort('-createdAt');

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (err) {
    next(err);
  }
};
