// src/models/User.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String, required: true },
  walletAddress: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
