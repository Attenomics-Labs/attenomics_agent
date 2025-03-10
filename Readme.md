# Creator Token Distribution System

## Overview

This project is a backend service for managing and distributing creator tokens based on attention metrics, social engagement, and user support. The system analyzes social media activity, particularly from Twitter, to compute attention metrics and distribute tokens accordingly through a blockchain-based reward system.


> **Note for New Developers**: This system integrates social media analytics with blockchain technology to implement a token-based creator economy. If you're new to blockchain or social media APIs, check out the "Getting Started Guide" section below.

## Key Features

- **Social Media Analysis**: Scrapes and analyzes social media (Twitter) data to track creator engagement
- **Attention Metrics**: Computes creator attention scores and user support percentages
- **Token Distribution**: Manages weekly token distributions based on performance metrics
- **Blockchain Integration**: Interfaces with Ethereum smart contracts for token distribution
- **NFT Support**: Manages creator NFTs stored on IPFS
- **MongoDB Integration**: Stores all creator data, attention metrics, and distribution records

## System Architecture

The application follows a modular architecture with the following components:

### Core Components

1. **API Server**: Express.js server that exposes REST endpoints for all functionality
2. **Database Layer**: MongoDB for persistent storage with Mongoose ODM
3. **Social Media Analysis**: Twitter scraping and data analysis
4. **Token Distribution**: Weekly token distribution calculation and blockchain execution
5. **Cron Jobs**: Automated data collection and processing

### Data Models

- **Creator**: Information about content creators, their tokens, and contracts
- **Attention**: Attention metrics for creators collected over time
- **User**: User information and wallet addresses
- **Weekly Distribution**: Weekly token distribution calculations and records
- **NFT**: Creator NFT metadata and fraud proofs
- **Direct Distribution**: Direct token distribution records

## Setup and Installation

### Prerequisites

- Node.js (v14+)
- MongoDB (v4.4+)
- Ethereum wallet with private key (MetaMask or similar)
- Twitter API credentials (Developer account required)
- Environment variables configured in `.env` file

### Development Tools Recommendation

- **Code Editor**: VS Code with ESLint and Prettier extensions
- **API Testing**: Postman or Insomnia
- **MongoDB Client**: MongoDB Compass for database visualization
- **Ethereum Development**: Hardhat or Truffle framework for local testing

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server Configuration
PORT=3000

# MongoDB Configuration
CONNECTION_URI=mongodb://localhost:27017/creator-tokens

# Twitter Credentials
TWITTER_USERNAME=your_twitter_username
TWITTER_PASSWORD=your_twitter_password
TWITTER_EMAIL=your_twitter_email
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET_KEY=your_twitter_api_secret_key
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret

# Ethereum Configuration
PRIVATE_KEY=your_ethereum_private_key
NETWORK_URL=your_ethereum_network_url

# LLM Configuration 
LLM_MODEL=your_llm_model
LLM_URI=your_llm_uri
LLM_AUTH_TOKEN=your_llm_auth_token
```

### Installation Steps

1. Clone the repository
   ```bash
   git clone https://github.com/your-org/creator-token-distribution.git
   cd creator-token-distribution
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

4. Set up MongoDB:
   ```bash
   # If using Docker
   docker run --name mongodb -d -p 27017:27017 mongo:latest
   
   # Or ensure your local MongoDB instance is running
   ```

5. Start the server:
   ```bash
   # For production
   npm start
   
   # For development with auto-restart
   npm run dev
   ```

6. Verify installation:
   ```bash
   # You should see "Server running on port 3000" in the console
   # Open http://localhost:3000 in your browser to see "Hello, world!"
   ```

## API Endpoints

### Creator Token Management

