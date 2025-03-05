const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DirectDistributionSchema = new Schema({
  creatorName: { type: String, required: true },
  tokenContract: { type: String, required: true },
  distributionContract: { type: String, required: true },
  recipients: [String],
  amounts: [String],
  totalAmount: String,
  isDistributed: { type: Boolean, default: false },
  transactionHash: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DirectDistribution', DirectDistributionSchema); 