// seedData.js
require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const Creator = require('./src/models/Creator');
const Attention = require('./src/models/Attention');
const User = require('./src/models/User');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.CONNECTION_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB for seeding data...');

    // Clear existing data
    await Creator.deleteMany({});
    await Attention.deleteMany({});
    await User.deleteMany({});

    // Insert a sample Creator for JohnDoe
    const creatorJohn = await Creator.create({
      creatorName: "JohnDoe",
      creatorTokenAddress: "0x123456789",
      distributorContractAddress: "0xB7A90bb4402861432c584b8c33eB4874f0676C47",
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
    console.log('Inserted Creator:', creatorJohn);

    // Insert an Attention document for JohnDoe with multiple days in the week
    const attentionJohn = await Attention.create({
      creatorName: "JohnDoe",
      days: {
        "2025-02-17": {
          latestAttention: 120,
          unixTimestamp: new Date("2025-02-17").getTime(),
          reqHash: "reqhash17",
          resHash: "reshash17",
          distribution: [
            { name: "Alice", walletAddress: "0xBaFc2C2Fd55230D1d3d0Bf95EdFaF10aA109245D", percentage: 60 },
            { name: "Bob", walletAddress: "0x1950498e95274Dc79Fbca238C2BE53684D69886F", percentage: 40 }
          ]
        },
        "2025-02-18": {
          latestAttention: 100,
          unixTimestamp: new Date("2025-02-18").getTime(),
          reqHash: "reqhash18",
          resHash: "reshash18",
          distribution: [
            { name: "Alice", walletAddress: "0xBaFc2C2Fd55230D1d3d0Bf95EdFaF10aA109245D", percentage: 60 },
            { name: "Bob", walletAddress: "0x1950498e95274Dc79Fbca238C2BE53684D69886F", percentage: 40 }
          ]
        },
        "2025-02-19": {
          latestAttention: 150,
          unixTimestamp: new Date("2025-02-19").getTime(),
          reqHash: "reqhash19",
          resHash: "reshash19",
          distribution: [
            { name: "Alice", walletAddress: "0xBaFc2C2Fd55230D1d3d0Bf95EdFaF10aA109245D", percentage: 60 },
            { name: "Bob", walletAddress: "0x1950498e95274Dc79Fbca238C2BE53684D69886F", percentage: 40 }
          ]
        },
        "2025-02-20": {
          latestAttention: 130,
          unixTimestamp: new Date("2025-02-20").getTime(),
          reqHash: "reqhash20",
          resHash: "reshash20",
          distribution: [
            { name: "Alice", walletAddress: "0xBaFc2C2Fd55230D1d3d0Bf95EdFaF10aA109245D", percentage: 60 },
            { name: "Bob", walletAddress: "0x1950498e95274Dc79Fbca238C2BE53684D69886F", percentage: 40 }
          ]
        },
        "2025-02-21": {
          latestAttention: 110,
          unixTimestamp: new Date("2025-02-21").getTime(),
          reqHash: "reqhash21",
          resHash: "reshash21",
          distribution: [
            { name: "Alice", walletAddress: "0xBaFc2C2Fd55230D1d3d0Bf95EdFaF10aA109245D", percentage: 60 },
            { name: "Bob", walletAddress: "0x1950498e95274Dc79Fbca238C2BE53684D69886F", percentage: 40 }
          ]
        }
      }
    });
    console.log('Inserted Attention for JohnDoe:', attentionJohn);

    // Insert a sample Creator for Anjanay
    const creatorAnjanay = await Creator.create({
      creatorName: "Anjanay",
      creatorTokenAddress: "0x123456789",
      distributorContractAddress: "0xB7A90bb4402861432c584b8c33eB4874f0676C47",
      bondingCurveAddress: "0x111222333",
      selfTokenVaultAddress: "0x444555666",
      socialDataUser: {
        telegramGroup: "Group1",
        otherSocialProfiles: "twitter.com/Anjanay"
      },
      creatorWalletAddress: "0xabcdef123",
      nftIpfsCid: "cid12345",
      entryPointAddress: "0x999888777"
    });
    console.log('Inserted Creator:', creatorAnjanay);

    // Insert an Attention document for Anjanay with a few days
    const attentionAnjanay = await Attention.create({
      creatorName: "Anjanay",
      days: {
        "2025-02-17": {
          latestAttention: 200,
          unixTimestamp: new Date("2025-02-17").getTime(),
          reqHash: "reqhash17_anj",
          resHash: "reshash17_anj",
          distribution: [
            { name: "Charlie", walletAddress: "0x0356Cad402a2582D7416dAE3f298F7470177677C", percentage: 70 },
            { name: "David", walletAddress: "0x4AB9f7740fA4d9A9482C2C8F26f7C17269Da72Ad", percentage: 30 }
          ]
        },
        "2025-02-18": {
          latestAttention: 180,
          unixTimestamp: new Date("2025-02-18").getTime(),
          reqHash: "reqhash18_anj",
          resHash: "reshash18_anj",
          distribution: [
            { name: "Charlie", walletAddress: "0x0356Cad402a2582D7416dAE3f298F7470177677C", percentage: 70 },
            { name: "David", walletAddress: "0x4AB9f7740fA4d9A9482C2C8F26f7C17269Da72Ad", percentage: 30 }
          ]
        },
        "2025-02-19": {
          latestAttention: 190,
          unixTimestamp: new Date("2025-02-19").getTime(),
          reqHash: "reqhash19_anj",
          resHash: "reshash19_anj",
          distribution: [
            { name: "Charlie", walletAddress: "0x0356Cad402a2582D7416dAE3f298F7470177677C", percentage: 70 },
            { name: "David", walletAddress: "0x4AB9f7740fA4d9A9482C2C8F26f7C17269Da72Ad", percentage: 30 }
          ]
        }
      }
    });
    console.log('Inserted Attention for Anjanay:', attentionAnjanay);

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
