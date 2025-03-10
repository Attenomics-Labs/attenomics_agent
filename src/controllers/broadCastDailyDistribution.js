// src/controllers/dailyDistributionController.js
const DailyDistribution = require("../models/DailyDistribution");
const { contracts, provider, wallet } = require("../config/web3/contractConfig");
const { ethers } = require("ethers");

/**
 * Broadcasts all pending daily distributions using either signature or direct method.
 */
exports.broadcastDistributions = async (req, res) => {
  try {
    const { method = "signature" } = req.body; // default to signature method

    // Find all daily distribution documents that have at least one pending (non-broadcasted) entry
    const dailyDistributions = await DailyDistribution.find({
      "dailyDistribution.isBroadcasted": false,
    });

    if (!dailyDistributions.length) {
      return res
        .status(200)
        .json({ message: "No pending daily distributions to process" });
    }

    let results = [];

    for (const doc of dailyDistributions) {
      const creatorName = doc.creatorName;
      console.log(`Processing daily distributions for creator: ${creatorName}`);

      // Get all non-broadcasted daily entries from the document
      const pendingEntries = doc.dailyDistribution.filter(
        (entry) => !entry.isBroadcasted
      );

      for (const entry of pendingEntries) {
        try {
          // Initialize the distributor contract using the distributor contract address stored in the document.
          const distributorContract = new ethers.Contract(
            doc.distributionContract,
            contracts.creatorTokenSupporter.abi,
            wallet
          );

          console.log(
            `Broadcasting daily distribution for day ${entry.dayStart} using ${method} method`
          );

          let tx;
          if (method === "signature") {
            console.log("Using signature method with data:", {
              encodedData: entry.encodedData,
              signedHash: entry.signedHash,
            });

            tx = await distributorContract.distributeWithData(
              entry.encodedData,
              entry.signedHash,
              { gasLimit: 500000 }
            );
            entry.distributionMethod = "signature";
          } else {
            console.log("Using direct method with data:", entry.directDistribution);

            tx = await distributorContract.distribute(
              entry.directDistribution.recipients,
              entry.directDistribution.amounts,
              entry.directDistribution.totalAmount,
              { gasLimit: 500000 }
            );
            entry.distributionMethod = "direct";
          }

          // Wait for the transaction to be mined.
          const receipt = await tx.wait();

          console.log(
            `Daily distribution successful for ${creatorName} on day ${entry.dayStart}`
          );
          console.log("Transaction Hash:", receipt.hash);

          // Mark this daily entry as broadcasted and store the transaction hash.
          entry.isBroadcasted = true;
          entry.transactionReceipt = receipt.hash;
          await doc.save();

          results.push({
            creatorName,
            dayStart: entry.dayStart,
            method,
            transactionHash: receipt.hash,
            status: "success",
          });
        } catch (error) {
          console.error(
            `Error distributing for ${creatorName} on day ${entry.dayStart}:`,
            error
          );
          results.push({
            creatorName,
            dayStart: entry.dayStart,
            method,
            error: error.message,
            status: "failed",
          });
        }
      }
    }

    return res.status(200).json({
      message: "Daily distribution broadcast process completed",
      results,
    });
  } catch (error) {
    console.error("Error in broadcastDistributions (daily):", error);
    return res.status(500).json({ error: error.message });
  }
};