#### Register a New Creator Token
- **Endpoint**: `POST /creator/post-creator-token/`
- **Request Body**:
```json
{
    "creatorName": "johndoe",
    "creatorTokenAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "distributorContractAddress": "0xabcdef1234567890abcdef1234567890abcdef12",
    "bondingCurveAddress": "0x7890abcdef1234567890abcdef1234567890abcdef",
    "selfTokenVaultAddress": "0xdef1234567890abcdef1234567890abcdef123456",
  "socialDataUser": {
      "telegramGroup": "@johndoe_community",
      "otherSocialProfiles": "instagram.com/johndoe"
    },
    "creatorWalletAddress": "0x2345678901abcdef2345678901abcdef23456789",
    "nftIpfsCid": "QmW1WEkFZ6XxVWVgWLV1Z3GQjmcCJfbAEMDQFaQBpdmXS1",
    "entryPointAddress": "0x5678901abcdef2345678901abcdef234567890abc"
  }
  ```
- **Response (Success - 201)**:
  ```json
  {
    "message": "Creator created successfully",
    "data": {
      "_id": "612c1d4a0e1e3a001fd9c4a1",
      "creatorName": "johndoe",
      "creatorTokenAddress": "0x1234567890abcdef1234567890abcdef12345678",
      ...
      "createdAt": "2023-08-29T18:30:18.432Z",
      "updatedAt": "2023-08-29T18:30:18.432Z"
    }
  }
  ```

#### Get Creator Data
- **Endpoint**: `GET /creator/get-creator-data/?username=johndoe`
- **Response (Success - 200)**:
  ```json
  {
    "data": {
      "_id": "612c1d4a0e1e3a001fd9c4a1",
      "creatorName": "johndoe",
      "creatorTokenAddress": "0x1234567890abcdef1234567890abcdef12345678",
      ...
      "createdAt": "2023-08-29T18:30:18.432Z",
      "updatedAt": "2023-08-29T18:30:18.432Z"
    }
  }
  ```
- **Response (Not Found - 404)**:
  ```json
  {
    "message": "Creator not found"
  }
  ```

#### Get All Creator Names
- **Endpoint**: `GET /creator/creator-names/`
- **Response (Success - 200)**:
  ```json
  {
    "data": [
      { "creatorName": "johndoe" },
      { "creatorName": "janedoe" },
      { "creatorName": "bobsmith" }
    ]
  }
  ```

### Attention Metrics

#### Get Attention Data for a Creator
- **Endpoint**: `GET /attention/get-fraud-proof/?username=johndoe`
- **Response (Success - 200)**:
  ```json
  {
    "data": {
      "_id": "612c1d4a0e1e3a001fd9c4a2",
      "creatorName": "johndoe",
      "days": {
        "2023-08-28": {
          "latestAttention": 85.7,
          "unixTimestamp": 1693228800,
          "reqHash": "a1b2c3d4e5f6",
          "resHash": "f6e5d4c3b2a1",
          "distribution": [
            {
              "name": "user1",
              "walletAddress": "0xabcdef1234567890",
              "percentage": 25.5
            },
            {
              "name": "user2",
              "walletAddress": "0x1234567890abcdef",
              "percentage": 15.3
            }
          ]
        }
      },
      "createdAt": "2023-08-29T18:30:18.432Z",
      "updatedAt": "2023-08-29T18:30:18.432Z"
    }
  }
  ```
- **Response (Not Found - 404)**:
  ```json
  {
    "message": "No attention data found"
  }
  ```

### User Management

#### Get Creators Followed by a User
- **Endpoint**: `GET /user/get-user-following-creators/?username=alice`
- **Response (Success - 200)**:
  ```json
  {
    "matchedCreators": [
      {
        "creatorName": "johndoe",
        "creatorTokenAddress": "0x1234567890abcdef1234567890abcdef12345678",
        "distributorContractAddress": "0xabcdef1234567890abcdef1234567890abcdef12",
        ...
      },
      {
        "creatorName": "janedoe",
        ...
      }
    ]
  }
  ```

### NFT Management

