const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
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

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join_room', (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} joined room`);
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
