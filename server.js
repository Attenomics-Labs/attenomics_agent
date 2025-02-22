// server.js
require('dotenv').config();
const express = require('express');
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Mounting routes under /api
const routes = require('./src/routes');
app.use('/api', routes);

// Global error handling middleware
const errorHandler = require('./src/middleware/errorHandler');
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
