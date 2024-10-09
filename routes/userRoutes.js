const express = require('express');
const { getProfile } = require('../controllers/authController');
const auth = require('../middleware/auth'); 
const { updateProfile } = require('../controllers/authController');

const router = express.Router();

router.get('/profile', auth, getProfile); 
router.put('/profile/update', auth, updateProfile);

module.exports = router;