// src/config/db.js
const mongoose = require('mongoose');
require('dotenv').config();


const connectDB = async () => {
  console.log('Attempting to connect to MongoDB with URI:', process.env.CONNECTION_URI); // Debug log
  try {
    await mongoose.connect(process.env.CONNECTION_URI, {
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout for server selection
    });
    console.log('MongoDB connected...');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
