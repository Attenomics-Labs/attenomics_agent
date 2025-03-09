const path = require("path");
const fs = require("fs");
const {getScraper} = require("../utils/scraper.js");
const { MongoClient } = require("mongodb");
const User = require('../models/User');
const CreatorList = require('../models/CreatorList'); // Import the CreatorList model
const Creator = require('../models/Creator'); // Import the Creator model
const Cookie = require('../models/Cookie'); // Import the Cookie model

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

    // Initialize the scraper and fetch the 'following' list.
    const scraper = await getScraper();
    const followingHandles = [];
    const userProfile = await scraper.getProfile(username);

    if (!userProfile || !userProfile.userId) {
      return res.status(404).json({
        message: "User profile not found or userId not available",
        username,
      });
    }

    const userId = userProfile.userId;
    const followingGenerator = await scraper.getFollowing(userId, userProfile.followingCount);
    for await (const userObj of followingGenerator) {
      followingHandles.push(userObj.username);
    }

    // Read the list of registered creators from the database
    const creatorList = await CreatorList.findOne({}, 'creatorNames');
    if (!creatorList) {
      return res.status(404).json({ message: "No registered creators found" });
    }

    const creatorNames = creatorList.creatorNames || [];
    const followingSet = new Set(followingHandles);
    const matchedCreators = creatorNames.filter((creatorName) => followingSet.has(creatorName));

    // Gather data for each matched creator
    const matchedCreatorData = await Promise.all(matchedCreators.map(async (creatorName) => {
      return await Creator.findOne({ creatorName }); // Fetch full data for each matched creator
    }));

    return res.status(200).json({ matchedCreators: matchedCreatorData });
  } catch (error) {
    next(error);
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

// Function to create or update a cookie
exports.createOrUpdateCookie = async (req, res, next) => {
  try {
    const { userId, cookieName, cookieValue } = req.body;

    if (!userId || !cookieName || !cookieValue) {
      return res.status(400).json({ message: "userId, cookieName, and cookieValue are required" });
    }

    // Upsert the cookie data
    const cookieData = await Cookie.findOneAndUpdate(
      { userId, cookieName },
      { cookieValue },
      { new: true, upsert: true } // Create if it doesn't exist
    );

    return res.status(200).json({
      message: "Cookie stored successfully",
      data: cookieData,
    });
  } catch (error) {
    next(error);
  }
};

// Function to retrieve cookies for a user
exports.getCookiesByUserId = async (req, res, next) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const cookies = await Cookie.find({ userId });
    return res.status(200).json({
      cookies,
    });
  } catch (error) {
    next(error);
  }
};
