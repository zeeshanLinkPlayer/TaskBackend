const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const dotenv=require("dotenv")
dotenv.config()
// Create Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
  origin: ['http://localhost:5173', 'https://task-frontend-yvp6.vercel.app'], // Allow multiple origins
  credentials: true, // Allow cookies & authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allowed headers
}));

// Request logger
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Serve static assets in production
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static('dist/public'));
  
//   app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, '../dist/public', 'index.html'));
//   });
// }
app.get("/",(req,res)=>{
  res.send("Hello world")
})
// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal Server Error',
  });
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
