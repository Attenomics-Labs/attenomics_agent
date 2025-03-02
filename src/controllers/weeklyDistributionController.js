// src/controllers/weeklyDistributionController.js
const WeeklyDistribution = require('../models/WeeklyDistribution');
const Attention = require('../models/Attention');
const Creator = require('../models/Creator'); // for fetching creator details
const crypto = require('crypto');

// Helper function to compute hash
const computeHash = (data) => {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

// New endpoint: Process weekly distribution for EVERY creator in the DB
exports.createWeeklyDistributionForAll = async (req, res) => {
  console.log("Received POST /weekly-distribution/all with body:", req.body);
  try {
    const { weekStart, agentAddress, scheme } = req.body;
    if (!weekStart) {
      return res.status(400).json({ message: "weekStart is required" });
    }
    
    // Parse weekStart and compute end date (weekStart + 7 days)
    const startDate = new Date(weekStart);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({ message: "Invalid weekStart date" });
    }
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
    
    // Get all creators from the Creator collection
    const creators = await Creator.find();
    if (!creators.length) {
      return res.status(404).json({ message: "No creators found" });
    }
    
    let results = [];
    
    // Process each creator
    for (let creator of creators) {
      // Retrieve attention data for the creator
      const attentionDoc = await Attention.findOne({ creatorName: creator.creatorName });
      if (!attentionDoc) continue; // skip if no attention data
      
      let distributionMap = {}; // key: walletAddress, value: cumulative amount
      let allAttentionEntries = []; // for hash computation
      let dailyDataList = []; // array to store daily data
      
      // Iterate over each day's attention data stored in the Map
      attentionDoc.days.forEach((dayData, dayKey) => {
        const dayDate = new Date(dayKey);
        if (dayDate >= startDate && dayDate < endDate) {
          // Push daily data to our list (include the day key)
          dailyDataList.push({
            day: dayKey,
            latestAttention: dayData.latestAttention,
            unixTimestamp: dayData.unixTimestamp,
            reqHash: dayData.reqHash,
            resHash: dayData.resHash,
            distribution: dayData.distribution
          });
          // Also collect for hash computation
          allAttentionEntries.push({ day: dayKey, data: dayData });
          
          // For each distribution entry, calculate the daily amount and aggregate
          dayData.distribution.forEach(dist => {
            const dailyAmount = dayData.latestAttention * (dist.percentage / 100);
            distributionMap[dist.walletAddress] = (distributionMap[dist.walletAddress] || 0) + dailyAmount;
          });
        }
      });
      
      // Build aggregated DistributionData
      const recipients = [];
      const amounts = [];
      let totalAmount = 0;
      for (const [walletAddress, amount] of Object.entries(distributionMap)) {
        recipients.push(walletAddress);
        amounts.push(amount);
        totalAmount += amount;
      }
      const distributionData = { recipients, amounts, totalAmount };
      
      // Compute hash and signed hash based on all daily entries
      const dataHash = computeHash(allAttentionEntries);
      const signedHash = 'signed_' + dataHash;
      
      const weekEntry = {
        weekStart,
        DistributionData: distributionData,
        dailyData: dailyDataList,
        dataHash,
        signedHash
      };
      
      // Use tokenContract and distributionContract from the Creator document
      let weeklyDistributionDoc = await WeeklyDistribution.findOne({ creatorName: creator.creatorName });
      if (!weeklyDistributionDoc) {
        weeklyDistributionDoc = await WeeklyDistribution.create({
          creatorName: creator.creatorName,
          tokenContract: creator.creatorTokenAddress,
          distributionContract: creator.distributorContractAddress,
          agentAddress,
          scheme,
          weekDistribution: [weekEntry]
        });
      } else {
        weeklyDistributionDoc.weekDistribution.push(weekEntry);
        await weeklyDistributionDoc.save();
      }
      
      results.push(weeklyDistributionDoc);
    }
    
    return res.status(201).json({ 
      message: "Weekly Distribution created for all creators", 
      data: results.map(doc => doc.toObject()) 
    });
  } catch (error) {
    console.error("Error in createWeeklyDistributionForAll:", error);
    return res.status(500).json({ error: error.message });
  }
};
