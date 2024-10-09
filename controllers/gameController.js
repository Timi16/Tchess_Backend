const Game = require('../models/Game');
const chess = require('chess.js').Chess;
const User = require('../models/User');
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

// Elo update logic function
const updateElo = (playerRating, opponentRating, score) => {
  const K = 32; // K-factor
  const expectedScore = 1 / (1 + 10 ** ((opponentRating - playerRating) / 400));
  const newRating = playerRating + K * (score - expectedScore);
  return Math.round(newRating);
};

// Controller function for updating Elo after a game result
exports.updateGameResults = async (req, res) => {
  const { gameId } = req.body;

  try {
    const game = await Game.findById(gameId).populate('players');
    const [player1, player2] = game.players;

    let score1, score2;

    // Determine the result and scores
    if (game.result === 'win') {
      score1 = game.winner.equals(player1._id) ? 1 : 0;
      score2 = game.winner.equals(player2._id) ? 1 : 0;
    } else if (game.result === 'draw') {
      score1 = 0.5;
      score2 = 0.5;
    }

    // Update Elo for both players
    player1.elo = updateElo(player1.elo, player2.elo, score1);
    player2.elo = updateElo(player2.elo, player1.elo, score2);

    // Save updated ratings
    await player1.save();
    await player2.save();

    res.json({ message: 'Elo ratings updated', player1Elo: player1.elo, player2Elo: player2.elo });
  } catch (error) {
    res.status(500).json({ error: 'Error updating Elo ratings' });
  }
};

exports.offerDraw = async (req, res) => {
  try {
    const { gameId } = req.body;
    const userId = req.user.id;

    const game = await Game.findById(gameId);
    if (!game || game.result !== 'ongoing') {
      return res.status(404).json({ message: 'Game not found or has ended' });
    }

    // If both players agree to the draw, end the game as a draw
    if (game.offeredDraw && game.offeredDraw.equals(userId)) {
      game.result = 'draw';
      game.endTime = Date.now();
      await game.save();
      return res.json({ message: 'Game ended in a draw', game });
    }

    // Offer a draw
    game.offeredDraw = userId;
    await game.save();
    res.json({ message: 'Draw offer sent', game });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

