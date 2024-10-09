const Game = require('../models/game');
const Challenge = require('../models/challenge');
const User = require('../models/user');

exports.createChallenge = async (req, res) => {
  try {
    const challengerId = req.user.id;
    const challengeLink = crypto.randomBytes(10).toString('hex');  // Unique link

    const challenge = new Challenge({
      challenger: challengerId,
      link: challengeLink,
    });

    await challenge.save();

    res.json({
      message: 'Challenge created!',
      challengeLink: `${req.protocol}://${req.get('host')}/challenge/${challengeLink}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create challenge' });
  }
};

exports.respondToChallenge = async (req, res) => {
  const { challengeLink } = req.params;
  const { response } = req.body;
  const opponentId = req.user.id;

  try {
    const challenge = await Challenge.findOne({ link: challengeLink });
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    if (challenge.status !== 'pending') {
      return res.status(400).json({ error: `Challenge already ${challenge.status}` });
    }

    if (response === 'accept') {
      const game = new Game({
        players: [challenge.challenger, opponentId],
        clockTimes: { player1: 300, player2: 300 }
      });

      await game.save();

      challenge.status = 'accepted';
      challenge.opponent = opponentId;
      await challenge.save();

      // Notify both players via Socket.IO that the game has started
      req.io.to(challengeLink).emit('gameStarted', { gameId: game._id });

      res.json({ message: 'Challenge accepted, game started', gameId: game._id });
    } else {
      challenge.status = 'declined';
      await challenge.save();
      res.json({ message: 'Challenge declined' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error responding to challenge' });
  }
};
