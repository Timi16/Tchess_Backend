const express = require('express');
const { createGame, makeMove, getGame } = require('../controllers/gameController');
const { getGameHistory } = require('../controllers/gameController');
const router = express.Router();
const auth = require('../middleware/auth');

router.post('/create', auth, createGame);
router.post('/move', auth, makeMove);
router.get('/:id', auth, getGame);
router.get('/history', auth, getGameHistory);

module.exports = router;