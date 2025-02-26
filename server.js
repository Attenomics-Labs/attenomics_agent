// server.js
require('dotenv').config();
const express = require('express');
const connectDB = require('./src/config/db');
const app = express();

// Connect to MongoDB
connectDB();

// Middleware to parse JSON
app.use(express.json());

// Mount the items routes
const itemsRoute = require('./src/routes/items');
app.use('/api/items', itemsRoute);
  
// Basic test route
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

// Global error handling middleware
const errorHandler = require('./src/middleware/errorHandler');
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
