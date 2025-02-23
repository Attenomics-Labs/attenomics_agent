# Combined API Documentation

This repository exposes two main sets of endpoints:

1. **Creator Data API** – Endpoints for storing and retrieving creator-specific data, including NFT metadata fetched from IPFS. Data is persisted in a local JSON file.
2. **Twitter Scraper API** – Endpoints for retrieving tweet data from Twitter using the [agent-twitter-client](https://www.npmjs.com/package/agent-twitter-client).

## Table of Contents

1. [Overview](#overview)
2. [Creator Data API](#creator-data-api)
   - [Store Creator Data (POST /post-creator-token)](#store-creator-data)
   - [Retrieve Creator Data (GET /get-creator-data)](#retrieve-creator-data)
   - [Data Model](#data-model)
3. [Twitter Scraper API](#twitter-scraper-api)
   - [Fetch Multiple Tweets (POST /api/scraper/tweets)](#fetch-multiple-tweets)
   - [Fetch Latest Tweet (POST /api/scraper/latest-tweet)](#fetch-latest-tweet)
4. [Error Responses](#error-responses)
5. [Additional Notes](#additional-notes)

---

## Overview

- **Technology Stack**:  
  - Node.js, Express.js  
  - Local file system (for Creator Data API)  
  - [agent-twitter-client](https://www.npmjs.com/package/agent-twitter-client) for scraping Twitter data

- **Purpose**:  
  - The **Creator Data API** allows you to store creator-specific details (such as token addresses, social profiles, and NFT IPFS CIDs) and retrieve them. When retrieving data, if an NFT IPFS CID is present, the API also fetches the corresponding NFT metadata.
  - The **Twitter Scraper API** enables you to fetch tweets from any Twitter username. You can request multiple tweets or just the latest tweet.

---

## Creator Data API

### Store Creator Data

**Endpoint:**  
`POST /post-creator-token`

**Description:**  
Stores creator data in a local JSON file (`creatorData.json`).

**Request Body Example:**

```json
{
  "twitterUsername": "johndoe123",
  "creatorTokenAddress": "0x1234abcd5678ef90abcd1234ef5678901234abcd",
  "distributorContractAddress": "0xabcd1234ef5678901234abcd5678ef90abcd1234",
  "bondingCurveAddress": "0x5678ef901234abcd1234ef901234abcd5678ef90",
  "selfTokenVaultAddress": "0xef901234abcd5678ef901234abcd5678ef901234",
  "socialDataUser": {
    "telegramGroup": "https://t.me/johndoeGroup",
    "otherSocialProfiles": "https://www.linkedin.com/in/johndoe/"
  },
  "creatorWalletAddress": "0x9abcd1234ef5678901234abcd5678ef90abcd567",
  "nftIpfsCid": "QmW9sN7aS5t4bNJxVb3rDyvVRivu51DYHTeHbgsRQ3ksoW",
  "entryPointAddress": "0xabcdef1234ef5678901234abcd5678ef90abcd12",
  "attention": []
}
```

**Response:**  
- **200 OK** on success:
  ```json
  {
    "message": "Data stored successfully"
  }
  ```
- **400 Bad Request** if `twitterUsername` is missing.
- **500 Internal Server Error** for unexpected issues.

---

### Retrieve Creator Data

**Endpoint:**  
`GET /get-creator-data`

**Description:**  
Retrieves creator data based on the `twitterUsername` query parameter. If an `nftIpfsCid` exists in the stored data, the API fetches the corresponding NFT metadata from IPFS.

**Query Parameter:**

- **twitterUsername** (required, string)

**Example Request:**  
```
GET /get-creator-data?twitterUsername=johndoe123
```

**Example Response:**

```json
{
  "storedData": {
    "creatorTokenAddress": "0x1234abcd5678ef90abcd1234ef5678901234abcd",
    "distributorContractAddress": "0xabcd1234ef5678901234abcd5678ef90abcd1234",
    "bondingCurveAddress": "0x5678ef901234abcd1234ef901234abcd5678ef90",
    "selfTokenVaultAddress": "0xef901234abcd5678ef901234abcd5678ef901234",
    "socialDataUser": {
      "telegramGroup": "https://t.me/johndoeGroup",
      "otherSocialProfiles": "https://www.linkedin.com/in/johndoe/"
    },
    "creatorWalletAddress": "0x9abcd1234ef5678901234abcd5678ef90abcd567",
    "nftIpfsCid": "QmW9sN7aS5t4bNJxVb3rDyvVRivu51DYHTeHbgsRQ3ksoW",
    "entryPointAddress": "0xabcdef1234ef5678901234abcd5678ef90abcd12",
    "attention": []
  },
  "nftMetadata": {
    "name": "Example NFT",
    "description": "Sample NFT metadata fetched from IPFS",
    "image": "ipfs://QmSomeImageCID"
    // ...other metadata fields
  }
}
```

---

### Data Model

Creator data is stored as an object in `creatorData.json` with each key representing a `twitterUsername` and its corresponding data:

```json
{
  "johndoe123": {
    "creatorTokenAddress": "...",
    "distributorContractAddress": "...",
    "bondingCurveAddress": "...",
    "selfTokenVaultAddress": "...",
    "socialDataUser": {
      "telegramGroup": "...",
      "otherSocialProfiles": "..."
    },
    "creatorWalletAddress": "...",
    "nftIpfsCid": "...",
    "entryPointAddress": "...",
    "attention": []
  },
  "janedoe456": {
    // ...
  }
}
```

---

## Twitter Scraper API

### Fetch Multiple Tweets

**Endpoint:**  
`POST /api/scraper/tweets`

**Description:**  
Retrieves multiple tweets for a specified Twitter username.

**Request Body:**

- **user** (string, required): Twitter username.
- **maxTweets** (number, optional): Maximum number of tweets to fetch. Defaults to a preset value if omitted.

**Example Request Body:**

```json
{
  "user": "elonmusk",
  "maxTweets": 5
}
```

**Example Response:**

```json
{
  "success": true,
  "message": "Fetched tweets successfully",
  "data": [
    {
      "tweetID": "1893519231674663293",
      "text": "As a young person under 25, if you can execute things and truly show results, people will eventually start respecting you..."
    },
    {
      "tweetID": "1893165364265263208",
      "text": "Enough internet for today."
    }
    // ... additional tweets
  ]
}
```

---

### Fetch Latest Tweet

**Endpoint:**  
`POST /api/scraper/latest-tweet`

**Description:**  
Retrieves the latest tweet for a specified Twitter username.

**Request Body:**

- **user** (string, required): Twitter username.

**Example Request Body:**

```json
{
  "user": "DevSwayam"
}
```

**Example Response:**

```json
{
  "success": true,
  "message": "Fetched latest tweet successfully",
  "data": {
    "bookmarkCount": 2,
    "conversationId": "1893519231674663293",
    "id": "1893519231674663293",
    "hashtags": [],
    "likes": 25,
    "mentions": [],
    "name": "Swayam",
    "permanentUrl": "https://twitter.com/DevSwayam/status/1893519231674663293",
    "photos": [],
    "replies": 2,
    "retweets": 0,
    "text": "As a young person under 25, if you can execute things and truly show results, people will eventually start respecting you...",
    "thread": [],
    "urls": [],
    "userId": "1586411496699211777",
    "username": "DevSwayam",
    "videos": [],
    "isQuoted": false,
    "isReply": false,
    "isRetweet": false,
    "isPin": false,
    "sensitiveContent": false,
    "timeParsed": "2025-02-23T04:32:19.000Z",
    "timestamp": 1740285139,
    "html": "As a young person under 25, if you can execute things...",
    "views": 377
  }
}
```

---

## Error Responses

- **400 Bad Request**:  
  - Missing required fields (e.g., `user` in the request body).
  - For Creator Data API, missing `twitterUsername` or `nftIpfsCid` when fetching NFT metadata.
- **404 Not Found**:  
  - Creator data not found (e.g., no entry for the given `twitterUsername` or missing data file).
- **500 Internal Server Error**:  
  - Unexpected errors, such as file system errors or network issues when fetching data from IPFS or Twitter.

---

## Additional Notes

1. **Authentication & Environment Variables**:  
   - The Twitter Scraper API uses credentials (e.g., `TWITTER_USERNAME`, `TWITTER_PASSWORD`, etc.) provided via environment variables. Ensure these are correctly set in your environment.
   
2. **Rate Limits & Performance**:  
   - Be mindful of rate limits imposed by Twitter and potential performance impacts. Consider caching results or implementing rate limiting if needed.
   
3. **File-Based Storage (Creator Data API)**:  
   - Data is stored in `creatorData.json`. For production scenarios, consider using a dedicated database to handle higher concurrency and data integrity.
   
4. **Client Integration**:  
   - Front-end applications can integrate with these endpoints to display tweets, creator profiles, and NFT metadata. Ensure proper error handling and user feedback on the client side.

---

**For further questions or support, please contact the back-end team.**

