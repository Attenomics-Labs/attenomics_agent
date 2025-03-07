const getScraper =   require("../utils/scraper.js");
const { handleResponse, handleError } =  require("../utils/ResponseHandler.js");

const getTweetsAndReplies = async (res, user, maxTweets = 10) => {
  try {
    console.log(`Fetching tweets and replies for user: ${user}`);
    
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
      console.log(`Successfully fetched ${tweets.length} tweets for user: ${user}`);
    } catch (scrapeError) {
      console.error(`Error fetching tweets for user ${user}:`, scrapeError);
      // Return empty arrays instead of throwing to allow the process to continue
      return { creatorTweetsAndReplies: [], userReplies: [] };
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const oneHourAgo = currentTime - 3600;

    const creatorTweetsAndReplies = tweets.filter(tweet => {
      const isRecent = tweet.timestamp >= oneHourAgo;
      const isCreator = tweet.username === user;
      console.log(`Tweet ${tweet.id}: timestamp=${tweet.timestamp}, username=${tweet.username}, isRecent=${isRecent}, isCreator=${isCreator}`);
      return isRecent && isCreator;
    });

    const userReplies = tweets.filter(tweet => {
      const isRecent = tweet.timestamp >= oneHourAgo;
      const isReply = tweet.username !== user;
      console.log(`Reply ${tweet.id}: timestamp=${tweet.timestamp}, username=${tweet.username}, isRecent=${isRecent}, isReply=${isReply}`);
      return isRecent && isReply;
    });

    console.log(`Filtered results for ${user}:`, {
      totalTweets: tweets.length,
      creatorTweets: creatorTweetsAndReplies.length,
      userReplies: userReplies.length
    });

    return { creatorTweetsAndReplies, userReplies };
  } catch (error) {
    console.error(`Error in getTweetsAndReplies for user ${user}:`, error);
    // Return empty arrays instead of throwing to allow the process to continue
    return { creatorTweetsAndReplies: [], userReplies: [] };
  }
};

module.exports = { getTweetsAndReplies };