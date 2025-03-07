const CreatorList = require("../models/CreatorList");

/**
 * Updates the list of creator names
 * @param {Object} req - Request object containing creatorNames array
 * @param {Object} res - Response object
 */
exports.updateCreatorList = async (req, res) => {
  try {
    const { creatorNames } = req.body;
    
    if (!Array.isArray(creatorNames)) {
      return res.status(400).json({ 
        error: "creatorNames must be an array" 
      });
    }

    // Find the first document or create a new one
    let creatorList = await CreatorList.findOne();
    
    if (!creatorList) {
      creatorList = await CreatorList.create({ creatorNames });
    } else {
      creatorList.creatorNames = creatorNames;
      await creatorList.save();
    }

    return res.status(200).json({
      message: "Creator list updated successfully",
      data: creatorList
    });

  } catch (error) {
    console.error("Error in updateCreatorList:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Gets the current list of creator names
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getCreatorList = async (req, res) => {
  try {
    const creatorList = await CreatorList.findOne();
    
    if (!creatorList) {
      return res.status(404).json({ 
        message: "No creator list found" 
      });
    }

    return res.status(200).json({
      data: creatorList
    });

  } catch (error) {
    console.error("Error in getCreatorList:", error);
    return res.status(500).json({ error: error.message });
  }
}; 