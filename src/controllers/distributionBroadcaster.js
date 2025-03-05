const WeeklyDistribution = require('../models/WeeklyDistribution');
const { contracts, provider, wallet } = require('../config/web3/contractConfig');
const { ethers } = require('ethers');

/**
 * Broadcasts all pending distributions using either signature or direct method
 */
exports.broadcastDistributions = async (req, res) => {
  try {
    const { method = 'signature' } = req.body; // Default to signature method

    // Find all pending distributions
    const weeklyDistributions = await WeeklyDistribution.find({
      'weekDistribution.isBroadcasted': false
    });

    if (!weeklyDistributions.length) {
      return res.status(200).json({ message: "No pending distributions to process" });
    }

    let results = [];

    for (const doc of weeklyDistributions) {
      const creatorName = doc.creatorName;
      console.log(`Processing distributions for creator: ${creatorName}`);

      // Get all non-broadcasted week entries
      const pendingEntries = doc.weekDistribution.filter(entry => !entry.isBroadcasted);

      for (const entry of pendingEntries) {
        try {
          // Initialize the distributor contract
          const distributorContract = new ethers.Contract(
            doc.distributionContract,
            contracts.creatorTokenSupporter.abi,
            wallet
          );

          console.log(`Broadcasting distribution for week starting ${entry.weekStart} using ${method} method`);

          let tx;
          if (method === 'signature') {
            // Use signature-based method
            console.log('Using signature method with data:', {
              encodedData: entry.encodedData,
              signedHash: entry.signedHash
            });

            tx = await distributorContract.distributeWithData(
              entry.encodedData,
              entry.signedHash,
              { gasLimit: 500000 }
            );
            entry.distributionMethod = 'signature';
          } else {
            // Use direct array method
            console.log('Using direct method with data:', entry.directDistribution);

            tx = await distributorContract.distribute(
              entry.directDistribution.recipients,
              entry.directDistribution.amounts,
              entry.directDistribution.totalAmount,
              { gasLimit: 500000 }
            );
            entry.distributionMethod = 'direct';
          }

          // Wait for transaction to be mined
          const receipt = await tx.wait();
          
          console.log(`Distribution successful for ${creatorName} week ${entry.weekStart}`);
          console.log('Transaction Hash:', receipt.hash);

          // Update distribution status
          entry.isBroadcasted = true;
          entry.transactionReceipt = receipt.hash;
          await doc.save();

          results.push({
            creatorName,
            weekStart: entry.weekStart,
            method,
            transactionHash: receipt.hash,
            status: 'success'
          });

        } catch (error) {
          console.error(`Error distributing for ${creatorName} week ${entry.weekStart}:`, error);
          results.push({
            creatorName,
            weekStart: entry.weekStart,
            method,
            error: error.message,
            status: 'failed'
          });
        }
      }
    }

    return res.status(200).json({
      message: "Distribution process completed",
      results
    });

  } catch (error) {
    console.error("Error in broadcastDistributions:", error);
    return res.status(500).json({ error: error.message });
  }
}; 