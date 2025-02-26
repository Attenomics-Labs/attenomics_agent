// src/models/Item.js
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
