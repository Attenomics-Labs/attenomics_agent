// src/controllers/scraperController.js
const {getScraper} = require('../utils/scraper.js');
const { handleResponse, handleError } = require('../utils/ResponseHandler.js');

const getTweets = async (req, res) => {
  try {
    const { user, maxTweets } = req.body;
    if (!user) {
      return res.status(400).json({ success: false, error: "User is required" });
    }
    const scraper = await getScraper();
    const tweets = [];
    for await (const tweet of scraper.getTweets(user, parseInt(maxTweets) || 2)) {
      tweets.push({ tweetID: tweet.id, text: tweet.text });
    }
    handleResponse(res, tweets, "Fetched tweets successfully");
  } catch (error) {
    handleError(res, error);
  }
};

const getLatestTweet = async (req, res) => {
  try {
    const { user } = req.body;
    if (!user) {
      return res.status(400).json({ success: false, error: "User is required" });
    }
    const scraper = await getScraper();
    const tweet = await scraper.getLatestTweet(user);
    handleResponse(res, tweet, "Fetched latest tweet successfully");
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = { getTweets, getLatestTweet };

// POST /scraper/tweets
// Expects body: { user: "username", maxTweets: 3 }
exports.getTweets = async (req, res) => {
  try {
    const { user, maxTweets } = req.body;
    // Create dummy tweet data.
    const tweets = [];
    for (let i = 0; i < (maxTweets || 5); i++) {
      tweets.push({ tweet: `Tweet ${i + 1} from ${user}` });
    }
    res.status(200).json({ tweets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /scraper/latest-tweet
// Expects body: { user: "username" }
exports.getLatestTweet = async (req, res) => {
  try {
    const { user } = req.body;
    // Return dummy latest tweet data.
    res.status(200).json({ tweet: `Latest tweet from ${user}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

