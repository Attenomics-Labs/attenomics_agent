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
  // Signature-based distribution data
  DistributionData: DistributionDataSchema,
  dataHash: String,
  signedHash: String,
  encodedData: String,
  // Direct array-based distribution data
  directDistribution: {
    recipients: [String],
    amounts: [String],
    totalAmount: String
  },
  // Common fields
  dailyData: [{ 
    day: String,
    latestAttention: Number,
    unixTimestamp: Number,
    reqHash: String,
    resHash: String,
    distribution: [{
      walletAddress: String,
      percentage: Number
    }]
  }],
  isBroadcasted: { type: Boolean, default: false },
  transactionReceipt: { type: String, default: "" },
  distributionMethod: { 
    type: String, 
    enum: ['signature', 'direct', null],
    default: null 
  }
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
