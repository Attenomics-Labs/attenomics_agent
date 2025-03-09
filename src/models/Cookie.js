const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cookieSchema = new Schema({
  userId: { type: String, required: true }, // Reference to the user
  cookieName: { type: String, required: true },
  cookieValue: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Cookie', cookieSchema); 