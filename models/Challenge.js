const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  challenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  opponent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // Optional until someone accepts
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  link: { type: String, required: true, unique: true },  // The unique challenge link
  createdAt: { type: Date, default: Date.now, expires: '1h' }  // Challenge expires after 1 hour
});

module.exports = mongoose.model('Challenge', challengeSchema);
