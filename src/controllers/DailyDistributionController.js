const path = require("path");
const fs = require("fs");
const { getScraper } = require("../utils/scraper.js");
const DailyDistribution = require("../models/DailyDistribution"); // Daily distribution model
const UserSupportDist = require("../models/UserSupportDist"); // Using user_support_dist model now
const Creator = require("../models/Creator");
const User = require("../models/User"); // Ensure you require the User model
const crypto = require("crypto");
const { contracts, provider, wallet } = require("../config/web3/contractConfig");
const { ethers } = require("ethers");

/**
 * Validate input for daily distribution.
 * Expects req.body.dayStart as a valid ISO date string (e.g. "2025-03-10" or "2025-03-10T00:00:00.000Z").
 * If no time is provided, we assume midnight UTC.
 * Returns an object with startDate, endDate (24-hour window) and the final dayStart string.
 */
const validateInput = (req) => {
  let { dayStart } = req.body;
  if (!dayStart) {
    throw new Error("dayStart is required");
  }
  // If dayStart does not include a "T", append default midnight time.
  if (!dayStart.includes("T")) {
    dayStart = `${dayStart}T00:00:00Z`;
  }
  const startDate = new Date(dayStart);
  if (isNaN(startDate.getTime())) {
    throw new Error("Invalid dayStart date");
  }
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);
  return { startDate, endDate, dayStart };
};

/**
 * Fetch valid creators from the database.
 */
const getValidCreators = async () => {
  const creators = await Creator.find();
  if (!creators.length) {
    throw new Error("No creators found");
  }
  return creators;
};

/**
 * Build a mapping from username to walletAddress from the Users collection.
 */
const getUserWalletMapping = async () => {
  const users = await User.find({});
  const mapping = {};
  users.forEach((user) => {
    if (user.username && user.walletAddress) {
      mapping[user.username] = user.walletAddress;
    }
  });
  return mapping;
};

/**
 * Process six-hour data from a UserSupportDist document for a given day.
 * This function looks at the "sixHours" array and collects only the records whose unixTimestamp falls within the provided window.
 *
 * @param {Array} sixHours - The array of six-hour records from the UserSupportDist document.
 * @param {Date} startDate - The start of the day.
 * @param {Date} endDate - The end of the day.
 * @param {Number} dailyDripAmount - Daily drip amount (in tokens).
 * @param {Object} userWalletMapping - Mapping from username to walletAddress.
 *
 * @returns {Object} - Returns an object containing:
 *   - distributionMap: an object mapping walletAddress to average percentage,
 *   - dailyDataList: the array of six-hour records that fall within the day,
 *   - allAttentionEntries: all records used for signature hash computation,
 *   - totalDailyAttention: total attention (sum of latestAttention),
 *   - segmentCount: number of six-hour segments found.
 */
const processSixHourData = (sixHours, startDate, endDate, dailyDripAmount, userWalletMapping) => {
  const distributionMap = {};
  const dailyDataList = [];
  const allAttentionEntries = [];
  let totalDailyAttention = 0;
  let segmentCount = 0;

  for (const record of sixHours) {
    const recordDate = new Date(record.unixTimestamp * 1000);
    if (recordDate >= startDate && recordDate < endDate) {
      dailyDataList.push(record);
      allAttentionEntries.push(record);
      totalDailyAttention += Number(record.latestAttention) || 0;
      segmentCount++;
      if (record.distribution && Array.isArray(record.distribution)) {
        for (const dist of record.distribution) {
          // Try to get a valid wallet address.
          let walletAddress = dist.walletAddress;
          // If walletAddress is not provided, attempt to look it up using the username.
          if (!walletAddress && dist.username) {
            walletAddress = userWalletMapping[dist.username];
          }
          if (!walletAddress || !ethers.isAddress(walletAddress)) {
            console.log(`Skipping entry because walletAddress is invalid: ${walletAddress}`);
            continue;
          }
          const percentValue = Number(dist.percentBasedSupp);
          if (isNaN(percentValue)) {
            console.log(`Skipping invalid percent value for wallet ${walletAddress}`);
            continue;
          }
          distributionMap[walletAddress] = (distributionMap[walletAddress] || 0) + percentValue;
        }
      }
    }
  }

  if (segmentCount > 0) {
    for (const wallet in distributionMap) {
      distributionMap[wallet] = distributionMap[wallet] / segmentCount;
    }
  }

  return { distributionMap, dailyDataList, allAttentionEntries, totalDailyAttention, segmentCount };
};

/**
 * Prepares distribution data for signature and direct methods.
 * Converts the distributionMap into recipients, amounts, and totalAmount (in wei).
 */
const prepareDistributionData = (distributionMap) => {
  const recipients = [];
  const amounts = [];
  let totalAmount = 0;

  for (const [walletAddress, percentage] of Object.entries(distributionMap)) {
    const numPercentage = Number(percentage);
    if (isNaN(numPercentage)) {
      console.log(`Skipping wallet ${walletAddress} due to invalid percentage: ${percentage}`);
      continue;
    }
    recipients.push(walletAddress);
    // Convert the percentage (as a string number) to wei. Adjust this conversion if needed.
    const amountInWei = ethers.parseEther(numPercentage.toString());
    amounts.push(amountInWei.toString());
    totalAmount += numPercentage;
  }
  const totalAmountInWei = totalAmount === 0 ? "0" : ethers.parseEther(totalAmount.toString()).toString();
  return {
    recipients,
    amounts,
    totalAmount: totalAmountInWei
  };
};

