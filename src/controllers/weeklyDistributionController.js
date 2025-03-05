/**
 * Weekly Distribution Controller
 * This controller handles the creation and management of weekly token distributions for creators.
 * It processes attention data and calculates token distributions based on creator performance.
 */

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
 * Validates the input parameters for weekly distribution
 * @param {Object} req - Request object containing weekStart
 * @returns {Object} - Object containing startDate and endDate if valid
 * @throws {Error} - If weekStart is missing or invalid
 */
const validateInput = (req) => {
  const { weekStart } = req.body;
  if (!weekStart) {
    throw new Error("weekStart is required");
  }

  const startDate = new Date(weekStart + 'T00:00:00.000Z');
  if (isNaN(startDate.getTime())) {
    throw new Error("Invalid weekStart date");
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);

  return { startDate, endDate };
};

/**
 * Fetches and validates creator data from the database
 * @returns {Array} - Array of valid creators
 * @throws {Error} - If no creators found
 */
const getValidCreators = async () => {
  const creators = await Creator.find();
  if (!creators.length) {
    throw new Error("No creators found");
  }
  return creators;
};

/**
 * Processes daily attention data for a creator within the specified week
 * @param {Object} days - Days data from attention document
 * @param {Date} startDate - Start date of the week
 * @param {Date} endDate - End date of the week
 * @param {Number} dailyDripAmount - Daily drip amount to distribute
 * @returns {Object} - Processed daily data and distribution map
 */
const processDailyData = (days, startDate, endDate, dailyDripAmount) => {
  const distributionMap = {};
  const dailyDataList = [];
  const allAttentionEntries = [];

  // Convert Map to array of entries if it's a Map
  const daysEntries = days instanceof Map ? Array.from(days.entries()) : Object.entries(days);
  
  // Iterate over each day's attention data within the week
  for (const [dayKey, dayData] of daysEntries) {
    // Skip MongoDB internal properties
    if (dayKey.startsWith('$')) continue;
    
    // Parse the date string properly
    const dayDate = new Date(dayKey);
    
    if (dayDate >= startDate && dayDate < endDate) {
      console.log("Processing day:", dayKey);
      
      // Store daily data for the week
      dailyDataList.push({
        day: dayKey,
        latestAttention: dayData.latestAttention,
        unixTimestamp: dayData.unixTimestamp,
        reqHash: dayData.reqHash,
        resHash: dayData.resHash,
        distribution: dayData.distribution || []
      });

      // Collect data for hash computation
      allAttentionEntries.push({ day: dayKey, data: dayData });

      // Process distribution if it exists
      if (dayData.distribution && Array.isArray(dayData.distribution)) {
        for (const dist of dayData.distribution) {
          const dailyAmount = dailyDripAmount * (dist.percentage / 100);
          distributionMap[dist.walletAddress] = (distributionMap[dist.walletAddress] || 0) + dailyAmount;
          
          console.log(`Daily amount calculation for ${dist.walletAddress}:`, {
            percentage: dist.percentage,
            dailyDripAmount,
            dailyAmount,
            currentTotal: distributionMap[dist.walletAddress],
            day: dayKey
          });
        }
      } else {
        console.log(`No distribution data found for day ${dayKey}`);
      }
    }
  }

  return { distributionMap, dailyDataList, allAttentionEntries };
};

/**
 * Prepares distribution data for both signature and direct methods
 * @param {Object} distributionMap - Map of wallet addresses to amounts
 * @returns {Object} - Prepared distribution data
 */
const prepareDistributionData = (distributionMap) => {
  const recipients = [];
  const amounts = [];
  let totalAmount = 0;

  for (const [walletAddress, amount] of Object.entries(distributionMap)) {
    recipients.push(walletAddress);
    const amountInWei = ethers.parseEther(amount.toString());
    amounts.push(amountInWei.toString());
    totalAmount += amount;
  }

  const totalAmountInWei = ethers.parseEther(totalAmount.toString());

  return {
    recipients,
    amounts,
    totalAmount: totalAmountInWei.toString()
  };
};

/**
 * Creates signature-based distribution data
 * @param {Object} distributionData - Distribution data
 * @returns {Object} - Encoded data, hash, and signature
 */
const createSignatureData = async (distributionData) => {
  const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
    ['tuple(address[],uint256[],uint256)'],
    [[distributionData.recipients, distributionData.amounts, distributionData.totalAmount]]
  );

  const dataHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['address[]', 'uint256[]', 'uint256'],
      [distributionData.recipients, distributionData.amounts, distributionData.totalAmount]
    )
  );

  const signedHash = await wallet.signMessage(ethers.getBytes(dataHash));

  return { encodedData, dataHash, signedHash };
};

