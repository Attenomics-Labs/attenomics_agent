const mongoose = require("mongoose");

const hourlyRecordSchema = new mongoose.Schema({
  unixTimestamp: {
    type: Number,
    required: true
  },
  latestAttention: {
    type: Number,
    required: true
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

const creatorHourlyRecordSchema = new mongoose.Schema({
  creatorName: {
    type: String,
    required: true,
    unique: true
  },
  hourly: [hourlyRecordSchema]
}, {
  timestamps: true
});

// Index for faster queries
creatorHourlyRecordSchema.index({ creatorName: 1 });
creatorHourlyRecordSchema.index({ 'hourly.unixTimestamp': 1 });

const CreatorHourlyRecord = mongoose.model("CreatorHourlyRecord", creatorHourlyRecordSchema);

module.exports = CreatorHourlyRecord; 