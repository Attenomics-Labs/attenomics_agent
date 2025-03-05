// src/routes/weeklyDistributionRoute.js
const express = require('express');
const router = express.Router();
const weeklyDistributionController = require('../controllers/weeklyDistributionController');
const distributionBroadcaster = require('../controllers/distributionBroadcaster');

// Create weekly distribution for all creators
router.post('/all', weeklyDistributionController.createWeeklyDistributionForAll);

// Broadcast distributions using either method
router.post('/broadcast', distributionBroadcaster.broadcastDistributions);

module.exports = router;
