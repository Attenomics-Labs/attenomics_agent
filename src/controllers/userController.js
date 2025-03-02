const path = require("path");
const fs = require("fs");
const getScraper = require("../utils/scraper.js");

// Paths to the JSON files
const registeredCreatorsPath = path.join(
  __dirname,
  "..",
  "data",
  "creatorNames.json"
);
const creatorDataFilePath = path.join(
  __dirname,
  "..",
  "data",
  "creatorData.json"
);

exports.getUserFollowersWhoCreatedTokens = async (req, res, next) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ message: "username is required" });
    }

    // 1. Initialize the scraper and fetch the 'following' list.
    const scraper = await getScraper();
    const followingHandles = [];
    console.log(`Fetching following list for ${username}...`);

    // Use the async generator once to build the list.
    const userProfile = await scraper.getProfile(username);

    if (!userProfile || !userProfile.userId) {
      return res.status(404).json({
        message: "User profile not found or userId not available",
        username,
      });
    }

    const userId = userProfile.userId;
    console.log(`Found userId: ${userId} for username: ${username} having userId: ${userId}`);
    const followingGenerator = await scraper.getFollowing(userId, userProfile.followingCount);
    console.log("followingGenerator:", followingGenerator);
    console.log("user profile:", userProfile);
    console.log("user profile :", userProfile.canDm);
    for await (const userObj of followingGenerator) {
      console.log(`Found user: ${userObj.username}`);
      followingHandles.push(userObj.username);
    }
    console.log(
      `Found ${followingHandles.length} accounts that ${username} is following`
    );

    // 2. Read the list of registered creators.
    if (!fs.existsSync(registeredCreatorsPath)) {
      return res
        .status(404)
        .json({ message: "No registeredCreators file found" });
    }
    const registeredCreatorsContent = fs.readFileSync(
      registeredCreatorsPath,
      "utf8"
    );
    const registeredCreatorsData = JSON.parse(
      registeredCreatorsContent || "{}"
    );

    // Correct extraction: registeredCreatorsData.creatorNames is already an array.
    const creatorNames = registeredCreatorsData.creatorNames || [];

    // 3. Find intersection between the followingHandles and creatorNames.
    const followingSet = new Set(followingHandles);
    const matchedCreators = creatorNames.filter((creatorName) =>
      followingSet.has(creatorName)
    );

    // 4. Read the creatorData file to retrieve full data for each matched creator.
    if (!fs.existsSync(creatorDataFilePath)) {
      return res.status(404).json({ message: "No creatorData file found" });
    }
    const creatorDataContent = fs.readFileSync(creatorDataFilePath, "utf8");
    const creatorData = JSON.parse(creatorDataContent || "{}");

    // 5. Gather data for each matched creator.
    const matchedCreatorData = matchedCreators.map((creatorName) => {
      return {
        creatorName,
        ...creatorData[creatorName],
      };
    });

    // 6. Respond with the matched creator data.
    return res.status(200).json({ matchedCreators: matchedCreatorData });
  } catch (error) {
    next(error);
  }
};

const User = require('../models/User');

// GET /user/get-user-following-creators/
// For testing, simply return all users.
exports.getUserFollowersWhoCreatedTokens = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ data: users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