/**
 * Creates signature-based distribution data.
 */
const createSignatureData = async (distributionData) => {
  const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
    ["tuple(address[],uint256[],uint256)"],
    [[distributionData.recipients, distributionData.amounts, distributionData.totalAmount]]
  );

  const dataHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["address[]", "uint256[]", "uint256"],
      [distributionData.recipients, distributionData.amounts, distributionData.totalAmount]
    )
  );

  const signedHash = await wallet.signMessage(ethers.getBytes(dataHash));

  return { encodedData, dataHash, signedHash };
};

/**
 * Create or update the daily distribution record for a creator.
 */
const updateDailyDistribution = async (creator, dayEntry) => {
  let dailyDistributionDoc = await DailyDistribution.findOne({
    creatorName: creator.creatorName,
    dayStart: dayEntry.dayStart
  });

  if (dailyDistributionDoc) {
    console.log(
      `Daily distribution entry for ${dayEntry.dayStart} already exists for ${creator.creatorName}, skipping update.`
    );
    return null;
  }

  dailyDistributionDoc = await DailyDistribution.create({
    creatorName: creator.creatorName,
    tokenContract: creator.creatorTokenAddress,
    distributionContract: creator.distributorContractAddress,
    agentAddress: creator.agentAddress,
    scheme: creator.scheme,
    dailyDistribution: [dayEntry]
  });

  return dailyDistributionDoc;
};

/**
 * Main endpoint: Process daily distribution for all creators.
 * The time window is from dayStart (00:00:00Z) to the next day (00:00:00Z).
 */
exports.createDailyDistributionForAll = async (req, res) => {
  console.log("Received POST /daily-distribution/all with body:", req.body);
  try {
    const { startDate, endDate, dayStart } = validateInput(req);
    const creators = await getValidCreators();
    // Build a mapping from username to walletAddress from the Users collection.
    const users = await User.find({});
    const userWalletMapping = {};
    users.forEach((user) => {
      if (user.username && user.walletAddress) {
        userWalletMapping[user.username] = user.walletAddress;
      }
    });

    let results = [];

    for (let creator of creators) {
      try {
        if (!creator.distributorContractAddress) {
          console.log(`No distributor contract address found for ${creator.creatorName}, skipping...`);
          continue;
        }

        // Query from the user_support_dist collection.
        const UserSupportDistModel = require("../models/UserSupportDist");
        const userSupportDoc = await UserSupportDistModel.findOne({ creatorName: creator.creatorName });
        if (!userSupportDoc) {
          console.log(`No user support data found for ${creator.creatorName}, skipping...`);
          continue;
        }
        const sixHoursData = userSupportDoc.sixHours;
        if (!sixHoursData || !Array.isArray(sixHoursData)) {
          console.log(`No six-hour data for ${creator.creatorName}, skipping...`);
          continue;
        }

        // Initialize distributor contract.
        const distributorContract = new ethers.Contract(
          creator.distributorContractAddress,
          contracts.creatorTokenSupporter.abi,
          provider
        );
        const distributorConfig = await distributorContract.distributorConfig();
        const dailyDripAmountToDistribute = Number(ethers.formatEther(distributorConfig[0]));

        const {
          distributionMap,
          dailyDataList,
          allAttentionEntries,
          totalDailyAttention,
          segmentCount
        } = processSixHourData(sixHoursData, startDate, endDate, dailyDripAmountToDistribute, userWalletMapping);

        if (dailyDataList.length === 0) {
          console.log(`No six-hour segments for creator ${creator.creatorName} on ${dayStart}, skipping day entry.`);
          continue;
        }

        const distributionData = prepareDistributionData(distributionMap);
        const { encodedData, dataHash, signedHash } = await createSignatureData(distributionData);

        const dayEntry = {
          dayStart: dayStart, // e.g. "2025-03-10T00:00:00.000Z"
          DistributionData: distributionData,
          dataHash,
          signedHash,
          encodedData,
          directDistribution: {
            recipients: distributionData.recipients,
            amounts: distributionData.amounts,
            totalAmount: distributionData.totalAmount,
          },
          dailyData: dailyDataList,
          totalDailyAttention,
          segmentCount,
          isBroadcasted: false,
          transactionReceipt: "",
          distributionMethod: null,
        };

        const dailyDistributionDoc = await updateDailyDistribution(creator, dayEntry);
        if (dailyDistributionDoc) {
          results.push(dailyDistributionDoc);
        }
      } catch (error) {
        console.error(`Error processing creator ${creator.creatorName}:`, error);
        continue;
      }
    }

    const filteredResults = results.map((doc) => {
      const obj = doc.toObject();
      obj.dailyDistribution = obj.dailyDistribution.filter(
        (entry) => Array.isArray(entry.dailyData) && entry.dailyData.length > 0
      );
      return obj;
    });

    return res.status(201).json({
      message: "Daily Distribution created for all creators",
      data: filteredResults,
    });
  } catch (error) {
    console.error("Error in createDailyDistributionForAll:", error);
    return res.status(500).json({ error: error.message });
  }
};
