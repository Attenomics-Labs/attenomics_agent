// src/models/WeeklyDistribution.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DistributionDataSchema = new Schema({
  recipients: [String],
  amounts: [Number],
  totalAmount: Number
});

const WeekDistributionDetailSchema = new Schema({
  weekStart: { type: String, required: true },
  DistributionData: DistributionDataSchema,
  dataHash: String,
  signedHash: String
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
