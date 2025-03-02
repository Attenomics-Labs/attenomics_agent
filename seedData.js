// seedData.js
require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const Creator = require('./src/models/Creator');
const Attention = require('./src/models/Attention');
const User = require('./src/models/User');

const seedData = async () => {
  try {
    // Connect to MongoDB using your CONNECTION_URI from .env
    await mongoose.connect(process.env.CONNECTION_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB for seeding data...');

    // (Optional) Clear existing data
    await Creator.deleteMany({});
    await Attention.deleteMany({});
    await User.deleteMany({});

    // Insert a sample Creator document
    const creator = await Creator.create({
      creatorName: "JohnDoe",
      creatorTokenAddress: "0x123456789",
      distributorContractAddress: "0x987654321",
      bondingCurveAddress: "0x111222333",
      selfTokenVaultAddress: "0x444555666",
      socialDataUser: {
        telegramGroup: "Group1",
        otherSocialProfiles: "twitter.com/JohnDoe"
      },
      creatorWalletAddress: "0xabcdef123",
      nftIpfsCid: "cid12345",
      entryPointAddress: "0x999888777"
    });
    console.log('Inserted Creator:', creator);

    // Insert a sample Attention document
    const attention = await Attention.create({
      creatorName: "JohnDoe",
      days: {
        "2025-02-20": {
          latestAttention: 100,
          unixTimestamp: 1676966400,
          reqHash: "reqhash123",
          resHash: "reshash123",
          distribution: [
            { name: "Alice", walletAddress: "0xabc", percentage: 50 },
            { name: "Bob", walletAddress: "0xdef", percentage: 50 }
          ]
        }
      }
    });
    console.log('Inserted Attention:', attention);
   // Insert a sample Creator document
   const creator2 = await Creator.create({
    creatorName: "Anjanay",
    creatorTokenAddress: "0x123456789",
    distributorContractAddress: "0x987654321",
    bondingCurveAddress: "0x111222333",
    selfTokenVaultAddress: "0x444555666",
    socialDataUser: {
      telegramGroup: "Group1",
      otherSocialProfiles: "twitter.com/JohnDoe"
    },
    creatorWalletAddress: "0xabcdef123",
    nftIpfsCid: "cid12345",
    entryPointAddress: "0x999888777"
  });
  console.log('Inserted Creator:', creator2);

  // Insert a sample Attention document
  const attention2 = await Attention.create({
    creatorName: "Anjanay",
    days: {
      "2025-02-20": {
        latestAttention: 100,
        unixTimestamp: 1676966400,
        reqHash: "reqhash123",
        resHash: "reshash123",
        distribution: [
          { name: "Alice", walletAddress: "0xabc", percentage: 50 },
          { name: "Bob", walletAddress: "0xdef", percentage: 50 }
        ]
      }
    }
  });
  console.log('Inserted Attention:', attention2);
    // Insert a sample User document
    const user = await User.create({
      username: "follower1",
      walletAddress: "0xuserwallet"
    });
    console.log('Inserted User:', user);

    console.log('Data seeded successfully.');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
