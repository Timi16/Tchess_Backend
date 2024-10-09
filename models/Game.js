const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  moves: [String], // PGN format
  result: { type: String, enum: ['win', 'loss', 'draw'] },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  clockTimes: {
    player1: { type: Number }, // seconds
    player2: { type: Number }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Game', gameSchema);
