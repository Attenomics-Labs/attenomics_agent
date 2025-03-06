const getScraper =   require("../utils/scraper.js");
const { handleResponse, handleError } =  require("../utils/ResponseHandler.js");

const getTweetsAndReplies = async (res, user, maxTweets = 10) => {
  try {

    if (!user) {
      throw new Error("User is required");
    }

    const scraper = await getScraper();
    const tweets = [];

    for await (const tweet of scraper.getTweetsAndReplies(
      user,
      parseInt(maxTweets) || 1000
    )) {
      tweets.push(tweet);
    }

    const currentTime = Math.floor(Date.now() / 1000); // Get current time in seconds
    const oneHourAgo = currentTime - 3600; // One hour ago in seconds

    const creatorTweetsAndReplies = tweets.filter(tweet => tweet.timestamp >= oneHourAgo && tweet.username === user);
    const userReplies = tweets.filter(tweet => tweet.timestamp >= oneHourAgo && tweet.username !== user);

    return {creatorTweetsAndReplies, userReplies};
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = { getTweetsAndReplies };