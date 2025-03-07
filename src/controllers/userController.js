const path = require("path");
const fs = require("fs");
const getScraper = require("../utils/scraper.js");
const { MongoClient } = require("mongodb");

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

const uri = process.env.CONNECTION_URI;
const client = new MongoClient(uri, { useUnifiedTopology: true });
let db;

(async () => {
  try {
    await client.connect();
    db = client.db();
    console.log("Database connected using default database from URI");
  } catch (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }
})();

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

/**
 * Seeds users with username and wallet address
 * @param {Object} req - Request object containing users array
 * @param {Object} res - Response object
 */
exports.seedUsers = async (req, res) => {
  try {
    const { users } = req.body;
    
    if (!Array.isArray(users)) {
      return res.status(400).json({ 
        error: "users must be an array" 
      });
    }

    const collection = db.collection("users");
    const results = [];

    for (const user of users) {
      try {
        // Check if user already exists
        const existingUser = await collection.findOne({ username: user.username });
        if (existingUser) {
          results.push({
            username: user.username,
            status: "skipped",
            reason: "already exists"
          });
          continue;
        }

        // Insert new user
        await collection.insertOne(user);
        results.push({
          username: user.username,
          status: "created"
        });
      } catch (error) {
        results.push({
          username: user.username,
          status: "error",
          error: error.message
        });
      }
    }

    return res.status(201).json({
      message: "Users seeded successfully",
      results
    });

  } catch (error) {
    console.error("Error in seedUsers:", error);
    return res.status(500).json({ error: error.message });
  }
};
