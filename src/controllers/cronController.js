const { handleResponse, handleError } = require("../utils/ResponseHandler.js");
const { getTweetsAndReplies } = require("../controllers/tweetController.js");
// Instead of getLLMResponse from llmController.js, we now use our judge functions:
const { getEvalAttentionResponse, getEvalUserSupportResponse } = require("../utils/judge.js");
const { fetchCreators, updateAttentionRecords, updateUserPercentSupp, updateCreatorToCreatorDist } = require("../controllers/dbController.js");

const runHourlyCron = async (req, res) => {
  try {
    console.log("Running hourly cron job...");
    const creators = await fetchCreators();
    console.log("Creators:", creators);

    let allCreatorTweetsAndReplies = []
    const unixTimestamp = Math.floor(Date.now() / 1000);

    for (const creator of creators) {
      try {
        console.log("Processing creator:", creator);
        const { creatorTweetsAndReplies, userReplies } = await getTweetsAndReplies(res, creator, 10);
        
        // Get user support distribution by calling the judge endpoint
        console.log("User replies:", userReplies);
        const userSupportResponse = await getEvalUserSupportResponse(userReplies);
        // console.log("User support response:", userSupportResponse);

        // // Update user support records using the evaluated response data
        // console.log("User Support Reponse: ", userSupportResponse);
        await updateUserPercentSupp(creator, userSupportResponse, unixTimestamp, userSupportResponse.requestHash, userSupportResponse.responseHash);

        console.log({ creator, creatorTweetsAndReplies, userReplies, userSuppDist: userSupportResponse });
        allCreatorTweetsAndReplies.push(creatorTweetsAndReplies);
      } catch (error) {
        console.error(`Error processing creator ${creator}:`, error);
      }
    }

    // Get attention distribution for all creators by calling the judge endpoint
    const creatorsAttentionResponse = await getEvalAttentionResponse(allCreatorTweetsAndReplies);
    const { requestHash, responseHash } = creatorsAttentionResponse; // if provided by judge API
    const creatorsAttentionDist = creatorsAttentionResponse; // assuming the response data is the distribution

    console.log({ "creatorsAttentionDist": creatorsAttentionDist });
    
    // Update attention records
    await updateAttentionRecords(creatorsAttentionDist, unixTimestamp, requestHash, responseHash);
    
    // Update creator to creator distribution
    await updateCreatorToCreatorDist(creatorsAttentionDist, unixTimestamp);
    
    console.log("Updated creator to creator hourly record");

    handleResponse(res, creatorsAttentionDist, "Cron Job Ran");
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = { runHourlyCron };
