const path = require("path");
const fs = require("fs");
const { fetchMetadataFromIpfs } = require("../externalApi/IpfsApi");
const Creator = require('../models/Creator');
const User = require('../models/User');
const CreatorList = require('../models/CreatorList');

// Path to the JSON file where data will be stored
const dataFilePath = path.join(__dirname, "..", "data", "creatorData.json");
const creatorNameFilePath = path.join(__dirname, "..", "data", "creatorNames.json");

/**
 * POST /api/data/store
 * Expects a JSON body with the following structure:
 * {
 *   "twitterUsername": "someUser",
 *   "creatorXProfile": "...",
 *   "creatorTokenAddress": "...",
 *   "distributorContractAddress": "...",
 *   "bondingCurveAddress": "...",
 *   "selfTokenVaultAddress": "...",
 *   "socialDataUser": {
 *       "telegramGroup": "...",
 *       "otherSocialProfiles": "..."
 *   },
 *   "creatorWalletAddress": "...",
 *   "nftIpfsCid": "...",
 *   "entryPointAddress": "...",
 *   "attention": [],
 * }
 */

exports.getDataByUsername = async (req, res, next) => {
  try {
    const { username } = req.query;
    const creator = await Creator.findOne({ creatorName: username });
    if (!creator) return res.status(404).json({ message: 'Creator not found' });
    res.status(200).json({ data: creator });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.storeByUsername = async (req, res, next) => {
  try {
    const {
      twitterUsername,
      creatorTokenAddress,
      distributorContractAddress,
      bondingCurveAddress,
      selfTokenVaultAddress,
      socialDataUser,
      creatorWalletAddress,
      nftIpfsCid,
      entryPointAddress,
      attention,
    } = req.body;

    if (!twitterUsername) {
      return res.status(400).json({ message: "twitterUsername is required" });
    }

    // Store creator data in the Creator collection
    const newCreator = await Creator.create({
      creatorName: twitterUsername,
      creatorTokenAddress,
      distributorContractAddress,
      bondingCurveAddress,
      selfTokenVaultAddress,
      socialDataUser,
      creatorWalletAddress,
      nftIpfsCid,
      entryPointAddress,
      attention: attention || [],
    });

    // Register the creator as a user
    const newUser = await User.create({
      username: twitterUsername,
      walletAddress: creatorWalletAddress,
    });

    // Update the CreatorList collection
    await CreatorList.findOneAndUpdate(
      { creatorNames: { $ne: twitterUsername } },
      { $addToSet: { creatorNames: twitterUsername } },
      { upsert: true }
    );

    return res.status(201).json({
      message: "Data stored successfully",
      creator: newCreator,
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/creator/creatorNames/
 * Returns an array of all stored Twitter creatorNames from the CreatorList collection
 */
exports.getAllCreators = async (req, res, next) => {
  try {
    const creatorList = await CreatorList.findOne({}, 'creatorNames'); // Fetch the creatorNames from the CreatorList collection
    if (!creatorList) {
      return res.status(404).json({ message: 'No creators found' });
    }
    
    return res.status(200).json({
      creatorNames: creatorList.creatorNames, // Return the creatorNames array
    });
  } catch (error) {
    next(error);
  }
};


