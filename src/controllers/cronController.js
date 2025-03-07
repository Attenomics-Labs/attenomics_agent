const { handleResponse, handleError } = require("../utils/ResponseHandler.js");
const { getTweetsAndReplies } = require("../controllers/tweetController.js");
const { getLLMResponse } = require("../controllers/llmController.js");
const { getEvalAttentionPrompt, getEvalUserSupportPrompt } = require("../utils/prompts.js");
const { updateAttentionRecords, updateUserPercentSupp, updateCreatorToCreatorDist, fetchCreators } = require("../controllers/dbController.js");

const runHourlyCron = async (req, res) => {
  try {
    const creators = await fetchCreators();

    console.log(creators);

    let allCreatorTweetsAndReplies = [];
    const unixTimestamp = Math.floor(Date.now() / 1000);

    for (const creator of creators) {
      const { creatorTweetsAndReplies, userReplies } = await getTweetsAndReplies(res, creator, 10); 

      console.log({ creatorTweetsAndReplies, userReplies });
      const { data: userSuppDist, requestHash, responseHash } = await getLLMResponse(getEvalUserSupportPrompt(userReplies));
      //change this one , the schema used here is : distribution daywise 
      await updateUserPercentSupp(creator, userSuppDist, unixTimestamp, requestHash, responseHash);
     // add distribute weekly attention here
     // 
      console.log({ creator, creatorTweetsAndReplies, userReplies, userSuppDist });
      allCreatorTweetsAndReplies.push(creatorTweetsAndReplies);
    }

    const { data: creatorsAttentionDist, requestHash, responseHash } = await getLLMResponse(getEvalAttentionPrompt(allCreatorTweetsAndReplies));
    
    console.log({ "creatorsAttentionDist": creatorsAttentionDist });
    await updateAttentionRecords(creatorsAttentionDist, unixTimestamp, requestHash, responseHash);
    await updateCreatorToCreatorDist(creatorsAttentionDist, unixTimestamp);
    
    console.log("updated creator to creator hourly record");

    handleResponse(res, creatorsAttentionDist, "Cron Job Ran");
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = { runHourlyCron };
