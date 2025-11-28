const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');

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

const app = express();

const path = require('path');

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/employees', require('./src/routes/employees'));
app.use('/api/tasks', require('./src/routes/tasks'));
app.use('/api/messages', require('./src/routes/messages'));
app.use('/api/meetings', require('./src/routes/meetings'));
app.use('/api/evaluations', require('./src/routes/evaluations'));
app.use('/api/attendance', require('./src/routes/attendance'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/analytics', require('./src/routes/analytics'));
app.use('/api/upload', require('./src/routes/upload'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Server Error', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
