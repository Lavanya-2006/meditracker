const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, getMe, logout, forgotPassword, resetPassword, updatePassword, updatePreferences } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const registerValidation = [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['doctor', 'patient']).withMessage('Role must be doctor or patient'),
  body('firstName').trim().notEmpty().withMessage('First name required'),
  body('lastName').trim().notEmpty().withMessage('Last name required')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
];

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.post('/forgot-password', body('email').isEmail().normalizeEmail(), validate, forgotPassword);
router.put('/reset-password/:token', body('password').isLength({ min: 6 }), validate, resetPassword);
router.put('/update-password', protect, body('newPassword').isLength({ min: 6 }), validate, updatePassword);
router.put('/preferences', protect, updatePreferences);

module.exports = router;
