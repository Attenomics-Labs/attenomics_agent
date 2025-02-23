// src/routes/index.js
const express = require('express');
const router = express.Router();

const creatorTokenRoute = require('./creatorTokenRoute');
const scraperRoute = require('./scraperRoute');

router.use('/creator', creatorTokenRoute);
router.use('/scraper', scraperRoute);

module.exports = router;
