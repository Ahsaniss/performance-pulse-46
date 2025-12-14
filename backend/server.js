const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const connectDB = require('./src/config/db');
const app = require('./app');

// Load environment variables
dotenv.config();

// Debug: Check if API Key is loaded
if (process.env.GEMINI_API_KEY) {
  console.log("✅ GEMINI_API_KEY loaded successfully");
} else {
  console.error("❌ GEMINI_API_KEY is missing in .env file");
}

// Connect to MongoDB
connectDB();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://localhost:8083',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io accessible in routes
app.set('io', io);

// Socket.io JWT Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id, 'User:', socket.userId);

  socket.on('join_room', (userId) => {
    // Only allow users to join their own room or admins to join any room
    if (socket.userId === userId || socket.userRole === 'admin') {
      socket.join(userId);
      console.log(`User ${socket.userId} joined room ${userId}`);
    } else {
      console.warn(`Unauthorized room join attempt by ${socket.userId} to room ${userId}`);
      socket.emit('error', { message: 'Cannot join another user\'s room' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