#### Create a New NFT
- **Endpoint**: `POST /nft/`
- **Request Body**:
```json
{
    "creatorName": "johndoe",
    "data": {
      "creatorWalletAddress": "0x2345678901abcdef2345678901abcdef23456789",
      "name": "Creator Token NFT",
      "symbol": "CTNFT",
      "image": "ipfs://QmW1WEkFZ6XxVWVgWLV1Z3GQjmcCJfbAEMDQFaQBpdmXS1",
      "description": "Official NFT for John Doe creator token"
    },
    "fraudProof": "0x1a2b3c4d5e6f"
  }
  ```
- **Response (Success - 201)**:
  ```json
  {
    "message": "NFT created successfully",
    "data": {
      "_id": "612c1d4a0e1e3a001fd9c4a3",
      "creatorName": "johndoe",
      "data": {
        "creatorWalletAddress": "0x2345678901abcdef2345678901abcdef23456789",
        "name": "Creator Token NFT",
        "symbol": "CTNFT",
        "image": "ipfs://QmW1WEkFZ6XxVWVgWLV1Z3GQjmcCJfbAEMDQFaQBpdmXS1",
        "description": "Official NFT for John Doe creator token"
      },
      "fraudProof": "0x1a2b3c4d5e6f",
      "createdAt": "2023-08-29T18:30:18.432Z",
      "updatedAt": "2023-08-29T18:30:18.432Z"
    }
  }
  ```

#### Get All NFTs
- **Endpoint**: `GET /nft/`
- **Response (Success - 200)**:
  ```json
  {
    "data": [
      {
        "_id": "612c1d4a0e1e3a001fd9c4a3",
        "creatorName": "johndoe",
        "data": {
          "creatorWalletAddress": "0x2345678901abcdef2345678901abcdef23456789",
          "name": "Creator Token NFT",
          "symbol": "CTNFT",
          "image": "ipfs://QmW1WEkFZ6XxVWVgWLV1Z3GQjmcCJfbAEMDQFaQBpdmXS1",
          "description": "Official NFT for John Doe creator token"
        },
        "fraudProof": "0x1a2b3c4d5e6f",
        "createdAt": "2023-08-29T18:30:18.432Z",
        "updatedAt": "2023-08-29T18:30:18.432Z"
      },
      ...
    ]
  }
  ```

#### Get NFT by ID
- **Endpoint**: `GET /nft/612c1d4a0e1e3a001fd9c4a3`
- **Response (Success - 200)**:
```json
{
    "data": {
      "_id": "612c1d4a0e1e3a001fd9c4a3",
      "creatorName": "johndoe",
      "data": {
        "creatorWalletAddress": "0x2345678901abcdef2345678901abcdef23456789",
        "name": "Creator Token NFT",
        "symbol": "CTNFT",
        "image": "ipfs://QmW1WEkFZ6XxVWVgWLV1Z3GQjmcCJfbAEMDQFaQBpdmXS1",
        "description": "Official NFT for John Doe creator token"
      },
      "fraudProof": "0x1a2b3c4d5e6f",
      "createdAt": "2023-08-29T18:30:18.432Z",
      "updatedAt": "2023-08-29T18:30:18.432Z"
    }
  }
  ```
- **Response (Not Found - 404)**:
  ```json
  {
    "message": "NFT not found"
  }
  ```

### Twitter Scraping

#### Get Tweets for a User
- **Endpoint**: `POST /scraper/tweets`
- **Request Body**:
```json
{
  "user": "elonmusk",
  "maxTweets": 5
}
```
- **Response (Success - 200)**:
  ```json
  {
    "tweets": [
      { "tweet": "Tweet 1 from elonmusk" },
      { "tweet": "Tweet 2 from elonmusk" },
      { "tweet": "Tweet 3 from elonmusk" },
      { "tweet": "Tweet 4 from elonmusk" },
      { "tweet": "Tweet 5 from elonmusk" }
    ]
  }
  ```

#### Get Latest Tweet for a User
- **Endpoint**: `POST /scraper/latest-tweet`
- **Request Body**:
  ```json
  {
    "user": "nasa"
  }
  ```
