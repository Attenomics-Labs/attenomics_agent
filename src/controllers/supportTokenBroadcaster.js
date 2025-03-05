// Now in this file u have to check all the weekly distribution documents and check if the is Broadcasted or not if its not then u have to broadcast it to the contract
// and if its already broadcasted then u have to skip it
// u have to use the contract to broadcast the token
// u have to use the wallet to sign the transaction
// u have to use the provider to get the transaction hash
// u have to use the contract to get the transaction hash
// u have to use the contract to get the transaction hash

const WeeklyDistribution = require("../models/WeeklyDistribution");
const { contracts, provider, wallet } = require("../config/web3/contractConfig");
const { ethers } = require("ethers");

/**
 * Broadcasts all pending weekly distributions to their respective contracts
 * This function:
 * 1. Finds all weekly distributions that haven't been broadcasted yet
 * 2. For each distribution:
 *    - Gets the creator's distributor contract
 *    - Broadcasts the distribution using the encoded data and signature
 *    - Updates the isBroadcasted flag in the database
 */
exports.broadcastPendingDistributions = async (req, res) => {
  try {
    // Find all weekly distributions that haven't been broadcasted yet
    const weeklyDistributions = await WeeklyDistribution.find({
      'weekDistribution.isBroadcasted': false
    });

    if (!weeklyDistributions.length) {
      return res.status(200).json({ message: "No pending distributions to broadcast" });
    }

    let results = [];

    // Process each weekly distribution document
    for (const doc of weeklyDistributions) {
      const creatorName = doc.creatorName;
      console.log(`Processing distributions for creator: ${creatorName}`);

      // Get all non-broadcasted week entries
      const pendingEntries = doc.weekDistribution.filter(entry => !entry.isBroadcasted);

      for (const entry of pendingEntries) {
        try {
          // Initialize the distributor contract for this creator
          const distributorContract = new ethers.Contract(
            doc.distributionContract,
            contracts.creatorTokenSupporter.abi,
            wallet // Using wallet instead of provider to sign transactions
          );

          console.log(`Broadcasting distribution for week starting ${entry.weekStart}`);
          console.log('Distribution Data:', entry.DistributionData);
          console.log('Encoded Data:', entry.encodedData);
          console.log('Signature:', entry.signedHash);

          // Check contract state before broadcasting
          try {
            
            const distributorConfig = await distributorContract.distributorConfig();
            console.log('Distributor config:', {
              dailyDripAmount: ethers.formatEther(distributorConfig[0]),
              dripInterval: distributorConfig[1].toString(),
              totalDays: distributorConfig[2].toString()
            });

            // Check if we have enough balance
            const tokenContract = new ethers.Contract(
              doc.tokenContract,
              contracts.creatorToken.abi,
              provider
            );
            const balance = await tokenContract.balanceOf(doc.distributionContract);
            console.log('Contract token balance:', ethers.formatEther(balance));
          } catch (stateError) {
            console.error('Error checking contract state:', stateError);
          }

          // Try to estimate gas first
          try {
            const gasEstimate = await distributorContract.distributeWithData.estimateGas(
              entry.encodedData,
              entry.signedHash
            );
            console.log('Estimated gas:', gasEstimate.toString());
          } catch (gasError) {
            console.error('Gas estimation failed:', gasError);
            throw gasError;
          }

          // Broadcast the distribution with explicit gas limit
          const tx = await distributorContract.distributeWithData(
            entry.encodedData,
            entry.signedHash,
            { gasLimit: 500000 } // Set explicit gas limit
          );

          // Wait for transaction to be mined
          const receipt = await tx.wait();
          
          console.log(`Distribution broadcasted successfully for week ${entry.weekStart}`);
          console.log('Transaction Hash:', receipt.hash);

          // Update the isBroadcasted flag and store transaction receipt
          entry.isBroadcasted = true;
          entry.transactionReceipt = receipt.hash;
          await doc.save();

          results.push({
            creatorName,
            weekStart: entry.weekStart,
            transactionHash: receipt.hash,
            status: 'success'
          });

        } catch (error) {
          console.error(`Error broadcasting distribution for ${creatorName} week ${entry.weekStart}:`, error);
          console.error('Error details:', {
            code: error.code,
            reason: error.reason,
            data: error.data,
            transaction: error.transaction
          });
          results.push({
            creatorName,
            weekStart: entry.weekStart,
            error: error.message,
            errorDetails: {
              code: error.code,
              reason: error.reason,
              data: error.data
            },
            status: 'failed'
          });
        }
      }
    }

    return res.status(200).json({
      message: "Broadcast process completed",
      results
    });

  } catch (error) {
    console.error("Error in broadcastPendingDistributions:", error);
    return res.status(500).json({ error: error.message });
  }
};

