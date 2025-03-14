// server.js
require('dotenv').config();
const express = require('express');
const connectDB = require('./src/config/db');
const app = express();

// Connect to MongoDB
connectDB();

// Middleware to parse JSON
app.use(express.json());

// Mount existing routes
const itemsRoute = require('./src/routes/items');
app.use('/api/items', itemsRoute);

const creatorTokenRoute = require('./src/routes/creatorTokenRoute');
const scraperRoute = require('./src/routes/scraperRoute');
const attentionRoute = require('./src/routes/attentionRoute');
const userRoute = require('./src/routes/userRoute');
const cronRoute = require('./src/routes/cronRoute');
const creatorRoute = require("./src/routes/creatorRoute");
const dailyDistributionRoute = require("./src/routes/dailyDistributionRoute");
app.use('/creator', creatorTokenRoute);
app.use('/scraper', scraperRoute);
app.use('/attention', attentionRoute);
app.use('/user', userRoute);
app.use('/cron', cronRoute);
app.use("/creator", creatorRoute);
app.use("/daily-distribution", dailyDistributionRoute);
const nftRoute = require('./src/routes/nftRoute');
app.use('/nft', nftRoute);

// Mount Weekly Distribution route
const weeklyDistributionRoute = require('./src/routes/weeklyDistributionRoute');
app.use('/weekly-distribution', weeklyDistributionRoute);

// Mount Creator List route
const creatorListRoute = require('./src/routes/creatorListRoute');
app.use('/creator-list', creatorListRoute);

// Mount Cron route
// const cronRoute = require('./src/routes/cronRoute');
// app.use('/cron', cronRoute);

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