- **Response (Success - 200)**:
  ```json
  {
    "tweet": "Latest tweet from nasa"
  }
  ```

### Token Distribution

#### Create Weekly Distribution for All Creators
- **Endpoint**: `POST /weekly-distribution/all`
- **Request Body**:
  ```json
  {
    "weekStart": "2023-08-28"
  }
  ```
- **Response (Success - 201)**:
```json
{
    "message": "Weekly Distribution created for all creators",
  "data": [
    {
        "_id": "612c1d4a0e1e3a001fd9c4a4",
        "creatorName": "johndoe",
        "tokenContract": "0x1234567890abcdef1234567890abcdef12345678",
        "distributionContract": "0xabcdef1234567890abcdef1234567890abcdef12",
        "agentAddress": "0xdef1234567890abcdef1234567890abcdef123456",
        "scheme": "attention-based",
        "weekDistribution": [
          {
            "weekStart": "2023-08-28",
            "DistributionData": {
              "recipients": ["0xuser1", "0xuser2"],
              "amounts": ["1000000000000000000", "2000000000000000000"],
              "totalAmount": "3000000000000000000"
            },
            "dataHash": "0xhash1",
            "signedHash": "0xsignature1",
            "encodedData": "0xencodeddata1",
            "directDistribution": {
              "recipients": ["0xuser1", "0xuser2"],
              "amounts": ["1000000000000000000", "2000000000000000000"],
              "totalAmount": "3000000000000000000"
            },
            "dailyData": [
              {
                "day": "2023-08-28",
                "latestAttention": 85.7,
                "unixTimestamp": 1693228800,
                "reqHash": "a1b2c3d4e5f6",
                "resHash": "f6e5d4c3b2a1",
                "distribution": [
                  {
                    "walletAddress": "0xuser1",
                    "percentage": 25.5
                  },
                  {
                    "walletAddress": "0xuser2",
                    "percentage": 15.3
                  }
                ]
              }
            ],
            "isBroadcasted": false,
            "transactionReceipt": "",
            "distributionMethod": null
          }
        ],
        "createdAt": "2023-08-29T18:30:18.432Z",
        "updatedAt": "2023-08-29T18:30:18.432Z"
      }
  ]
}
```

#### Broadcast Weekly Distributions
- **Endpoint**: `POST /weekly-distribution/broadcast`
- **Request Body**:
```json
{
    "method": "signature"
}
```
- **Response (Success - 200)**:
```json
{
    "message": "Distribution process completed",
    "results": [
      {
        "creatorName": "johndoe",
        "weekStart": "2023-08-28",
        "method": "signature",
        "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "status": "success"
      },
      {
        "creatorName": "janedoe",
        "weekStart": "2023-08-28",
        "method": "signature",
        "error": "Insufficient funds for gas",
        "status": "failed"
      }
    ]
  }
  ```

## Core Workflows

### 1. Attention Data Collection

1. The system periodically fetches tweets and replies from creators
2. It analyzes the content using LLM to determine attention metrics
3. The metrics are stored in the database for later use in token distribution

**Sequence Diagram (Simplified):**
```
┌────────┐          ┌─────────┐          ┌─────┐          ┌─────────┐
│ Cron   │          │ Twitter │          │ LLM │          │ MongoDB │
│ Job    │          │ API     │          │     │          │         │
└────┬───┘          └────┬────┘          └──┬──┘          └────┬────┘
     │     Trigger       │                   │                  │
     │─────────────────>│                    │                  │
     │                   │                   │                  │
     │    Fetch Tweets   │                   │                  │
     │────────────────>│                    │                  │
     │                   │                   │                  │
     │   Return Tweets   │                   │                  │
     │<────────────────│                    │                  │
     │                   │                   │                  │
     │                   │  Analyze Content  │                  │
     │─────────────────────────────────────>│                  │
     │                   │                   │                  │
     │                   │  Return Analysis  │                  │
     │<─────────────────────────────────────│                  │
     │                   │                   │                  │
     │                   │                   │   Store Metrics  │
     │───────────────────────────────────────────────────────>│
     │                   │                   │                  │
     │                   │                   │   Confirm Save   │
     │<───────────────────────────────────────────────────────│
┌────┴───┐          ┌────┴────┐          ┌──┴──┐          ┌────┴────┐
│ Cron   │          │ Twitter │          │ LLM │          │ MongoDB │
│ Job    │          │ API     │          │     │          │         │
└────────┘          └─────────┘          └─────┘          └─────────┘
```

