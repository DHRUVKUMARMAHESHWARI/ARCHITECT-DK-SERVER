const { register, login, getMe, logout, trackDownload, upgradeToPremium, getAllUsers, approvePayment, rejectPayment } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const express = require('express');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/track-download', protect, trackDownload);
router.post('/upgrade', protect, upgradeToPremium);
router.post('/approve', protect, approvePayment);
router.post('/reject', protect, rejectPayment);
router.get('/users', protect, getAllUsers);
router.get('/logout', logout);

module.exports = router;
