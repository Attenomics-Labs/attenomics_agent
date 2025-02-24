// src/routes/index.js
const express = require('express');
const router = express.Router();

const creatorTokenRoute = require('./creatorTokenRoute');
const scraperRoute = require('./scraperRoute');
const attentionRoute = require('./attentionRoute');

router.use('/creator', creatorTokenRoute);
router.use('/scraper', scraperRoute);
router.use('/attention', attentionRoute);

module.exports = router;
