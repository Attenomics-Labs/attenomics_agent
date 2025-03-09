const mongoose = require("mongoose");

// Schema for individual distribution entries
const distributionSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  reqHash: {
    type: String,
    required: true
  },
  resHash: {
    type: String,
    required: true
  }
});

// Schema for hourly records
const hourlySchema = new mongoose.Schema({
  timestamp: {
    type: Number,
    required: true
  },
  distribution: [distributionSchema]
});

// Main schema for user support data
const userPercentSuppSchema = new mongoose.Schema({
  Creatorname: {
    type: String,
    required: true,
    unique: true
  },
  hourly: [hourlySchema]
}, {
  timestamps: true
});

// Add indexes for faster queries
userPercentSuppSchema.index({ Creatorname: 1 });
userPercentSuppSchema.index({ 'hourly.timestamp': 1 });

const UserPercentSupp = mongoose.model("UserPercentSupp", userPercentSuppSchema);

module.exports = UserPercentSupp; 