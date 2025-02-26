// src/models/Creator.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SocialDataUserSchema = new Schema({
  telegramGroup: String,
  otherSocialProfiles: String
});

const CreatorSchema = new Schema({
  creatorName: { type: String, required: true },
  creatorTokenAddress: String,
  distributorContractAddress: String,
  bondingCurveAddress: String,
  selfTokenVaultAddress: String,
  socialDataUser: SocialDataUserSchema,
  creatorWalletAddress: String,
  nftIpfsCid: String,
  entryPointAddress: String,
  // You can later populate this field with Attention data if needed.
  attention: { type: Array, default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Creator', CreatorSchema);
