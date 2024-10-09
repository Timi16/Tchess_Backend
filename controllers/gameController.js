const Game = require('../models/Game');
const chess = require('chess.js').Chess;

exports.createGame = async (req, res) => {
  const { opponentId, clockTime } = req.body;
  try {
    const game = new Game({
      players: [req.user.id, opponentId],
      clockTimes: { player1: clockTime, player2: clockTime }
    });
    await game.save();
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: 'Error creating game' });
  }
};

exports.makeMove = async (req, res) => {
  const { gameId, move, playerId } = req.body;
  try {
    const game = await Game.findById(gameId);
    const chessGame = new chess();
    chessGame.load_pgn(game.moves.join(' '));

    if (chessGame.turn() !== playerId || !chessGame.move(move)) {
      return res.status(400).json({ error: 'Invalid move' });
    }

    game.moves.push(move);
    await game.save();
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: 'Error making move' });
  }
};

exports.getGame = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id).populate('players');
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: 'Error fetching game' });
  }
};
