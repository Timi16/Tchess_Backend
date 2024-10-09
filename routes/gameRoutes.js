const express = require('express');
const { createGame, makeMove, getGame,offerDraw } = require('../controllers/gameController');
const { getGameHistory } = require('../controllers/gameController');
const { updateGameResults } = require('../controllers/gameController');
const router = express.Router();
const auth = require('../middleware/auth');

router.post('/create', auth, createGame);
router.post('/move', auth, makeMove);
router.get('/:id', auth, getGame);
router.get('/history', auth, getGameHistory);
router.post('/update-results', auth, updateGameResults);
// Offer a draw
router.post('/draw', auth, offerDraw);

module.exports = router;