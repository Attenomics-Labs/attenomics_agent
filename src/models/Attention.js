// src/models/Attention.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define a sub-schema for each day's data.
const DaySchema = new Schema({
  latestAttention: { type: Number, required: true },
  // Using camelCase instead of "unix-timestamp"
  unixTimestamp: { type: Number, required: true },
  reqHash: { type: String, required: true },
  resHash: { type: String, required: true },
  distribution: [{
    name: String,
    walletAddress: String,
    percentage: Number
  }]
});

const AttentionSchema = new Schema({
  creatorName: { type: String, required: true },
  days: {
    type: Map,
    of: DaySchema
  }
}, { timestamps: true });

module.exports = mongoose.model('Attention', AttentionSchema);
