const axios = require("axios");

/**
 * Calls the judge endpoint to evaluate attention distribution.
 * Expects payloadData to be an object with:
 *   - users: an array of creator names,
 *   - posts: an array of post objects (each with a "text" field and others),
 *   - total_points: number of points to distribute.
 * @param {object} rawPosts - The raw array of tweet objects.
 * @param {number} totalPoints - The total points to distribute.
 * @returns {Promise<object>} - The evaluated JSON response.
 */
exports.getEvalAttentionResponse = async (rawPosts, totalPoints = 100) => {
  try {
    // Extract the creator names from the posts.
    const users = rawPosts.map(post => post.username);
    
    // Construct the payload according to the expected structure.
    // console.log("Users : " , users);
    // console.log("Posts : " , posts);

    const payloadData = {
      users,      // e.g. [ "AttenomicsLabs", "DevSwayam", ... ]
      posts: rawPosts,
      total_points: totalPoints
    };

    console.log("Sending payload for attention evaluation:", JSON.stringify(payloadData, null, 2));
    const response = await axios.post(process.env.JUDGE_URI, payloadData, {
      headers: { "Content-Type": "application/json" },
      timeout: 120000 // 2 minutes timeout if needed
    });
    console.log("Judge API raw response:", JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error("Error in getEvalAttentionResponse:", error);
    throw error;
  }
};

/**
 * Similarly, for user support evaluation:
 */
exports.getEvalUserSupportResponse = async (rawPosts, totalPoints = 100) => {
  try {
    const users = rawPosts.map(post => post.username);
    const payloadData = {
      users,
      posts: rawPosts,
      total_points: totalPoints
    };

    console.log("Sending payload for user support evaluation:", JSON.stringify(payloadData, null, 2));
    const response = await axios.post(process.env.JUDGE_URI, payloadData, {
      headers: { "Content-Type": "application/json" },
      timeout: 120000
    });
    console.log("Judge API raw response:", JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error("Error in getEvalUserSupportResponse:", error);
    throw error;
  }
};
