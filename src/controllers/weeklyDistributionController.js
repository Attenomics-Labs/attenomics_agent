/**
 * Weekly Distribution Controller
 * This controller handles the creation and management of weekly token distributions for creators.
 * It processes attention data and calculates token distributions based on creator performance.
 */

// @dev this will only work if we have the proper daily distribution data in the attention document
// This API needs to be run every week to update the weekly distribution and should know the start date of the week
const path = require("path");
const fs = require("fs");
const getScraper = require("../utils/scraper.js");
const WeeklyDistribution = require("../models/WeeklyDistribution");
const Attention = require("../models/Attention");
const Creator = require("../models/Creator");
const crypto = require("crypto");
const { contracts, provider, wallet } = require("../config/web3/contractConfig");
const { ethers } = require("ethers");

/**
 * Helper function to compute SHA-256 hash of data
 * Used for generating unique identifiers for distribution data
 */
const computeHash = (data) => {
  return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
};

/**
 * Main endpoint: Process weekly distribution for all creators
 *
 * Workflow:
 * 1. Validates input parameters (weekStart)
 * 2. Calculates date range for the week
 * 3. Fetches all creators from database
 * 4. For each creator:
 *    - Retrieves their attention data
 *    - Processes daily attention entries within the week
 *    - Calculates token distribution based on attention metrics
 *    - Creates or updates weekly distribution record
 *
 * @param {Object} req - Request object containing weekStart
 * @param {Object} res - Response object
 */
