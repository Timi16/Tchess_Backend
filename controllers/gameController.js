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

exports.getGameHistory = async (req, res) => {
  try {
    const userId = req.user.id;  // Logged-in user's ID

    // Find all games where the user is one of the players
    const games = await Game.find({ players: userId })
      .populate('players', 'username')  // Populate player information (e.g., usernames)
      .sort({ createdAt: -1 });  // Sort by most recent games first

    // Format the response
    const gameHistory = games.map(game => {
      // Find the opponent (the other player)
      const opponent = game.players.find(player => player._id.toString() !== userId.toString());

      return {
        gameId: game._id,
        opponent: opponent.username,
        result: game.result,  // win, loss, draw
        winner: game.winner ? game.winner.username : 'N/A',
        moves: game.moves,  // List of moves in PGN format
        createdAt: game.createdAt
      };
    });

    res.json(gameHistory);  // Return the game history as JSON
  } catch (error) {
    res.status(500).json({ error: 'Error fetching game history' });
  }
};

