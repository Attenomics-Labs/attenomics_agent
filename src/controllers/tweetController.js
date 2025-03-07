const {getScraper} = require("../utils/scraper.js");
const { handleResponse, handleError } = require("../utils/ResponseHandler.js");

const getTweetsAndReplies = async (res, user, maxTweets = 10) => {
  try {
    console.log(`\n=== Processing user: ${user} ===`);
    
    if (!user) {
      throw new Error("User is required");
    }

    const scraper = await getScraper();
    console.log(`Scraper initialized for user: ${user}`);
    
    const tweets = [];
    try {
      for await (const tweet of scraper.getTweetsAndReplies(
        user,
        parseInt(maxTweets) || 1000
      )) {
        tweets.push(tweet);
      }
      console.log(`Total tweets/replies fetched: ${tweets.length}`);
    } catch (scrapeError) {
      console.error(`Error fetching tweets for user ${user}:`, scrapeError);
      return { creatorTweetsAndReplies: [], userReplies: [] };
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const oneHourAgo = currentTime - 24 * 3600;

    // Log all tweets for debugging
    console.log('\nAll tweets/replies:');
    tweets.forEach(tweet => {
      console.log(`- ID: ${tweet.id}`);
      console.log(`  Username: ${tweet.username}`);
      console.log(`  Is Reply: ${tweet.isReply}`);
      console.log(`  Timestamp: ${tweet.timestamp}`);
      console.log(`  Text: ${tweet.text.substring(0, 50)}...`);
    });

    const creatorTweetsAndReplies = tweets.filter(tweet => {
      const isRecent = tweet.timestamp >= oneHourAgo;
      const isCreator = tweet.username === user;
      return isRecent && isCreator;
    });

    const userReplies = tweets.filter(tweet => {
      const isRecent = tweet.timestamp >= oneHourAgo;
      const isReply = tweet.isReply && tweet.username !== user;
      return isRecent && isReply;
    });

    console.log('\nFiltered Results:');
    console.log(`Creator tweets in last hour: ${creatorTweetsAndReplies.length}`);
    console.log(`User replies in last hour: ${userReplies.length}`);

    if (userReplies.length > 0) {
      console.log('\nUser Replies Details:');
      userReplies.forEach(reply => {
        console.log(`- From: ${reply.username}`);
        console.log(`  To: ${reply.replyToUsername || user}`);
        console.log(`  Text: ${reply.text.substring(0, 50)}...`);
      });
    }

    return { creatorTweetsAndReplies, userReplies };
  } catch (error) {
    console.error(`Error in getTweetsAndReplies for user ${user}:`, error);
    return { creatorTweetsAndReplies: [], userReplies: [] };
  }
};

module.exports = { getTweetsAndReplies };