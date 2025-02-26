// src/models/NFT.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NFTDataSchema = new Schema({
  creatorWalletAddress: String,
  name: String,
  symbol: String,
  image: String,
  description: String
});

const NFTSchema = new Schema({
  creatorName: { type: String, required: true },
  data: NFTDataSchema,
  fraudProof: String
}, { timestamps: true });

module.exports = mongoose.model('NFT', NFTSchema);
