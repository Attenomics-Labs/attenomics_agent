const Creator = require("../models/Creator");

/**
 * Seeds creators from a list of usernames
 * @param {Object} req - Request object containing creatorNames array
 * @param {Object} res - Response object
 */
exports.seedCreators = async (req, res) => {
  try {
    const { creatorNames } = req.body;
    
    if (!Array.isArray(creatorNames) || creatorNames.length === 0) {
      return res.status(400).json({ 
        error: "creatorNames must be a non-empty array" 
      });
    }

    const createdCreators = [];
    const errors = [];

    for (const creatorName of creatorNames) {
      try {
        // Check if creator already exists
        const existingCreator = await Creator.findOne({ creatorName });
        if (existingCreator) {
          errors.push(`Creator ${creatorName} already exists`);
          continue;
        }

        // Create new creator with default values
        const creator = await Creator.create({
          creatorName,
          creatorTokenAddress: "0x0000000000000000000000000000000000000000", // Placeholder
          distributorContractAddress: "0x0000000000000000000000000000000000000000", // Placeholder
          bondingCurveAddress: "0x0000000000000000000000000000000000000000", // Placeholder
          selfTokenVaultAddress: "0x0000000000000000000000000000000000000000", // Placeholder
          creatorWalletAddress: "0x0000000000000000000000000000000000000000", // Placeholder
          nftIpfsCid: "", // Placeholder
          entryPointAddress: "0x0000000000000000000000000000000000000000", // Placeholder
          attention: [],
          scheme: "default"
        });

        createdCreators.push(creator);
      } catch (error) {
        errors.push(`Error creating creator ${creatorName}: ${error.message}`);
      }
    }

    return res.status(201).json({
      message: "Creators seeded successfully",
      created: createdCreators,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("Error in seedCreators:", error);
    return res.status(500).json({ error: error.message });
  }
}; 