### 2. Weekly Token Distribution

1. The system calculates token distribution based on weekly attention metrics
2. It creates distribution entries for each creator with recipient addresses and amounts
3. The distributions are signed and prepared for blockchain execution
4. When ready, the distributions are broadcasted to the blockchain via smart contracts

**Flow Diagram:**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Calculate   │     │ Generate    │     │ Create      │     │ Broadcast   │
│ Weekly      │────>│ Distribution│────>│ Signed      │────>│ To          │
│ Metrics     │     │ Data        │     │ Transaction │     │ Blockchain  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**Key Components Involved:**
- `weeklyDistributionController.js`: Handles distribution calculation
- `WeeklyDistribution.js`: Data model for storing distribution info
- `distributionBroadcaster.js`: Manages blockchain transactions
- Ethereum smart contracts: Execute the actual token distribution

## Smart Contract Integration

The system interacts with several Ethereum smart contracts:

- **Creator Token Contract**: The ERC-20 token for a creator
- **Distribution Contract**: Handles token distribution logic
- **Bonding Curve**: Manages token economics
- **Self Token Vault**: Stores creator's own tokens

The integration is handled through the ethers.js library with signature-based transaction approvals for gas efficiency.

## File Structure

```
├── server.js                 # Main entry point
├── package.json              # Project dependencies and scripts
├── .env                      # Environment variables (create from .env.example)
├── .env.example              # Example environment variables
├── src/
│   ├── config/               # Configuration files
│   │   ├── db.js             # MongoDB connection setup
│   │   ├── config.js         # Application configuration
│   │   └── web3/             # Blockchain configuration
│   │       └── contractConfig.js  # Smart contract configs
│   │
│   ├── controllers/          # Request handlers
│   │   ├── attentionController.js   # Attention metrics
│   │   ├── creatorToken.js          # Creator token management
│   │   ├── cronController.js        # Scheduled tasks
│   │   ├── defaultController.js     # Basic endpoints
│   │   ├── directDistributionController.js  # Direct token distribution
│   │   ├── distributionBroadcaster.js       # Blockchain transactions
│   │   ├── llmController.js                 # LLM integration
│   │   ├── nftController.js                 # NFT management
│   │   ├── scraperController.js             # Twitter scraping
│   │   ├── supportTokenBroadcaster.js       # Token support
│   │   ├── tweetController.js               # Tweet analysis
│   │   ├── userController.js                # User management
│   │   └── weeklyDistributionController.js  # Weekly distribution
│   │
│   ├── models/               # Database models
│   │   ├── Attention.js      # Attention metrics model
│   │   ├── Creator.js        # Creator profile model
│   │   ├── DailySummary.js   # Daily data summary
│   │   ├── DirectDistribution.js  # Direct distribution
│   │   ├── Item.js           # Basic item model
│   │   ├── NFT.js            # NFT data model
│   │   ├── User.js           # User model
│   │   └── WeeklyDistribution.js  # Weekly distribution
│   │
│   ├── routes/               # API routes
│   │   ├── attentionRoute.js # Attention endpoints
│   │   ├── creatorTokenRoute.js  # Creator token endpoints
│   │   ├── cronRoute.js      # Scheduled tasks endpoints
│   │   ├── items.js          # Basic item endpoints
│   │   ├── nftRoute.js       # NFT endpoints
│   │   ├── scraperRoute.js   # Twitter scraping endpoints
│   │   ├── userRoute.js      # User endpoints
│   │   └── weeklyDistributionRoute.js  # Distribution endpoints
│   │
│   ├── utils/                # Utility functions
│   │   ├── ResponseHandler.js  # HTTP response formatting
│   │   ├── scraper.js          # Twitter scraping utilities
│   │   └── someUtil.js         # Miscellaneous utilities
│   │
│   ├── middleware/           # Express middleware
│   │   └── errorHandler.js   # Global error handling
│   │
│   ├── externalApi/          # External API integrations
│   │   └── IpfsApi.js        # IPFS interaction
│   │
│   └── data/                 # Data storage (JSON files)
│       ├── attention.json    # Attention data (file-based)
│       └── creatorData.json  # Creator data (file-based)
│
└── README.md                 # This documentation
```

