const path = require("path");
const fs = require("fs");
const { fetchMetadataFromIpfs } = require("../externalApi/IpfsApi");

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
    const { twitterUsername } = req.query; // <-- use req.query here

    if (!fs.existsSync(dataFilePath)) {
      return res.status(404).json({ message: "No data found" });
    }

    const fileContent = fs.readFileSync(dataFilePath, "utf8");
    const existingData = JSON.parse(fileContent || "{}");

    if (!existingData[twitterUsername]) {
      return res
        .status(404)
        .json({ message: `No data found for user ${twitterUsername}` });
    }

    // Extract the NFT IPFS CID from the stored data
    const creatorData = existingData[twitterUsername];
    const { nftIpfsCid } = creatorData;

    if (!nftIpfsCid) {
      return res
        .status(400)
        .json({ message: `No nftIpfsCid found for user ${twitterUsername}` });
    }

    // Fetch the NFT metadata from IPFS
    const nftMetadata = await fetchMetadataFromIpfs(nftIpfsCid);

    // You can choose to return both the stored data and the fetched metadata
    return res.status(200).json({
      storedData: creatorData,
      nftMetadata,
    });
  } catch (error) {
    next(error);
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

    // Read or initialize main data file
    let existingData = {};
    if (fs.existsSync(dataFilePath)) {
      const fileContent = fs.readFileSync(dataFilePath, "utf8");
      existingData = JSON.parse(fileContent || "{}");
    }

    // Store data under the Twitter username
    existingData[twitterUsername] = {
      creatorTokenAddress,
      distributorContractAddress,
      bondingCurveAddress,
      selfTokenVaultAddress,
      socialDataUser,
      creatorWalletAddress,
      nftIpfsCid,
      entryPointAddress,
      attention: attention || [],
    };

    // Write to main data file
    fs.writeFileSync(
      dataFilePath,
      JSON.stringify(existingData, null, 2),
      "utf8"
    );

    // Handle creatorNames.json
    let creatorNames = [];
    if (fs.existsSync(creatorNameFilePath)) {
      const creatorNamesContent = fs.readFileSync(creatorNameFilePath, "utf8");
      const creatorNamesData = JSON.parse(creatorNamesContent || "{}");
      creatorNames = creatorNamesData.creatorNames || [];
    }

    if (!creatorNames.includes(twitterUsername)) {
      creatorNames.push(twitterUsername);
    }
    fs.writeFileSync(
      creatorNameFilePath,
      JSON.stringify({ creatorNames }, null, 2),
      "utf8"
    );


    return res.status(200).json({
      message: "Data stored successfully",
      username: twitterUsername,
      filesCreated: {
        creatorData: dataFilePath,
        creatorNames: creatorNameFilePath,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/creator/creatorNames/
 * Returns an array of all stored Twitter creatorNames
 */
exports.getAllCreators = async (req, res, next) => {
  try {
    if (!fs.existsSync(creatorNameFilePath)) {
      return res.status(200).json({ creatorNames: [] });
    }

    const fileContent = fs.readFileSync(creatorNameFilePath, "utf8");
    const data = JSON.parse(fileContent || "{}");

    return res.status(200).json({
      creatorNames: data.creatorNames || [],
    });
  } catch (error) {
    next(error);
  }
};

const Creator = require('../models/Creator');

// POST /creator/post-creator-token/
// This endpoint will add a new creator document.
exports.storeByUsername = async (req, res) => {
  try {
    // Expect the request body to include the creator fields.
    const newCreator = await Creator.create(req.body);
    res.status(201).json({ message: 'Creator created successfully', data: newCreator });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /creator/get-creator-data/?username=JohnDoe
// This endpoint retrieves creator data based on the creatorName (passed as a query parameter).
exports.getDataByUsername = async (req, res) => {
  try {
    const { username } = req.query;
    const creator = await Creator.findOne({ creatorName: username });
    if (!creator) return res.status(404).json({ message: 'Creator not found' });
    res.status(200).json({ data: creator });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /creator/creator-names/
// This endpoint returns only the names of all creators.
exports.getAllCreators = async (req, res) => {
  try {
    const creators = await Creator.find({}, 'creatorName');
    res.status(200).json({ data: creators });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


