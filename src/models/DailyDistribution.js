const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DistributionDataSchema = new Schema({
  recipients: [String],
  amounts: [String],
  totalAmount: String
});

const DayDistributionDetailSchema = new Schema({
  dayStart: { type: String, required: true }, // e.g. "2025-03-10T00:00:00.000Z"
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
  // Aggregated six-hour segments for the day
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

const DailyDistributionSchema = new Schema({
  creatorName: { type: String, required: true },
  tokenContract: String,
  distributionContract: String,
  agentAddress: String,
  scheme: String,
  dailyDistribution: [DayDistributionDetailSchema]
}, { timestamps: true });

module.exports = mongoose.model('DailyDistribution', DailyDistributionSchema);
