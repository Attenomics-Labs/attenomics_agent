const DirectDistribution = require('../models/DirectDistribution');
const { contracts, provider, wallet } = require('../config/web3/contractConfig');
const { ethers } = require('ethers');

/**
 * Creates a new direct distribution entry
 */
exports.createDirectDistribution = async (req, res) => {
  try {
    const { creatorName, tokenContract, distributionContract, recipients, amounts, totalAmount } = req.body;

    // Validate input
    if (!creatorName || !tokenContract || !distributionContract || !recipients || !amounts || !totalAmount) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create new distribution entry
    const distribution = await DirectDistribution.create({
      creatorName,
      tokenContract,
      distributionContract,
      recipients,
      amounts,
      totalAmount
    });

    return res.status(201).json({
      message: "Direct distribution entry created",
      data: distribution
    });

  } catch (error) {
    console.error("Error in createDirectDistribution:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Distributes tokens using the direct distribute function
 */
exports.distributeViaAgent = async (req, res) => {
  try {
    // Find all pending distributions
    const pendingDistributions = await DirectDistribution.find({
      isDistributed: false
    });

    if (!pendingDistributions.length) {
      return res.status(200).json({ message: "No pending distributions to process" });
    }

    let results = [];

    for (const distribution of pendingDistributions) {
      try {
        // Initialize the distributor contract
        const distributorContract = new ethers.Contract(
          distribution.distributionContract,
          contracts.creatorTokenSupporter.abi,
          wallet
        );

        console.log(`Processing distribution for creator: ${distribution.creatorName}`);
        console.log('Distribution Data:', {
          recipients: distribution.recipients,
          amounts: distribution.amounts,
          totalAmount: distribution.totalAmount
        });

        // Call the distribute function
        const tx = await distributorContract.distribute(
          distribution.recipients,
          distribution.amounts,
          distribution.totalAmount,
          { gasLimit: 500000 }
        );

        // Wait for transaction to be mined
        const receipt = await tx.wait();
        
        console.log(`Distribution successful for ${distribution.creatorName}`);
        console.log('Transaction Hash:', receipt.hash);

        // Update distribution status
        distribution.isDistributed = true;
        distribution.transactionHash = receipt.hash;
        await distribution.save();

        results.push({
          creatorName: distribution.creatorName,
          transactionHash: receipt.hash,
          status: 'success'
        });

      } catch (error) {
        console.error(`Error distributing for ${distribution.creatorName}:`, error);
        results.push({
          creatorName: distribution.creatorName,
          error: error.message,
          status: 'failed'
        });
      }
    }

    return res.status(200).json({
      message: "Distribution process completed",
      results
    });

  } catch (error) {
    console.error("Error in distributeViaAgent:", error);
    return res.status(500).json({ error: error.message });
  }
}; 