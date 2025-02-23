// src/controllers/scraperController.js
const getScraper = require('../utils/scraper.js');
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
