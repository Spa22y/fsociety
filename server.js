const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store active users and their socket IDs
let activeUsers = new Map(); // sessionId -> { socketId, type, timestamp, kicked }
let loginHistory = [];
let gameHistory = [];

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // User login
  socket.on('user-login', (data) => {
    const sessionId = data.sessionId;
    const userType = data.userType;
    const timestamp = new Date().toLocaleString('de-DE', { 
      timeZone: 'Europe/Berlin',
      hour12: false 
    });

    // Add to active users
    activeUsers.set(sessionId, {
      socketId: socket.id,
      type: userType,
      timestamp: timestamp,
      kicked: false
    });

    // Add to login history
    loginHistory.push({
      sessionId: sessionId,
      type: userType,
      timestamp: timestamp,
      isAdmin: data.isAdmin
    });

    // Notify all admins of new user
    io.emit('user-list-update', Array.from(activeUsers.entries()).map(([id, user]) => ({
      sessionId: id,
      ...user
    })));

    io.emit('login-history-update', loginHistory);

    console.log(`User logged in: ${userType} (${sessionId})`);
  });

  // Game access tracking
  socket.on('game-access', (data) => {
    const timestamp = new Date().toLocaleString('de-DE', { 
      timeZone: 'Europe/Berlin',
      hour12: false 
    });
    gameHistory.push({
      game: data.game,
      sessionId: data.sessionId,
      timestamp: timestamp
    });

    io.emit('game-history-update', gameHistory);
    console.log(`Game accessed: ${data.game}`);
  });

  // Admin requests user list
  socket.on('request-user-list', () => {
    socket.emit('user-list-update', Array.from(activeUsers.entries()).map(([id, user]) => ({
      sessionId: id,
      ...user
    })));
    socket.emit('login-history-update', loginHistory);
    socket.emit('game-history-update', gameHistory);
  });

  // Admin kicks a user
  socket.on('kick-user', (sessionId) => {
    const user = activeUsers.get(sessionId);
    if (user) {
      // Mark as kicked
      user.kicked = true;
      activeUsers.set(sessionId, user);

      // Send kick command to that specific user
      io.to(user.socketId).emit('you-are-kicked');

      // Update all admins
      io.emit('user-list-update', Array.from(activeUsers.entries()).map(([id, user]) => ({
        sessionId: id,
        ...user
      })));

      console.log(`User kicked: ${sessionId}`);
    }
  });

  // Clear history
  socket.on('clear-login-history', () => {
    loginHistory = [];
    io.emit('login-history-update', loginHistory);
  });

  socket.on('clear-game-history', () => {
    gameHistory = [];
    io.emit('game-history-update', gameHistory);
  });

  // User disconnect
  socket.on('disconnect', () => {
    // Find and remove user by socket ID
    for (let [sessionId, user] of activeUsers.entries()) {
      if (user.socketId === socket.id) {
        activeUsers.delete(sessionId);
        io.emit('user-list-update', Array.from(activeUsers.entries()).map(([id, user]) => ({
          sessionId: id,
          ...user
        })));
        console.log(`User disconnected: ${sessionId}`);
        break;
      }
    }
  });
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
