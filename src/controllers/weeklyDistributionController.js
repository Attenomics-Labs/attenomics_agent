// src/controllers/weeklyDistributionController.js
const WeeklyDistribution = require('../models/WeeklyDistribution');
const Attention = require('../models/Attention');
const crypto = require('crypto');

// Helper function to compute hash
const computeHash = (data) => {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

exports.createWeeklyDistribution = async (req, res) => {
  try {
    const {
      creatorName,
      tokenContract,
      distributionContract,
      agentAddress,
      scheme,
      weekStart
    } = req.body;
    
    if (!creatorName || !weekStart) {
      return res.status(400).json({ message: "creatorName and weekStart are required" });
    }
    
    // Parse weekStart and compute end date (weekStart + 7 days)
    const startDate = new Date(weekStart);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({ message: "Invalid weekStart date" });
    }
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
    
    // Find the Attention document for this creator
    const attentionDoc = await Attention.findOne({ creatorName });
    if (!attentionDoc) {
      return res.status(404).json({ message: "No attention data found for this creator" });
    }
    
    // attentionDoc.days is a Map. We iterate over its keys (date strings)
    let distributionMap = {}; // key: walletAddress, value: cumulative amount
    let allAttentionEntries = []; // for hash computation
    
    attentionDoc.days.forEach((dayData, dayKey) => {
      const dayDate = new Date(dayKey);
      if (dayDate >= startDate && dayDate < endDate) {
        // Collect this day's entry for hashing later
        allAttentionEntries.push({ day: dayKey, data: dayData });
        // For each distribution entry, calculate the daily amount
        dayData.distribution.forEach(dist => {
          const dailyAmount = dayData.latestAttention * (dist.percentage / 100);
          if (distributionMap[dist.walletAddress]) {
            distributionMap[dist.walletAddress] += dailyAmount;
          } else {
            distributionMap[dist.walletAddress] = dailyAmount;
          }
        });
      }
    });
    
    // Build the DistributionData object
    const recipients = [];
    const amounts = [];
    let totalAmount = 0;
    for (const [walletAddress, amount] of Object.entries(distributionMap)) {
      recipients.push(walletAddress);
      amounts.push(amount);
      totalAmount += amount;
    }
    const distributionData = { recipients, amounts, totalAmount };
    
    // Compute a hash from the collected attention entries
    const dataHash = computeHash(allAttentionEntries);
    // Simulate a signed hash (for example, by prepending a fixed string)
    const signedHash = 'signed_' + dataHash;
    
    // Build a weekly distribution entry
    const weekEntry = {
      weekStart,
      DistributionData: distributionData,
      dataHash,
      signedHash
    };
    
    // Either create a new WeeklyDistribution document for this creator or update an existing one
    let weeklyDistributionDoc = await WeeklyDistribution.findOne({ creatorName });
    if (!weeklyDistributionDoc) {
      weeklyDistributionDoc = await WeeklyDistribution.create({
        creatorName,
        tokenContract,
        distributionContract,
        agentAddress,
        scheme,
        weekDistribution: [weekEntry]
      });
    } else {
      // Append the new week distribution entry
      weeklyDistributionDoc.weekDistribution.push(weekEntry);
      await weeklyDistributionDoc.save();
    }
    
    return res.status(201).json({ message: "Weekly Distribution created", data: weeklyDistributionDoc });
  } catch (error) {
    console.error("Error in createWeeklyDistribution:", error);
    return res.status(500).json({ error: error.message });
  }
};
