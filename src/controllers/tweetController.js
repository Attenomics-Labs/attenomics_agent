const { getScraper } = require("../utils/scraper.js");
const { handleResponse, handleError } = require("../utils/ResponseHandler.js");
const User = require("../models/User"); // Import the User model

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
      for await (const tweet of scraper.getTweetsAndReplies(user, parseInt(maxTweets) || 1000)) {
        tweets.push(tweet);
      }
      console.log(`Total tweets/replies fetched: ${tweets.length}`);
    } catch (scrapeError) {
      console.error(`Error fetching tweets for user ${user}:`, scrapeError);
      return { creatorTweetsAndReplies: [], userReplies: [] };
    }

    const currentTime = Math.floor(Date.now() / 1000);
    // Filter tweets from the past 6 hours.
    const sixHoursAgo = currentTime - 24 * 3600;
    console.log("Six hours ago:", sixHoursAgo);

    console.log("\nAll tweets/replies:");
    tweets.forEach((tweet) => {
      console.log(`- ID: ${tweet.id}`);
      console.log(`  Username: ${tweet.username}`);
      console.log(`  Is Reply: ${tweet.isReply}`);
      console.log(`  Timestamp: ${tweet.timestamp}`);
      console.log(`  Text: ${tweet.text.substring(0, 50)}...`);
    });

    // Fetch registered users
    const registeredUsers = await User.find({}, "username");
    const registeredUsernames = new Set(registeredUsers.map((user) => user.username));

    const creatorTweetsAndReplies = tweets.filter((tweet) => {
      const isRecent = tweet.timestamp >= sixHoursAgo;
      const isCreator = tweet.username === user;
      return isRecent && isCreator;
    });

    const userReplies = tweets.filter((tweet) => {
      const isRecent = tweet.timestamp >= sixHoursAgo;
      const isReply = tweet.isReply && tweet.username !== user;
      const isRegistered = registeredUsernames.has(tweet.username);
      return isRecent && isReply && isRegistered;
    });

    console.log("\nFiltered Results:");
    console.log(`Creator tweets in last 6 hours: ${creatorTweetsAndReplies.length}`);
    console.log(`User replies in last 6 hours: ${userReplies.length}`);
    if (userReplies.length > 0) {
      console.log("\nUser Replies Details:");
      userReplies.forEach((reply) => {
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