exports.createWeeklyDistributionForAll = async (req, res) => {
  console.log("Received POST /weekly-distribution/all with body:", req.body);
  try {
    // Input validation
    const { weekStart } = req.body;
    if (!weekStart) {
      return res.status(400).json({ message: "weekStart is required" });
    }

    // Calculate week's date range
    const startDate = new Date(weekStart + 'T00:00:00.000Z');
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({ message: "Invalid weekStart date" });
    }
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    // Fetch all creators from database
    const creators = await Creator.find();
    if (!creators.length) {
      return res.status(404).json({ message: "No creators found" });
    }

    let results = [];

    // Process each creator's data
    for (let creator of creators) {
      // Skip if creator doesn't have a valid distributor contract address
      if (!creator.distributorContractAddress) {
        console.log(`No distributor contract address found for ${creator.creatorName}, skipping...`);
        continue;
      }

      // Get creator's attention data from database
      const attentionDoc = await Attention.findOne({
        creatorName: creator.creatorName,
      });
      if (!attentionDoc) {
        console.log(
          `No attention data found for ${creator.creatorName}, skipping...`
        );
        continue;
      }

      // Initialize data structures for processing
      let distributionMap = {}; // Maps wallet addresses to their cumulative token amounts
      let allAttentionEntries = []; // Stores all attention entries for hash computation
      let dailyDataList = []; // Stores processed daily data for the week

      // Initialize distributor contract to get configuration once per creator
      const distributorContract = new ethers.Contract(
        creator.distributorContractAddress,
        contracts.creatorTokenSupporter.abi,
        provider
      );

      // Fetch distributor configuration once per creator
      const distributorConfig = await distributorContract.distributorConfig();
      const dailyDripAmountToDistribute = Number(ethers.formatEther(distributorConfig[0]));
      console.log(`Daily drip amount for ${creator.creatorName}:`, {
        raw: distributorConfig[0],
        formatted: dailyDripAmountToDistribute,
        daysInWeek: dailyDataList.length
      });

      // Get the days object from the attention document
      const attentionData = attentionDoc.toObject();
      console.log("Full attention data:", JSON.stringify(attentionData, null, 2));
      console.log("Creator name:", creator.creatorName);
      console.log("Days object:", attentionData.days);
      
      const days = attentionData.days;
      if (!days || typeof days !== 'object') {
        console.log("No days data found or invalid format");
        continue;
      }

      // Convert Map to array of entries if it's a Map
      const daysEntries = days instanceof Map ? Array.from(days.entries()) : Object.entries(days);
      
      // Iterate over each day's attention data within the week
      for (const [dayKey, dayData] of daysEntries) {
        // Skip MongoDB internal properties
        if (dayKey.startsWith('$')) continue;
        
        // Parse the date string properly
        const dayDate = new Date(dayKey);
        console.log("Checking date:", {
          dayKey,
          dayDate: dayDate.getTime(),
          startDate: startDate.getTime(),
          endDate: endDate.getTime(),
          isInRange: dayDate >= startDate && dayDate < endDate,
          dayData: dayData
        });
        
        if (dayDate >= startDate && dayDate < endDate) {
          console.log("Found matching date:", dayKey);
          // Store daily data for the week
          dailyDataList.push({
            day: dayKey,
            latestAttention: dayData.latestAttention,
            unixTimestamp: dayData.unixTimestamp,
            reqHash: dayData.reqHash,
            resHash: dayData.resHash,
            distribution: dayData.distribution,
          });

          // Collect data for hash computation
          allAttentionEntries.push({ day: dayKey, data: dayData });

          // Calculate token distribution for each recipient
          for (const dist of dayData.distribution) {
            // Calculate daily amount based on percentage and daily drip amount
            const dailyAmount = dailyDripAmountToDistribute * (dist.percentage / 100);
            console.log(`Daily amount calculation for ${dist.walletAddress}:`, {
              percentage: dist.percentage,
              dailyDripAmount: dailyDripAmountToDistribute,
              dailyAmount,
              currentTotal: distributionMap[dist.walletAddress] || 0,
              day: dayKey
            });
            // Aggregate amounts for each wallet address
            distributionMap[dist.walletAddress] = (distributionMap[dist.walletAddress] || 0) + dailyAmount;
          }
        }
      }

      // Skip if no daily data found for the week
      if (dailyDataList.length === 0) {
        console.log(
          `No daily data for creator ${creator.creatorName} in week starting ${weekStart}, skipping week entry.`
        );
        continue;
      }

      // Prepare distribution data for both methods
      const recipients = [];
      const amounts = [];
      let totalAmount = 0;

      // Convert distribution map to arrays for storage
      for (const [walletAddress, amount] of Object.entries(distributionMap)) {
        recipients.push(walletAddress);
        // Convert amount to wei format and then to string for MongoDB storage
        const amountInWei = ethers.parseEther(amount.toString());
        amounts.push(amountInWei.toString());
        // Add to total in regular number format
        totalAmount += amount;
      }

      // Convert total amount to wei format at the end and to string for MongoDB storage
      const totalAmountInWei = ethers.parseEther(totalAmount.toString());

      // Prepare data for signature-based distribution
      const distributionData = { 
        recipients, 
        amounts, 
        totalAmount: totalAmountInWei.toString() 
      };

      // Encode the distribution data for signature-based method
      const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
        ['tuple(address[],uint256[],uint256)'],
        [[distributionData.recipients, distributionData.amounts, distributionData.totalAmount]]
      );

      // Compute keccak256 hash of the distribution data
      const dataHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['address[]', 'uint256[]', 'uint256'],
          [distributionData.recipients, distributionData.amounts, distributionData.totalAmount]
        )
      );

      // Sign the hash with the wallet
      const signedHash = await wallet.signMessage(ethers.getBytes(dataHash));

      // Create week entry object with both distribution methods
      const weekEntry = {
        weekStart,
        DistributionData: distributionData,
        dataHash,
        signedHash,
        encodedData,
        directDistribution: {
          recipients,
          amounts,
          totalAmount: totalAmountInWei.toString()
        },
        dailyData: dailyDataList,
        isBroadcasted: false,
        transactionReceipt: "",
        distributionMethod: null // Will be set when broadcasting
      };

      // Update or create weekly distribution record
      let weeklyDistributionDoc = await WeeklyDistribution.findOne({
        creatorName: creator.creatorName,
      });

      // Check if week entry already exists
      const existingWeekEntry = weeklyDistributionDoc?.weekDistribution?.find(
        entry => entry.weekStart === weekStart
      );

      if (existingWeekEntry) {
        console.log(`Week entry for ${weekStart} already exists for ${creator.creatorName}, skipping...`);
        continue;
      }

      if (!weeklyDistributionDoc) {
        // Create new document if none exists
        weeklyDistributionDoc = await WeeklyDistribution.create({
          creatorName: creator.creatorName,
          tokenContract: creator.creatorTokenAddress,
          distributionContract: creator.distributorContractAddress,
          agentAddress: creator.agentAddress,
          scheme: creator.scheme,
          weekDistribution: [weekEntry],
        });
      } else {
        // Append new week entry to existing document
        weeklyDistributionDoc.weekDistribution.push(weekEntry);
        await weeklyDistributionDoc.save();
      }

      results.push(weeklyDistributionDoc);
    }

    // Filter out any week entries with empty daily data
    const filteredResults = results.map((doc) => {
      const obj = doc.toObject();
      obj.weekDistribution = obj.weekDistribution.filter(
        (entry) => Array.isArray(entry.dailyData) && entry.dailyData.length > 0
      );
      return obj;
    });

    // Return success response with filtered results
    return res.status(201).json({
      message: "Weekly Distribution created for all creators",
      data: filteredResults,
    });
  } catch (error) {
    console.error("Error in createWeeklyDistributionForAll:", error);
    return res.status(500).json({ error: error.message });
  }
};
