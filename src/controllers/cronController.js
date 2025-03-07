const { handleResponse, handleError } = require("../utils/ResponseHandler.js");
const { getTweetsAndReplies } = require("../controllers/tweetController.js");
const { getLLMResponse } = require("../controllers/llmController.js");
const { getEvalAttentionPrompt, getEvalUserSupportPrompt } = require("../utils/prompts.js");
const { updateAttentionRecords, updateUserPercentSupp, updateCreatorToCreatorDist, fetchCreators } = require("../controllers/dbController.js");

const runHourlyCron = async (req, res) => {
  try {
    console.log("Running hourly cron job...");
    const creators = await fetchCreators();
    console.log("Creators:", creators);

    let allCreatorTweetsAndReplies = [];
    const unixTimestamp = Math.floor(Date.now() / 1000);

    for (const creator of creators) {
      try {
        console.log("Processing creator:", creator);
        const { creatorTweetsAndReplies, userReplies } = await getTweetsAndReplies(res, creator, 10);
        // console.log("Creator data:", { creatorTweetsAndReplies, userReplies });

        // Get user support distribution
        const userSupportPrompt = getEvalUserSupportPrompt(userReplies);
        console.log(userSupportPrompt);
        const userSupportResponse = await getLLMResponse(userSupportPrompt, creators);
        console.log("User support response:", userSupportResponse);

        // Update user support records
        await updateUserPercentSupp(creator, userSupportResponse.data, unixTimestamp, userSupportResponse.requestHash, userSupportResponse.responseHash);

        console.log({ creator, creatorTweetsAndReplies, userReplies, userSuppDist: userSupportResponse.data });
        allCreatorTweetsAndReplies.push(creatorTweetsAndReplies);
      } catch (error) {
        console.error(`Error processing creator ${creator}:`, error);
      }
    }

    // Get attention distribution for all creators
    const attentionPrompt = getEvalAttentionPrompt(allCreatorTweetsAndReplies);
    console.log(attentionPrompt);
    const { data: creatorsAttentionDist, requestHash, responseHash } = await getLLMResponse(attentionPrompt, creators);
    
    console.log({ "creatorsAttentionDist": creatorsAttentionDist });
    
    // Update attention records
    await updateAttentionRecords(creatorsAttentionDist, unixTimestamp, requestHash, responseHash);
    
    // Update creator to creator distribution
    await updateCreatorToCreatorDist(creatorsAttentionDist, unixTimestamp);
    
    console.log("updated creator to creator hourly record");

    handleResponse(res, creatorsAttentionDist, "Cron Job Ran");
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = { runHourlyCron };
