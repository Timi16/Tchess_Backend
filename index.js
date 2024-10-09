const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes'); 
const gameRoutes = require('./routes/gameRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to Database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);  
app.use('/api/game', gameRoutes);
app.use('/api/', challengeRoutes);
// WebSocket events
io.on('connection', (socket) => {
  socket.on('joinGame', (gameId) => {
    socket.join(gameId);
  });

  socket.on('move', ({ gameId, move }) => {
    io.to(gameId).emit('move', move);
  });

  socket.on('clockUpdate', ({ gameId, clock }) => {
    io.to(gameId).emit('clockUpdate', clock);
  });
  socket.on('joinChallenge', (challengeLink) => {
    socket.join(challengeLink);  // Both challenger and opponent join the same room
  });

  socket.on('acceptChallenge', (challengeLink, gameId) => {
    io.to(challengeLink).emit('gameStarted', { gameId });  // Notify both players
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
