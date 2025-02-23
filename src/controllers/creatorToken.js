const path = require('path');
const fs = require('fs');

// Path to the JSON file where data will be stored
const dataFilePath = path.join(__dirname, '..', 'data', 'creatorData.json');

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

exports.getDataByUsername = (req, res, next) => {
  try {
    const { twitterUsername } = req.query; // <-- use req.query here

    if (!fs.existsSync(dataFilePath)) {
      return res.status(404).json({ message: 'No data found' });
    }

    const fileContent = fs.readFileSync(dataFilePath, 'utf8');
    const existingData = JSON.parse(fileContent || '{}');

    if (!existingData[twitterUsername]) {
      return res.status(404).json({ message: `No data found for user ${twitterUsername}` });
    }

    return res.status(200).json(existingData[twitterUsername]);
  } catch (error) {
    next(error);
  }
};

exports.storeByUsername = (req, res, next) => {
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
      attention
    } = req.body;

    if (!twitterUsername) {
      return res.status(400).json({ message: 'twitterUsername is required' });
    }

    // Read existing data from file
    let existingData = {};
    if (fs.existsSync(dataFilePath)) {
      const fileContent = fs.readFileSync(dataFilePath, 'utf8');
      existingData = JSON.parse(fileContent || '{}');
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
      attention: attention || []
    };

    // Write updated data back to the file
    fs.writeFileSync(dataFilePath, JSON.stringify(existingData, null, 2), 'utf8');

    return res.status(200).json({ message: 'Data stored successfully' });
  } catch (error) {
    next(error);
  }
};
