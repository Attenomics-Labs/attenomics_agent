// src/routes/index.js
const express = require('express');
const router = express.Router();

const creatorTokenRoute = require('./creatorTokenRoute');
const scraperRoute = require('./scraperRoute');
const attentionRoute = require('./attentionRoute');
const userRoute = require('./userRoute');

router.use('/creator', creatorTokenRoute);
router.use('/scraper', scraperRoute);
router.use('/attention', attentionRoute);
router.use('/user', userRoute);

module.exports = router;
