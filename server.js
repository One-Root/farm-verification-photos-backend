const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    routes: app._router.stack
      .filter(r => r.route)
      .map(r => ({ path: r.route.path, methods: r.route.methods }))
  });
});

// Routes
const verificationRoutes = require('./routes/verification');
console.log('✅ Loading verification routes...');
app.use('/api/verifications', verificationRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ 
    statusCode: 500, 
    message: 'Server error', 
    error: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  console.log('⚠️ 404 - Route not found:', req.method, req.path);
  res.status(404).json({ 
    statusCode: 404, 
    message: 'Route not found',
    path: req.path,
    availableRoutes: ['/api/health', '/api/verifications/submit']
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📍 Submit endpoint: http://localhost:${PORT}/api/verifications/submit`);
});