# Weekly Distribution System Documentation

This document explains the weekly distribution system for creator tokens based on attention metrics.

## Overview

The weekly distribution system processes attention data for creators and distributes tokens based on their performance metrics. It supports two distribution methods:

1. **Signature-based Distribution**: Uses encoded data and signatures for secure distribution
2. **Direct Array Distribution**: Uses direct arrays of recipients and amounts for simpler distribution

## System Architecture

### Data Model

```javascript
{
  creatorName: String,
  tokenContract: String,
  distributionContract: String,
  agentAddress: String,
  scheme: String,
  weekDistribution: [{
    weekStart: String,
    // Signature-based distribution data
    DistributionData: {
      recipients: [String],
      amounts: [String],
      totalAmount: String
    },
    dataHash: String,
    signedHash: String,
    encodedData: String,
    // Direct array-based distribution data
    directDistribution: {
      recipients: [String],
      amounts: [String],
      totalAmount: String
    },
    dailyData: [{
      day: String,
      latestAttention: Number,
      unixTimestamp: Number,
      reqHash: String,
      resHash: String,
      distribution: [{
        walletAddress: String,
        percentage: Number
      }]
    }],
    isBroadcasted: Boolean,
    transactionReceipt: String,
    distributionMethod: String // 'signature' or 'direct'
  }]
}
```

## API Endpoints

### 1. Create Weekly Distribution
```http
POST /api/weekly-distribution/all
Content-Type: application/json

{
  "weekStart": "2025-02-17"
}
```

This endpoint:
1. Validates the week start date
2. Fetches all creators and their attention data
3. Processes daily attention entries within the specified week
4. Calculates token distributions based on attention metrics
5. Creates or updates weekly distribution records

### 2. Broadcast Distributions
```http
POST /api/weekly-distribution/broadcast
Content-Type: application/json

{
  "method": "direct" // or "signature"
}
```

This endpoint broadcasts pending distributions using either the signature or direct method.

## Distribution Algorithm

### 1. Data Collection Process
1. Fetches attention data for each creator
2. Filters data for the specified week
3. Processes daily attention metrics
4. Calculates token distributions

### 2. Amount Calculation
```javascript
// For each day in the week
for (const dayData of dailyData) {
  // For each recipient in the day's distribution
  for (const dist of dayData.distribution) {
    // Calculate daily amount based on percentage and daily drip amount
    const dailyAmount = dailyDripAmountToDistribute * (dist.percentage / 100);
    // Aggregate amounts for each wallet address
    distributionMap[dist.walletAddress] += dailyAmount;
  }
}
```

### 3. Distribution Methods

#### Signature-based Method
1. Encodes distribution data into a specific format
2. Computes keccak256 hash of the data
3. Signs the hash with the agent's wallet
4. Uses `distributeWithData` contract function with encoded data and signature

#### Direct Array Method
1. Uses raw arrays of recipients and amounts
2. Calls `distribute` contract function directly with arrays
3. No encoding or signature required

## Contract Functions

### Signature-based Distribution
```solidity
function distributeWithData(
    bytes calldata encodedData,
    bytes calldata signature
) external onlyAiAgent
```

### Direct Array Distribution
```solidity
function distribute(
    address[] calldata recipients,
    uint256[] calldata amounts,
    uint256 totalAmount
) external onlyAiAgent
```

## Usage Examples

### 1. Create Weekly Distribution
```bash
curl -X POST http://localhost:3000/api/weekly-distribution/all \
  -H "Content-Type: application/json" \
  -d '{"weekStart": "2025-02-17"}'
```

### 2. Broadcast Using Direct Method
```bash
curl -X POST http://localhost:3000/api/weekly-distribution/broadcast \
  -H "Content-Type: application/json" \
  -d '{"method": "direct"}'
```

### 3. Broadcast Using Signature Method
```bash
curl -X POST http://localhost:3000/api/weekly-distribution/broadcast \
  -H "Content-Type: application/json" \
  -d '{"method": "signature"}'
```

## Error Handling

The system includes comprehensive error handling for:
- Invalid input parameters
- Missing or invalid data
- Contract interaction failures
- Transaction failures

## Security Considerations

1. Only the AI agent can execute distributions
2. Signature verification for signature-based method
3. Input validation for all parameters
4. Transaction receipt tracking
5. Distribution status tracking

## Best Practices

1. Always verify transaction receipts after broadcasting
2. Monitor gas limits for large distributions
3. Keep track of distribution status in the database
4. Handle failed transactions appropriately
5. Maintain proper error logging

## Dependencies

- ethers.js for blockchain interaction
- mongoose for database operations
- express for API endpoints
- web3 configuration for contract interaction