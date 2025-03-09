const path = require("path");
const fs = require("fs");
const Attention = require('../models/Attention'); // Import the Attention model

// Path to the JSON file where data will be stored
const attentionDataFilePath = path.join(__dirname, "..", "data", "attention.json");

exports.getFraudProofByUserName = async (req, res, next) => {
  try {
    const { creatorName } = req.query;

    // Find the attention data for the given creatorName
    const attentionData = await Attention.findOne({ creatorName });
    if (!attentionData) {
      return res.status(404).json({ message: `No data found for user ${creatorName}` });
    }

    // Return the found entry
    return res.status(200).json({
      storedData: attentionData,
    });
  } catch (error) {
    next(error);
  }
};

// Function to create or update attention data
exports.createOrUpdateAttentionData = async (req, res, next) => {
  try {
    const { creatorName, attentionDetails } = req.body;

    if (!creatorName || !attentionDetails) {
      return res.status(400).json({ message: "creatorName and attentionDetails are required" });
    }

    // Upsert the attention data
    const attentionData = await Attention.findOneAndUpdate(
      { creatorName },
      { $set: { attentionDetails } },
      { new: true, upsert: true } // Create if it doesn't exist
    );

    return res.status(200).json({
      message: "Attention data stored successfully",
      data: attentionData,
    });
  } catch (error) {
    next(error);
  }
};
