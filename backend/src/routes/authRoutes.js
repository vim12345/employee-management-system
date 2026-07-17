const express = require('express');
const { login, logout, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { loginRules, handleValidation } = require('../middleware/validators');

const router = express.Router();

router.post('/login', loginRules, handleValidation, login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

module.exports = router;