### Key Files for New Developers

If you're new to the project, start by exploring these key files:

1. **server.js**: Understand how the application is bootstrapped
2. **src/config/db.js**: See how database connection is established
3. **src/controllers/weeklyDistributionController.js**: Core business logic for token distribution
4. **src/models/**: Examine data models to understand the domain entities
5. **src/routes/**: See available API endpoints

## Maintenance and Development

### Adding New Features

1. Create model in `/src/models/`
2. Add controller logic in `/src/controllers/`
3. Define routes in `/src/routes/`
4. Update `server.js` to include new routes

### Running in Development Mode

```
npm run dev
```

### Running Tests

```
npm test
```

## Getting Started Guide for New Developers

If you're new to this project, follow these steps to get up and running quickly:

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/creator-token-distribution.git
   cd creator-token-distribution
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your environment**
   - Copy `.env.example` to `.env`
   - Fill in all required environment variables
   - Make sure MongoDB is running locally or update the CONNECTION_URI

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Test the API**
   - Open your browser and navigate to `http://localhost:3000/`
   - You should see "Hello, world!" if the server is running correctly
   - Use Postman or curl to test other endpoints

6. **Understanding the codebase**
   - Start by examining `server.js` to see how the application is structured
   - Look at the route files to understand available endpoints
   - Check the models to understand the data structure

## Working with the Blockchain Components

When working with the blockchain components of this system:

1. **Contract Addresses**: All smart contract addresses should be in the format `0x` followed by 40 hexadecimal characters
2. **Gas Estimation**: The system automatically estimates gas, but you may need to adjust limits for complex transactions
3. **Testing on Testnet**: Always test on Ethereum testnets (like Goerli or Sepolia) before deploying to mainnet
4. **Private Keys**: Never commit private keys to the repository. Always use environment variables

## Troubleshooting

### Common Issues

- **MongoDB Connection Errors**: 
  - Check your CONNECTION_URI in .env and ensure MongoDB is running
  - Verify network connectivity if using a remote MongoDB instance
  - Check MongoDB logs for any authentication errors

- **Twitter API Errors**: 
  - Verify your Twitter credentials in .env
  - Check if your Twitter API rate limits have been exceeded
  - Ensure your developer account has the required permissions

- **Blockchain Transaction Failures**: 
  - Ensure your wallet has sufficient ETH for gas fees
  - Check if contract addresses are correct and contracts are deployed
  - Verify that the connected network matches your contract deployments

- **Node.js Dependencies**: 
  - If you encounter module not found errors, try `npm install` again
  - Check package.json for correct dependency versions

### Debugging Tools

- Run with debug logging enabled:
  ```bash
  DEBUG=app:* npm run dev
  ```

- Check MongoDB records directly:
  ```bash
  mongosh
  use creator-tokens
  db.creators.find()
  ```

### Logs

Check the console logs for detailed error messages. The application uses structured logging to help diagnose issues.

### Getting Help

If you're stuck, check:
1. Issue tracker for similar problems
2. Search the codebase for error messages
3. Review recent commits that might have affected your issue

## Contributors

This project was developed by the Creator Token Team.

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.