// scripts/uploadData.js
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Item = require('../models/Item');

const seedData = async () => {
  try {
    await connectDB();
    console.log('Seeding database...');

    // Sample data array
    const items = [
      { name: 'Sample Item 1', description: 'Description for sample item 1' },
      { name: 'Sample Item 2', description: 'Description for sample item 2' },
      { name: 'Sample Item 3', description: 'Description for sample item 3' },
    ];

    // Optionally clear existing items
    await Item.deleteMany();

    // Insert sample data
    const insertedItems = await Item.insertMany(items);
    console.log('Data inserted:', insertedItems);
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
