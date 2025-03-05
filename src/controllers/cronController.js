import { handleResponse, handleError } from "../utils/responseHandler.js";
import { getTweetsAndReplies } from "../controllers/tweetController.js";
import { getLLMResponse } from "../controllers/llmController.js";
import { getEvalAttentionPrompt, getEvalUserSupportPrompt } from "../utils/prompts.js"
import { updateAttentionRecords, updateUserPercentSupp, updateCreatorToCreatorDist, fetchCreators } from "../controllers/dbController.js"


export const runHourlyCron = async (req, res) => {
    try {
        const creators = await fetchCreators();

        console.log(creators);

        var allCreatorTweetsAndReplies = [];
        const unixTimestamp = Math.floor(Date.now() / 1000);

        for (const creator of creators){
          const {creatorTweetsAndReplies, userReplies} =  await getTweetsAndReplies(res, creator, 10);

          const { data: userSuppDist, requestHash, responseHash } = await getLLMResponse(getEvalUserSupportPrompt(userReplies));

          await updateUserPercentSupp(creator, userSuppDist, unixTimestamp, requestHash, responseHash);

          console.log({creator, creatorTweetsAndReplies, userReplies, userSuppDist});

          allCreatorTweetsAndReplies.push(creatorTweetsAndReplies);
        }

        const  { data: creatorsAttentionDist, requestHash, responseHash } = await getLLMResponse(getEvalAttentionPrompt(allCreatorTweetsAndReplies));
        
        console.log({"creatorsAttentionDist": creatorsAttentionDist});
        await updateAttentionRecords(creatorsAttentionDist, unixTimestamp, requestHash, responseHash);
        await updateCreatorToCreatorDist(creatorsAttentionDist, unixTimestamp);
        console.log("updated creator to creator hourly record");

        handleResponse(res, creatorsAttentionDist, "Cron Job Ran");
    } catch (error) {
        handleError(res, error);
    }
}