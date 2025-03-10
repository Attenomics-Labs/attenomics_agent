// src/routes/dailyDistributionRoute.js
const express = require('express');
const router = express.Router();
const dailyDistributionController = require('../controllers/DailyDistributionController');
const distributionBroadcaster = require('../controllers/broadCastDailyDistribution');

// Create daily distribution for all creators
router.post('/all', dailyDistributionController.createDailyDistributionForAll);

// If you don't have a broadcast function, remove or comment out the broadcast route.
router.post('/broadcast', distributionBroadcaster.broadcastDistributions);

module.exports = router;
