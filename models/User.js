const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  elo: { type: Number, default: 1000 }, // Starting ELO rating
  winLossRatio: { type: String, default: '0:0' }, // Win-Loss ratio
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
