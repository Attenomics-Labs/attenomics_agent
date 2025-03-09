# Working Guide: System Call Trace and Process Flow

This document provides a detailed trace of how various system components interact in the Creator Token Distribution System, with a focus on the call sequence for major operations.

## Table of Contents

1. [System Initialization](#system-initialization)
2. [Attention Data Collection](#attention-data-collection)
3. [Weekly Distribution Process](#weekly-distribution-process)
4. [Token Distribution to Blockchain](#token-distribution-to-blockchain)
5. [User Support Calculation](#user-support-calculation)
6. [Creator API Operations](#creator-api-operations)
7. [NFT Management](#nft-management)

# Working Guide: System Call Trace and Process Flow

This document provides a detailed trace of how various system components interact in the Creator Token Distribution System, with a focus on the call sequence for major operations.

## System Initialization

When the system starts, the following sequence occurs:

```
server.js
  ├── require('dotenv').config() // Load environment variables from .env file
  │    └── Process environment variables are populated with values from .env
  │
  ├── express() // Initialize Express application
  │    └── Create a new Express application instance
  │
  ├── connectDB() // From src/config/db.js
  │    ├── Log connection attempt with CONNECTION_URI from environment
  │    ├── mongoose.connect(process.env.CONNECTION_URI, {
  │    │    serverSelectionTimeoutMS: 5000, // 5 seconds timeout
  │    │ })
  │    ├── On success: Log "MongoDB connected..."
  │    └── On error: Log error details and exit process
  │
  ├── app.use(express.json()) // Setup middleware for JSON parsing
  │    └── Configure Express to parse JSON request bodies
  │
  ├── Mount routes - Each connects URLs to controller functions
  │    ├── app.use('/api/items', itemsRoute)
  │    │    └── Basic CRUD operations for items
  │    │
  │    ├── app.use('/creator', creatorTokenRoute)
  │    │    └── Creator token management endpoints
  │    │         ├── GET /creator/get-creator-data/ - Get creator info
  │    │         ├── POST /creator/post-creator-token/ - Create creator
  │    │         └── GET /creator/creator-names/ - List all creators
  │    │
  │    ├── app.use('/scraper', scraperRoute)
  │    │    └── Twitter data scraping endpoints
  │    │         ├── POST /scraper/tweets - Get tweets for a user
  │    │         └── POST /scraper/latest-tweet - Get latest tweet
  │    │
  │    ├── app.use('/attention', attentionRoute)
  │    │    └── Attention data endpoints
  │    │         └── GET /attention/get-fraud-proof/ - Get attention data
  │    │
  │    ├── app.use('/user', userRoute)
  │    │    └── User management endpoints
  │    │         └── GET /user/get-user-following-creators/ - Get creators followed
  │    │
  │    ├── app.use('/nft', nftRoute)
  │    │    └── NFT management endpoints
  │    │         ├── POST /nft/ - Create NFT
  │    │         ├── GET /nft/ - Get all NFTs
  │    │         └── GET /nft/:id - Get NFT by ID
  │    │
  │    └── app.use('/weekly-distribution', weeklyDistributionRoute)
  │         └── Distribution management endpoints
  │              ├── POST /weekly-distribution/all - Create distributions
  │              └── POST /weekly-distribution/broadcast - Send to blockchain
  │
  ├── app.use(errorHandler) // Global error handling middleware
  │    └── Catches all errors and formats standardized responses
  │
  └── app.listen(PORT) // Start server on specified port
       ├── Use PORT from environment variables or default to 3000
       └── Log "Server running on port ${PORT}" on success
```

### Configuration Loading

The system configuration is loaded early in the initialization process:

1. **Environment Variables**: Loaded from `.env` file using `dotenv`
   ```
   // Sample .env file structure
   PORT=3000
   CONNECTION_URI=mongodb://localhost:

## Attention Data Collection

The hourly attention data collection process is a critical automated task that gathers social media data and processes it using LLMs to determine attention metrics. This process runs automatically via a cron job and is the foundation for all token distribution calculations.

### Detailed Call Trace

```
cronController.js: runHourlyCron()
  ├── fetchCreators() // Get list of creators from database
  │    ├── db.collection("creators").findOne({})
  │    └── Return creators array or empty array if error
  │
  ├── Initialize allCreatorTweetsAndReplies as empty array
  ├── Get current Unix timestamp for data tagging
  │
  ├── For each creator:
  │    ├── getTweetsAndReplies(res, creator, 10) // From tweetController.js
  │    │    ├── getScraper() // Initialize Twitter scraper
  │    │    │    ├── new Scraper()
  │    │    │    ├── Check if already logged in: scraper.isLoggedIn()
  │    │    │    ├── If not logged in: 
  │    │    │    │    └── Login with credentials: scraper.login(
  │    │    │    │         process.env.TWITTER_USERNAME,
  │    │    │    │         process.env.TWITTER_PASSWORD,
  │    │    │    │         process.env.TWITTER_EMAIL,
  │    │    │    │         // API keys also provided
  │    │    │    │       )
  │    │    │    └── Return authenticated scraper
  │    │    │
  │    │    ├── Fetch tweets and replies: 
  │    │    │    └── scraper.getTweetsAndReplies(user, maxTweets)
  │    │    │         // This is an async generator that yields tweets
  │    │    │
  │    │    ├── Calculate one hour ago timestamp
  │    │    ├── Filter tweets by timestamp (last hour only)
  │    │    ├── Split tweets into:
  │    │    │    ├── creatorTweetsAndReplies (tweets by the creator)
  │    │    │    └── userReplies (replies to the creator from others)
  │    │    └── Return { creatorTweetsAndReplies, userReplies }
  │    │
  │    ├── Analyze user support with LLM:
  │    │    └── getLLMResponse(getEvalUserSupportPrompt(userReplies)) // From llmController.js
  │    │         ├── Construct prompt for LLM with user replies
  │    │         └── Send request to LLM API:
  │    │              └── axios.request({
  │    │                   method: 'post',
  │    │                   url: process.env.LLM_URI,
  │    │                   headers: { 
  │    │                     'Authorization': process.env.LLM_AUTH_TOKEN,
  │    │                     'Content-Type': 'application/json'
  │    │                   },
  │    │                   data: { model: process.env.LLM_MODEL, messages: [...] }
  │    │                 })
  │    │
  │    ├── Store user support data:
  │    │    └── updateUserPercentSupp(creator, userSuppDist, unixTimestamp, requestHash, responseHash)
  │    │         ├── Get collection: db.collection('user_percent_supp')
  │    │         ├── Fetch registered users
  │    │         ├── Create set of registered usernames for fast lookup
  │    │         ├── For each entry in userSuppDist:
  │    │         │    ├── Skip if user not registered
  │    │         │    └── Update database:
  │    │         │         └── collection.updateOne(
  │    │         │              {
  │    │         │                username: username,
  │    │         │                "hourly.timestamp": unixTimestamp
  │    │         │              },
  │    │         │              {
  │    │         │                $push: {
  │    │         │                  'hourly.$.distribution': {
  │    │         │                    "creatorName": creator,
  │    │         │                    "percentage": percentBasedSupp,
  │    │         │                    "reqHash": requestHash,
  │    │         │                    "resHash": responseHash
  │    │         │                  }
  │    │         │                }
  │    │         │              },
  │    │         │              { upsert: true }
  │    │         │            )
  │    │         └── Handle errors
  │    │
  │    └── Add creator tweets to allCreatorTweetsAndReplies for overall analysis
  │
  ├── Analyze all creators' attention metrics with LLM:
  │    └── getLLMResponse(getEvalAttentionPrompt(allCreatorTweetsAndReplies))
  │         ├── Construct prompt analyzing relative attention across creators
  │         └── Send to LLM API as above
  │
  ├── Store attention metrics in database:
  │    └── updateAttentionRecords(creatorsAttentionDist, unixTimestamp, requestHash, responseHash)
  │         ├── Get collection: db.collection('attention_records')
  │         ├── For each creator entry:
  │         │    └── collection.updateOne(
  │         │         { creatorName: username },
  │         │         { 
  │         │           $push: { 
  │         │             hourly: { 
  │         │               unixTimestamp: unixTimestamp, 
  │         │               latestAttention: attention, 
  │         │               reqHash: requestHash, 
  │         │               resHash: responseHash
  │         │             } 
  │         │           } 
  │         │         },
  │         │         { upsert: true }
  │         │       )
  │         └── Log update confirmation
  │
  ├── Store creator-to-creator distribution data (for analytics):
  │    └── updateCreatorToCreatorDist(creatorsAttentionDist, unixTimestamp)
  │         ├── Get collection: db.collection('hourly_creator_to_creator_attention_records')
  │         └── collection.insertOne({
  │              "unixTimestamp": unixTimestamp,
  │              "distribution": creatorsAttentionDist
  │            })
  │
  └── Return response with handleResponse(res, creatorsAttentionDist, "Cron Job Ran")
```

### LLM Prompting and Analysis

The system uses two types of LLM analysis:

1. **User Support Analysis**:
   - Input: Replies to a creator's tweets
   - Output: JSON with users and their support percentages
   - Example output:
     ```json
     [
       {"username": "user1", "percentBasedSupp": 45.2},
       {"username": "user2", "percentBasedSupp": 32.1}
     ]
     ```

2. **Creator Attention Analysis**:
   - Input: All creators' tweets and replies
   - Output: JSON with relative attention scores
   - Example output:
     ```json
     [
       {"username": "creator1", "attention": 78.5},
       {"username": "creator2", "attention": 65.3}
     ]
     ```

### Data Storage Pattern

Each hour's data is stored with:
- Timestamp (Unix format)
- Request hash (for verification)
- Response hash (for verification)
- Calculated metrics

This creates an auditable trail of how attention was calculated, allowing for:
- Verification of LLM responses
- Historical analysis
- Fraud prevention
- Transparency in token distribution

## Weekly Distribution Process

The weekly distribution calculation process is one of the most critical parts of the system. This process takes the accumulated attention data and converts it into token distribution amounts.

### Detailed Process Flow

```
weeklyDistributionController.js: createWeeklyDistributionForAll()
  ├── validateInput() // Validate request data
  │    ├── Extract weekStart from request body
  │    ├── Create JavaScript Date objects for start and end of week
  │    └── Return { startDate, endDate } or throw Error if invalid
  │
  ├── getValidCreators() // Fetch all valid creators from database
  │    ├── Creator.find() // Get all creators
  │    └── Validate creator count > 0
  │
  ├── For each creator:
  │    ├── Skip if creator doesn't have a distributorContractAddress
  │    │
  │    ├── Fetch creator's attention data
  │    │    └── Attention.findOne({ creatorName: creator.creatorName })
  │    │         ├── Get creator's hourly attention scores
  │    │         └── Get associated distribution percentages
  │    │
  │    ├── Initialize distributor contract
  │    │    └── new ethers.Contract(
  │    │         creator.distributorContractAddress, 
  │    │         contracts.creatorTokenSupporter.abi,
  │    │         provider
  │    │       )
  │    │
  │    ├── Get distributor configuration from blockchain
  │    │    └── distributorContract.distributorConfig()
  │    │         ├── Fetch dailyDripAmount (tokens distributed per day)
  │    │         ├── Fetch dripInterval (time between distributions)
  │    │         └── Fetch totalDays (distribution duration)
  │    │
  │    ├── Process daily attention data
  │    │    └── processDailyData(days, startDate, endDate, dailyDripAmountToDistribute)
  │    │         ├── Initialize distributionMap (wallet -> amount)
  │    │         ├── Initialize dailyDataList (for record keeping)
  │    │         ├── For each day in the week:
  │    │         │    ├── Parse date and check if in target week
  │    │         │    ├── Store daily data for record
  │    │         │    └── If day has distribution data:
  │    │         │         └── For each recipient:
  │    │         │              ├── Calculate daily amount: 
  │    │         │              │    dailyDripAmount * (percentage / 100)
  │    │         │              └── Add to recipient's running total
  │    │         └── Return { distributionMap, dailyDataList, allAttentionEntries }
  │    │
  │    ├── Skip if no daily data found for this week
  │    │
  │    ├── Prepare distribution data
  │    │    └── prepareDistributionData(distributionMap)
  │    │         ├── Convert wallet/amount map to recipients and amounts arrays
  │    │         ├── Convert amounts to wei (blockchain format)
  │    │         └── Return { recipients, amounts, totalAmount }
  │    │
  │    ├── Create signature data (for gas-efficient distribution)
  │    │    └── createSignatureData(distributionData)
  │    │         ├── Encode data for blockchain:
  │    │         │    ethers.AbiCoder.defaultAbiCoder().encode(...)
  │    │         │    
  │    │         ├── Create hash of the distribution data:
  │    │         │    ethers.keccak256(
  │    │         │      ethers.AbiCoder.defaultAbiCoder().encode(
  │    │         │        ['address[]', 'uint256[]', 'uint256'],
  │    │         │        [recipients, amounts, totalAmount]
  │    │         │      )
  │    │         │    )
  │    │         │
  │    │         ├── Sign the hash with admin wallet:
  │    │         │    wallet.signMessage(ethers.getBytes(dataHash))
  │    │         │
  │    │         └── Return { encodedData, dataHash, signedHash }
  │    │
  │    ├── Create week entry with all distribution data
  │    │    ├── Include both signature-based and direct distribution data
  │    │    ├── Include all daily data for transparency
  │    │    └── Set isBroadcasted = false (pending blockchain execution)
  │    │
  │    └── Update or create weekly distribution
  │         └── updateWeeklyDistribution(creator, weekEntry)
  │              ├── WeeklyDistribution.findOne({ creatorName: creator.creatorName })
  │              ├── Check if this week already exists (skip if so)
  │              ├── If no doc exists: Create new document
  │              └── If doc exists: Push new week entry
  │
  ├── Filter results to remove empty entries
  └── Return formatted response with created distributions
```

### Token Distribution Calculation Logic

The core of the distribution calculation happens in the `processDailyData` function:

1. For each day in the target week:
   - Find the day's attention data record
   - For each user who supported the creator that day:
     - Calculate their token share: `dailyDripAmount * (supportPercentage / 100)`
     - Add to user's total for the week

2. This creates a mapping of:
   ```
   {
     "0xWalletAddress1": 10.5,  // 10.5 tokens for the week
     "0xWalletAddress2": 5.2,   // 5.2 tokens for the week
     ...
   }
   ```

3. This map is then converted to blockchain-compatible format:
   ```
   {
     recipients: ["0xWalletAddress1", "0xWalletAddress2", ...],
     amounts: ["10500000000000000000", "5200000000000000000", ...], // Wei values
     totalAmount: "15700000000000000000" // Total in Wei
   }
   ```

### Data Security and Integrity

To ensure distribution integrity, the system:

1. Creates a cryptographic hash of the distribution data
2. Signs this hash with the system's private key
3. Stores both the original data and signature
4. When broadcasting, the contract verifies the signature before distributing tokens

This prevents tampering with distribution amounts between calculation and execution.

## Token Distribution to Blockchain

The token distribution to blockchain is the final stage where calculated token allocations are actually transferred to recipients through smart contract transactions. This process is critical and must be resilient to network issues and gas price fluctuations.

### Detailed Broadcasting Process

```
distributionBroadcaster.js: broadcastDistributions()
  ├── Extract distribution method from request (default to 'signature')
  │
  ├── Find all pending distributions:
  │    └── WeeklyDistribution.find({ 'weekDistribution.isBroadcasted': false })
  │
  ├── Return early if no pending distributions found
  │
  ├── Initialize results array to track successes and failures
  │
  ├── For each distribution document:
  │    ├── Get creator name for logging
  │    ├── Filter for non-broadcasted week entries
  │    │
  │    └── For each pending week entry:
  │         ├── Initialize distributor contract from blockchain:
  │         │    └── new ethers.Contract(
  │         │         doc.distributionContract,
  │         │         contracts.creatorTokenSupporter.abi,
  │         │         wallet // Using wallet for signing transactions
  │         │       )
  │         │
  │         ├── Log distribution details for monitoring
  │         │
  │         ├── Create transaction based on method:
  │         │    ├── If method === 'signature':
  │         │    │    // Signature method is more gas efficient for large distributions
  │         │    │    ├── Log using signature method
  │         │    │    ├── Transaction:
  │         │    │    │    └── distributorContract.distributeWithData(
  │         │    │    │         entry.encodedData,  // ABI encoded packed data
  │         │    │    │         entry.signedHash,   // Admin signature
  │         │    │    │         { gasLimit: 500000 } // Explicit gas limit to prevent failures
  │         │    │    │       )
  │         │    │    └── Record method used: entry.distributionMethod = 'signature'
  │         │    │
  │         │    └── Else (direct method):
  │         │         // Direct method sends arrays directly to contract 
  │         │         ├── Log using direct method
  │         │         ├── Transaction:
  │         │         │    └── distributorContract.distribute(
  │         │         │         entry.directDistribution.recipients, // Array of addresses
  │         │         │         entry.directDistribution.amounts,    // Array of token amounts
  │         │         │         entry.directDistribution.totalAmount, // Total tokens to distribute
  │         │         │         { gasLimit: 500000 } // Explicit gas limit
  │         │         │       )
  │         │         └── Record method used: entry.distributionMethod = 'direct'
  │         │
  │         ├── Wait for transaction to be mined (confirmation):
  │         │    └── const receipt = await tx.wait()
  │         │         // This blocks until transaction is confirmed on blockchain
  │         │
  │         ├── Log successful transaction with hash
  │         │
  │         ├── Update distribution status in database:
  │         │    ├── entry.isBroadcasted = true
  │         │    ├── entry.transactionReceipt = receipt.hash
  │         │    └── await doc.save() // Save to database
  │         │
  │         ├── Record success in results:
  │         │    └── results.push({
  │         │         creatorName,
  │         │         weekStart: entry.weekStart,
  │         │         method,
  │         │         transactionHash: receipt.hash,
  │         │         status: 'success'
  │         │       })
  │         │
  │         └── On error:
  │              ├── Log detailed error information
  │              └── Record failure in results:
  │                   └── results.push({
  │                        creatorName,
  │                        weekStart: entry.weekStart,
  │                        method,
  │                        error: error.message,
  │                        status: 'failed'
  │                      })
  │
  └── Return comprehensive results:
       └── res.status(200).json({
            message: "Distribution process completed",
            results
          })
```

### Alternative Implementation in supportTokenBroadcaster.js

The `supportTokenBroadcaster.js` implementation offers more detailed error handling and contract state verification:

```
supportTokenBroadcaster.js: broadcastPendingDistributions()
  ├── Similar structure to distributionBroadcaster.js
  ├── Additional pre-transaction checks:
  │    ├── Check distributor contract configuration:
  │    │    └── distributorContract.distributorConfig()
  │    │         // Verify contract parameters before attempting to broadcast
  │    │
  │    ├── Check token balance of distributor contract:
  │    │    ├── Initialize token contract:
  │    │    │    └── new ethers.Contract(
  │    │    │         doc.tokenContract,
  │    │    │         contracts.creatorToken.abi,
  │    │    │         provider
  │    │    │       )
  │    │    └── Check balance:
  │    │         └── tokenContract.balanceOf(doc.distributionContract)
  │    │              // Ensure contract has enough tokens to distribute
  │    │
  │    └── Estimate gas before transaction:
  │         └── distributorContract.distributeWithData.estimateGas(
  │              entry.encodedData,
  │              entry.signedHash
  │            )
  └── More detailed error reporting
```

### Smart Contract Interaction

Both implementations interact with two main types of contracts:

1. **Creator Token Contract** (ERC-20):
   - Standard ERC-20 functions like `balanceOf`
   - Used to check token balances before distribution

2. **Distributor Contract**:
   - `distributorConfig()` - Gets configuration parameters
   - `distributeWithData(bytes encodedData, bytes signature)` - Signature-based distribution
   - `distribute(address[] recipients, uint256[] amounts, uint256 totalAmount)` - Direct distribution

### Error Handling and Recovery

The system implements several error handling strategies:

1. **Pre-transaction Checks**:
   - Verifying contract configuration
   - Checking token balances
   - Estimating gas costs

2. **Transaction Parameters**:
   - Explicit gas limits to prevent out-of-gas errors
   - Proper encoding of distribution data

3. **Post-transaction Verification**:
   - Waiting for transaction confirmation
   - Storing transaction receipt hash

4. **Comprehensive Error Reporting**:
   - Detailed error logs including contract state
   - Error details in API response
   - Transaction attempt tracking

5. **Partial Success Handling**:
   - Each week's distribution is processed independently
   - Failures in one distribution don't affect others
   - Results include both successes and failures

### Gas Optimization Strategies

The system implements two distribution methods with different gas efficiency profiles:

1. **Signature Method** (`distributeWithData`):
   - More gas efficient for large distributions
   - Requires off-chain signature generation
   - Passes compact encoded data to contract

2. **Direct Method** (`distribute`):
   - Simpler implementation
   - Uses more gas for large distributions
   - Easier to debug and understand

The admin can choose which method to use based on network conditions and distribution size.

## User Support Calculation

The user support calculation flow:

```
dbController.js: updateUserPercentSupp()
  ├── fetchUsers() // Get all registered users
  │    └── db.collection('users').find().toArray()
  │
  ├── For each entry in userSuppDist:
  │    ├── Check if user is registered
  │    │    └── registeredUsernames.has(username)
  │    │
  │    └── Update user's support percentage
  │         └── collection.updateOne(
  │              { username, "hourly.timestamp": unixTimestamp },
  │              { $push: { 'hourly.$.distribution': { ... } } }
  │            )
```

## Creator API Operations

The creator operations call trace:

### Creating a Creator Token

```
creatorToken.js: storeByUsername()
  ├── Validate request
  ├── Creator.create(req.body) // Create new creator document
  └── Return success response
```

### Fetching Creator Data

```
creatorToken.js: getDataByUsername()
  ├── Extract username from query
  ├── Creator.findOne({ creatorName: username }) // Find creator in database
  └── Return creator data or 404
```

### Getting All Creators

```
creatorToken.js: getAllCreators()
  ├── Creator.find({}, 'creatorName') // Get just the names
  └── Return array of creator names
```

## NFT Management

NFT operations follow this process:

### Creating an NFT

```
nftController.js: createNFT()
  ├── NFT.create(req.body) // Create NFT document
  └── Return success with NFT data
```

### Fetching NFTs

```
nftController.js: getAllNFTs()
  ├── NFT.find() // Get all NFTs
  └── Return array of NFTs
```

### Fetching a Single NFT

```
nftController.js: getNFTById()
  ├── NFT.findById(req.params.id) // Find by MongoDB ID
  └── Return NFT or 404
```

## IPFS Integration

```
IpfsApi.js: fetchMetadataFromIpfs()
  ├── Construct IPFS gateway URL
  │    └── `https://gateway.pinata.cloud/ipfs/${cid}`
  ├── axios.get(url) // Fetch data from IPFS
  └── Return metadata
```

This metadata is used when fetching creator data in `creatorToken.js: getDataByUsername()` when an NFT IPFS CID is available.

## Twitter Scraping Flow

The Twitter scraping process:

```
scraper.js: getScraper()
  ├── new Scraper()
  ├── scraper.isLoggedIn()
  ├── If not logged in:
  │    └── scraper.login() // Log in with credentials from .env
  └── Return scraper instance

tweetController.js: getTweetsAndReplies()
  ├── getScraper() // Get scraper instance
  ├── scraper.getTweetsAndReplies(user, maxTweets) // Fetch tweets
  ├── Filter by timestamp
  └── Return filtered tweets
```

## Detailed Database Operations

### MongoDB Connection

```
db.js: connectDB()
  ├── Log connection attempt
  ├── mongoose.connect() with options
  ├── Log success
  └── Handle errors with process.exit(1)
```

### Attention Data Storage

```
dbController.js: updateAttentionRecords()
  ├── Get attention_records collection
  ├── For each creator:
  │    └── collection.updateOne(
  │         { creatorName: username },
  │         { $push: { hourly: { ... } } },
  │         { upsert: true }
  │       )
```

## Error Handling Flow

```
errorHandler.js (middleware)
  ├── Log error details
  ├── Format error response based on error type
  └── Send error response
```

This error handler is used globally in the application through:

```
server.js
  └── app.use(errorHandler)
```

## API Pattern

The API architecture follows a consistent pattern throughout the system, providing a clean separation of concerns and making the codebase easier to maintain and extend.

### Core API Structure

```
                   ┌─────────────┐
                   │   Client    │
                   │   Request   │
                   └──────┬──────┘
                          │
                          ▼
┌────────────┐     ┌─────────────┐     ┌─────────────┐
│            │     │             │     │             │
│   Routes   │────▶│ Controllers │────▶│   Models    │
│            │     │             │     │             │
└────────────┘     └──────┬──────┘     └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │   Client    │
                   │  Response   │
                   └─────────────┘
```

### Request Processing Flow

Each API request follows this pattern:

```
routes/someRoute.js
  ├── Define endpoint pattern and HTTP method
  │    └── router.METHOD('/path', controller.function)
  │
  └── Export router for use in server.js

controllers/someController.js
  ├── Function corresponding to route
  │    ├── Extract data from request (body, query, params)
  │    ├── Validate input data
  │    ├── Call model methods to interact with database
  │    ├── Process data / apply business logic
  │    ├── Format response
  │    └── Send response with appropriate status code
  │
  └── Export controller functions

models/SomeModel.js
  ├── Define Mongoose schema
  │    └── Fields, types, validation, indexes
  ├── Add schema methods if needed
  └── Export model
```

### Detailed API Call Trace Example

Here's a detailed trace of a typical API call to retrieve creator data:

```
GET /creator/get-creator-data/?username=johndoe
  │
  ├── server.js
  │    └── Route matched to creatorTokenRoute
  │
  ├── creatorTokenRoute.js
  │    ├── router.get("/get-creator-data/", creatorController.getDataByUsername)
  │    └── Route handler found, pass to controller
  │
  ├── creatorToken.js: getDataByUsername()
  │    ├── Extract username from req.query
  │    │    └── const { username } = req.query
  │    │
  │    ├── Validate input
  │    │    └── (Implicit - route won't match without username parameter)
  │    │
  │    ├── Query database
  │    │    └── const creator = await Creator.findOne({ creatorName: username })
  │    │
  │    ├── Check if creator exists
  │    │    └── if (!creator) return res.status(404).json({ message: 'Creator not found' })
  │    │
  │    ├── Format response
  │    │    └── Prepare response object: { data: creator }
  │    │
  │    └── Send response
  │         └── res.status(200).json({ data: creator })
  │
  └── Creator.js (model)
       └── Mongoose performs database query using the model definition
```

### Response Format Standardization

The system uses a consistent response format pattern:

1. **Success Responses**:
   ```javascript
   // Using direct response
   res.status(200).json({ 
     data: resultData,
     message: "Optional success message"
   });
   
   // Using ResponseHandler utility
   handleResponse(res, data, "Success message");
   ```

2. **Error Responses**:
   ```javascript
   // Direct error response
   res.status(errorCode).json({ 
     message: "Error description",
     error: errorDetails // Optional
   });
   
   // Using ResponseHandler utility
   handleError(res, error);
   ```

### Error Handling Pattern

Error handling follows this pattern:

```
try {
  // Controller logic
} catch (error) {
  // Either:
  next(error); // Pass to global error handler
  
  // Or:
  handleError(res, error); // Use utility
  
  // Or:
  res.status(500).json({ error: error.message });
}
```

The global error handler middleware (`errorHandler.js`) then:
1. Logs the error details
2. Determines appropriate status code 
3. Formats consistent error response
4. Sends response to client

### API Versioning Strategy

The system doesn't have explicit API versioning, but follows these conventions:

1. Routes are organized by domain (creator, user, nft, etc.)
2. Each domain has dedicated controller and model files
3. Breaking changes would be implemented by adding new endpoints

For future API versioning, the recommended approach would be:
```
app.use('/api/v1/creator', v1CreatorRoutes);
app.use('/api/v2/creator', v2CreatorRoutes);
```

### Authentication and Authorization

The current system doesn't implement comprehensive auth, but points where it would be added:

1. Middleware in routes:
   ```javascript
   router.post('/creator', authMiddleware, creatorController.create);
   ```

2. Authorization checks in controllers:
   ```javascript
   if (req.user.id !== creator.userId) {
     return res.status(403).json({ message: 'Unauthorized' });
   }
   ```

### API Documentation Strategy

API endpoints are documented through:

1. Code comments above route definitions
2. JSDoc comments in controller functions
3. The README.md file with example requests and responses

### Testing Strategy

API endpoints could be tested with:

1. Unit tests for controllers (mocking database)
2. Integration tests for complete request flow
3. End-to-end tests simulating client requests

### Middleware Usage

The system uses middleware at several levels:

1. **Application-level middleware** in server.js:
   ```javascript
   app.use(express.json()); // Parse JSON request bodies
   ```

2. **Router-level middleware**:
   ```javascript
   router.use(someMiddleware);
   ```

3. **Error-handling middleware** at the end of middleware chain:
   ```javascript
   app.use(errorHandler);
   ```

### API Extensions

To add a new API feature, you would:

1. Create or update model in `src/models/`
2. Add controller functions in `src/controllers/`
3. Define routes in `src/routes/`
4. Mount routes in `server.js`
5. Add to API documentation