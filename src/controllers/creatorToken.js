const path = require('path');
const fs = require('fs');
const { fetchMetadataFromIpfs } = require('../externalApi/IpfsApi');

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

exports.getDataByUsername = async(req, res, next) => {
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

    // Extract the NFT IPFS CID from the stored data
    const creatorData = existingData[twitterUsername];
    const { nftIpfsCid } = creatorData;

    if (!nftIpfsCid) {
      return res.status(400).json({ message: `No nftIpfsCid found for user ${twitterUsername}` });
    }

    // Fetch the NFT metadata from IPFS
    const nftMetadata = await fetchMetadataFromIpfs(nftIpfsCid);

    // You can choose to return both the stored data and the fetched metadata
    return res.status(200).json({
      storedData: creatorData,
      nftMetadata
    });
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
