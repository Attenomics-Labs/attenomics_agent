const path = require("path");
const fs = require("fs");

// Path to the JSON file where data will be stored
const attentionDataFilePath = path.join(__dirname, "..", "data", "attention.json");

exports.getFraudProofByUserName = async (req, res, next) => {
  try {
    const { creatorName } = req.query; // using req.query

    // If the file doesn't exist, return 404
    if (!fs.existsSync(attentionDataFilePath)) {
      return res.status(404).json({ message: "No data file found" });
    }

    // Parse the existing JSON data
    const fileContent = fs.readFileSync(attentionDataFilePath, "utf8");
    const existingData = JSON.parse(fileContent || "{}");

    // Ensure that "attention" is an array in the parsed data
    const attentionArray = Array.isArray(existingData.attention)
      ? existingData.attention
      : [];

    // Find the entry that matches the given creatorName
    const foundCreator = attentionArray.find(
      (entry) => entry.creatorName === creatorName
    );

    // If not found, return 404
    if (!foundCreator) {
      return res
        .status(404)
        .json({ message: `No data found for user ${creatorName}` });
    }

    // Return the found entry
    return res.status(200).json({
      storedData: foundCreator,
    });
  } catch (error) {
    next(error);
  }
};
