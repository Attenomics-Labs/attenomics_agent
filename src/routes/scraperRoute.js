// src/routes/scraperRoute.js

const express = require('express');
const router = express.Router();
const { getTweets, getLatestTweet } = require('../controllers/scraperController.js');

/**
 * POST /scraper/tweets
 * Body params:
 *   user (string, required) - Twitter username
 *   maxTweets (number, optional) - Maximum number of tweets to fetch
 *
 * Example body:
 * {
 *   "user": "elonmusk",
 *   "maxTweets": 5
 * }
 */
router.post('/tweets', getTweets);

/**
 * POST /scraper/latest
 * Body params:
 *   user (string, required) - Twitter username
 *
 * Example body:
 * {
 *   "user": "nasa"
 * }
 */
router.post('/latest-tweet', getLatestTweet);

module.exports = router;
