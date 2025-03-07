const axios = require("axios");

/**
 * Calls the judge endpoint to evaluate attention distribution.
 * @param {any} allCreatorTweetsAndReplies - The data (or stringified version) of creators’ tweets.
 * @returns {Promise<object>} - The evaluated JSON response from the judge endpoint.
 */
exports.getEvalAttentionResponse = async (allCreatorTweetsAndReplies) => {
  try {
    // For attention, total points is 100
    const payload = {
      posts: [JSON.stringify(allCreatorTweetsAndReplies, null, 2)],
      total_points: 100
    };
    const response = await axios.post(process.env.JUDGE_URI, payload, {
      headers: {
        "Content-Type": "application/json"
      },
      timeout: 120000 // 2 minutes timeout if needed
    });
    return response.data;
  } catch (error) {
    console.error("Error in getEvalAttentionResponse:", error);
    throw error;
  }
};

/**
 * Calls the judge endpoint to evaluate user support distribution.
 * @param {any} userReplies - The list of user replies.
 * @returns {Promise<object>} - The evaluated JSON response from the judge endpoint.
 */
exports.getEvalUserSupportResponse = async (userReplies) => {
  try {
    // For user support, also use total points of 100
    const payload = {
      posts: [JSON.stringify(userReplies, null, 2)],
      total_points: 100
    };
    const response = await axios.post(process.env.JUDGE_URI, payload, {
      headers: {
        "Content-Type": "application/json"
      },
      timeout: 120000
    });
    return response.data;
  } catch (error) {
    console.error("Error in getEvalUserSupportResponse:", error);
    throw error;
  }
};
