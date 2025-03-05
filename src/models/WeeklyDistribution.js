// src/models/WeeklyDistribution.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DistributionDataSchema = new Schema({
  recipients: [String],
  amounts: [String],
  totalAmount: String
});

const WeekDistributionDetailSchema = new Schema({
  weekStart: { type: String, required: true },
  DistributionData: DistributionDataSchema,
  // Store all daily attention data for the week as an array
  dailyData: [{ 
    day: String,
    latestAttention: Number,
    unixTimestamp: Number,
    reqHash: String,
    resHash: String,
    distribution: [{
      name: String,
      walletAddress: String,
      percentage: Number
    }]
  }],
  dataHash: String,
  signedHash: String,
  encodedData: String  // Added field to store the encoded distribution data
});

const WeeklyDistributionSchema = new Schema({
  creatorName: { type: String, required: true },
  tokenContract: String,
  distributionContract: String,
  agentAddress: String,
  scheme: String,
  weekDistribution: [WeekDistributionDetailSchema]
}, { timestamps: true });

module.exports = mongoose.model('WeeklyDistribution', WeeklyDistributionSchema);
