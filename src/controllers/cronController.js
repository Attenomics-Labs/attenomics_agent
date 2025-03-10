const { handleResponse, handleError } = require("../utils/ResponseHandler.js");
const { getTweetsAndReplies } = require("../controllers/tweetController.js");
const { getLLMResponse } = require("../controllers/llmController.js");
const { getEvalAttentionPrompt, getEvalUserSupportPrompt } = require("../utils/prompts.js");
const { 
  fetchCreators, 
  updateAttentionRecords, 
  updateUserPercentSupp, 
  updateCreatorToCreatorDist,
  updateCreatorTweetMetrics
} = require("../controllers/dbController.js");

exports.runHourlyCron = async (req, res) => {
  try {
    const creators = await fetchCreators();
    let allCreatorTweetsAndReplies = [];
    const unixTimestamp = Math.floor(Date.now() / 1000);

    for (const creator of creators) {
      const { creatorTweetsAndReplies, userReplies } = await getTweetsAndReplies(res, creator, 10);

      // Extract tweet metrics: for each tweet, record tweet id and key metrics.
      const tweetMetrics = creatorTweetsAndReplies.map((tweet) => ({
        tweetId: tweet.id,
        likes: tweet.likes || 0,
        retweets: tweet.retweets || 0,
        replies: tweet.replies || 0,
        views: tweet.views || 0,
        timestamp: tweet.timestamp,
      }));
      await updateCreatorTweetMetrics(creator, tweetMetrics);

      // Get user support distribution from the LLM.
      const { data: userSuppDist, requestHash, responseHash } = await getLLMResponse(
        getEvalUserSupportPrompt(userReplies)
      );
      await updateUserPercentSupp(creator, userSuppDist, unixTimestamp, requestHash, responseHash);

     // console.log({ creator, creatorTweetsAndReplies, userReplies, userSuppDist });
      allCreatorTweetsAndReplies.push(creatorTweetsAndReplies);
    }

    // Get overall creator attention distribution from the LLM.
    const { data: creatorsAttentionDist, requestHash, responseHash } = await getLLMResponse(
      getEvalAttentionPrompt(allCreatorTweetsAndReplies)
    );
    console.log({ creatorsAttentionDist });
    await updateAttentionRecords(creatorsAttentionDist, unixTimestamp, requestHash, responseHash);
    await updateCreatorToCreatorDist(creatorsAttentionDist, unixTimestamp);
    console.log("Updated creator-to-creator six-hour record");

    res.status(200).json({ message: "Success" });
  } catch (error) {
    console.error("Error in six-hour cron job:", error);
    return handleError(res, error);
  }
};
