// src/models/DailySummary.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DailySummarySchema = new Schema({
  date: { type: String, required: true },
  unixTimestamp: { type: Number, required: true },
  reqHash: { type: String, required: true },
  resHash: { type: String, required: true },
  distribution: [{
    creatorName: String,
    attention: Number
  }]
}, { timestamps: true });

module.exports = mongoose.model('DailySummary', DailySummarySchema);