/**
 * Creates or updates weekly distribution record
 * @param {Object} creator - Creator data
 * @param {Object} weekEntry - Week entry data
 * @returns {Object} - Updated weekly distribution document
 */
const updateWeeklyDistribution = async (creator, weekEntry) => {
  let weeklyDistributionDoc = await WeeklyDistribution.findOne({
    creatorName: creator.creatorName,
  });

  const existingWeekEntry = weeklyDistributionDoc?.weekDistribution?.find(
    entry => entry.weekStart === weekEntry.weekStart
  );

  if (existingWeekEntry) {
    console.log(`Week entry for ${weekEntry.weekStart} already exists for ${creator.creatorName}, skipping...`);
    return null;
  }

  if (!weeklyDistributionDoc) {
    weeklyDistributionDoc = await WeeklyDistribution.create({
      creatorName: creator.creatorName,
      tokenContract: creator.creatorTokenAddress,
      distributionContract: creator.distributorContractAddress,
      agentAddress: creator.agentAddress,
      scheme: creator.scheme,
      weekDistribution: [weekEntry],
    });
  } else {
    weeklyDistributionDoc.weekDistribution.push(weekEntry);
    await weeklyDistributionDoc.save();
  }

  return weeklyDistributionDoc;
};

/**
 * Main endpoint: Process weekly distribution for all creators
 * @param {Object} req - Request object containing weekStart
 * @param {Object} res - Response object
 */
exports.createWeeklyDistributionForAll = async (req, res) => {
  console.log("Received POST /weekly-distribution/all with body:", req.body);
  try {
    // Validate input and get date range
    const { startDate, endDate } = validateInput(req);

    // Get valid creators
    const creators = await getValidCreators();
    let results = [];

    // Process each creator's data
    for (let creator of creators) {
      try {
        // Skip if creator doesn't have a valid distributor contract address
        if (!creator.distributorContractAddress) {
          console.log(`No distributor contract address found for ${creator.creatorName}, skipping...`);
          continue;
        }

        // Get creator's attention data
        const attentionDoc = await Attention.findOne({ creatorName: creator.creatorName });
        if (!attentionDoc) {
          console.log(`No attention data found for ${creator.creatorName}, skipping...`);
          continue;
        }

        // Initialize distributor contract
        const distributorContract = new ethers.Contract(
          creator.distributorContractAddress,
          contracts.creatorTokenSupporter.abi,
          provider
        );

        // Get distributor configuration
        const distributorConfig = await distributorContract.distributorConfig();
        const dailyDripAmountToDistribute = Number(ethers.formatEther(distributorConfig[0]));

        // Process attention data
        const attentionData = attentionDoc.toObject();
        const days = attentionData.days;
        if (!days || typeof days !== 'object') {
          console.log("No days data found or invalid format");
          continue;
        }

        // Process daily data with correct parameters
        const { distributionMap, dailyDataList, allAttentionEntries } = processDailyData(
          days,
          startDate,
          endDate,
          dailyDripAmountToDistribute
        );

        if (dailyDataList.length === 0) {
          console.log(`No daily data for creator ${creator.creatorName} in week starting ${req.body.weekStart}, skipping...`);
          continue;
        }

        // Prepare distribution data
        const distributionData = prepareDistributionData(distributionMap);

        // Create signature data
        const { encodedData, dataHash, signedHash } = await createSignatureData(distributionData);

        // Create week entry
        const weekEntry = {
          weekStart: req.body.weekStart,
          DistributionData: distributionData,
          dataHash,
          signedHash,
          encodedData,
          directDistribution: {
            recipients: distributionData.recipients,
            amounts: distributionData.amounts,
            totalAmount: distributionData.totalAmount
          },
          dailyData: dailyDataList,
          isBroadcasted: false,
          transactionReceipt: "",
          distributionMethod: null
        };

        // Update weekly distribution
        const weeklyDistributionDoc = await updateWeeklyDistribution(creator, weekEntry);
        if (weeklyDistributionDoc) {
          results.push(weeklyDistributionDoc);
        }
      } catch (error) {
        console.error(`Error processing creator ${creator.creatorName}:`, error);
        continue;
      }
    }

    // Filter results
    const filteredResults = results.map((doc) => {
      const obj = doc.toObject();
      obj.weekDistribution = obj.weekDistribution.filter(
        (entry) => Array.isArray(entry.dailyData) && entry.dailyData.length > 0
      );
      return obj;
    });

    return res.status(201).json({
      message: "Weekly Distribution created for all creators",
      data: filteredResults,
    });
  } catch (error) {
    console.error("Error in createWeeklyDistributionForAll:", error);
    return res.status(500).json({ error: error.message });
  }
};