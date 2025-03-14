const mongoose = require("mongoose");

const creatorListSchema = new mongoose.Schema({
  creatorNames: {
    type: [String],
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("CreatorList", creatorListSchema); 