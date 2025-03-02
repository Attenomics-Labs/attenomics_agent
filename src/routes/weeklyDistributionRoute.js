// src/routes/weeklyDistributionRoute.js
const express = require('express');
const router = express.Router();
const weeklyDistributionController = require('../controllers/weeklyDistributionController');

// New endpoint for all creators
router.post('/all', weeklyDistributionController.createWeeklyDistributionForAll);

module.exports = router;
