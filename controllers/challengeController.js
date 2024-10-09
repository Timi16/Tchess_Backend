const crypto = require('crypto'); // Ensure crypto is imported
const Game = require('../models/Game');
const Challenge = require('../models/Challenge');
const User = require('../models/User');

// Create a new challenge
exports.createChallenge = async (req, res) => {
  try {
    // Log req.user to ensure that it is populated correctly from the middleware
    console.log('req.user:', req.user);

    const challengerId = req.user.id; // Ensure the challenger ID comes from the token
    const challengeLink = crypto.randomBytes(10).toString('hex'); // Generate a unique link

    // Check for duplicate challenge link in the database
    const existingChallenge = await Challenge.findOne({ link: challengeLink });
    if (existingChallenge) {
      return res.status(400).json({ error: 'Challenge link already exists' });
    }

    // Create a new challenge
    const challenge = new Challenge({
      challenger: challengerId,
      link: challengeLink,
    });

    // Save the challenge to the database
    await challenge.save();

    // Send back the challenge creation confirmation and link
    res.json({
      message: 'Challenge created!',
      challengeLink: `${req.protocol}://${req.get('host')}/challenge/${challengeLink}`
    });
  } catch (error) {
    console.error('Error creating challenge:', error); // Log any errors
    res.status(500).json({ error: 'Failed to create challenge' }); // Return error if any issue occurs
  }
};

// Respond to a challenge (accept or decline)
exports.respondToChallenge = async (req, res) => {
  const { challengeLink } = req.params; // Get the challenge link from the request URL
  const { response } = req.body; // Get the response (accept/decline) from the request body
  const opponentId = req.user.id; // Get the opponent's ID from the token

  try {
    // Find the challenge by the provided link
    const challenge = await Challenge.findOne({ link: challengeLink });
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    // Check if the challenge is still pending
    if (challenge.status !== 'pending') {
      return res.status(400).json({ error: `Challenge already ${challenge.status}` });
    }

    // Handle acceptance of the challenge
    if (response === 'accept') {
      // Create a new game with the challenger and opponent
      const game = new Game({
        players: [challenge.challenger, opponentId],
        clockTimes: { player1: 300, player2: 300 } // Example of a 5-minute timer for each player
      });

      // Save the game to the database
      await game.save();

      // Update the challenge status and assign the opponent
      challenge.status = 'accepted';
      challenge.opponent = opponentId;
      await challenge.save();

      // Notify both players via Socket.IO that the game has started
      req.io.to(challengeLink).emit('gameStarted', { gameId: game._id });

      // Respond with success and the game ID
      res.json({ message: 'Challenge accepted, game started', gameId: game._id });
    } else {
      // Handle decline of the challenge
      challenge.status = 'declined';
      await challenge.save();
      res.json({ message: 'Challenge declined' });
    }
  } catch (error) {
    console.error('Error responding to challenge:', error); // Log any errors
    res.status(500).json({ error: 'Error responding to challenge' }); // Return error if any issue occurs
  }
};
