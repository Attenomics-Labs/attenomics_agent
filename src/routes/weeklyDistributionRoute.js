// src/routes/weeklyDistributionRoute.js
const express = require('express');
const router = express.Router();
const weeklyDistributionController = require('../controllers/weeklyDistributionController');

// POST endpoint to create weekly distribution data
router.post('/', weeklyDistributionController.createWeeklyDistribution);

module.exports = router;
