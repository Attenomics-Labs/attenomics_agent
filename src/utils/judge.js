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

    // console.log("Sending payload for attention evaluation:", JSON.stringify(payloadData, null, 2));
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
      const limitedPosts = rawPosts.slice(0, 3).map(post => ({
        name: post.name,
        html: post.html
      }));
      const users = limitedPosts.map(post => post.name);
      console.log("Total Points : " , totalPoints);
      const payloadData = {
        users,
        posts: limitedPosts,
        total_points: totalPoints
      };

      console.log("Payload :" , payloadData)
      console.log("Sending payload for user support evaluation:", JSON.stringify(payloadData, null, 2));
      const response = await axios.post(process.env.JUDGE_URI_USER_SUPPORT, payloadData, {
        headers: { "Content-Type": "application/json" },
        timeout: 120000,
        validateStatus: (status) => status < 500, // Treat 4xx responses as valid

      });
      let data = response.data;
     
      console.log("User Support Response After Remapping:", data);
      return data;
    } catch (error) {
      console.error("Error in getEvalUserSupportResponse:", error);
      throw error;
    }

};
