// src/models/CreatorTweetMetrics.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TweetSchema = new Schema({
  tweetId: { type: String, required: true },
  likes: { type: Number, default: 0 },
  retweets: { type: Number, default: 0 },
  replies: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  timestamp: { type: Number, required: true }
});

const CreatorTweetMetricsSchema = new Schema({
  creatorName: { type: String, required: true, unique: true },
  tweets: [TweetSchema]
}, { timestamps: true });

module.exports = mongoose.model('CreatorTweetMetrics', CreatorTweetMetricsSchema);
