const express = require('express');
const router = express.Router();
const { createChallenge, respondToChallenge } = require('../controllers/challengeController');
const authMiddleware = require('../middleware/auth');

// Route to create a challenge
router.post('/challenge', authMiddleware, createChallenge);

// Route to respond to a challenge (accept/decline)
router.post('/challenge/:challengeLink/respond', authMiddleware, respondToChallenge);

module.exports = router;
