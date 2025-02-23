
Below is a **README.md** that documents your two endpoints—one for storing creator data and another for retrieving creator data (including NFT metadata from IPFS). This guide is written in a formal style to help front-end developers understand how to interact with your API.

---

# Creator Data API

This API provides endpoints to store and retrieve creator data, including NFT metadata fetched from IPFS. Data is stored locally in a JSON file (`creatorData.json`).

## Table of Contents

1. [Overview](#overview)  
2. [Endpoints](#endpoints)  
   - [POST /post-creator-token](#1-post-post-creator-token)  
   - [GET /get-creator-data](#2-get-get-creator-data)  
3. [Data Model](#data-model)  
4. [Error Responses](#error-responses)  
5. [Example Usage](#example-usage)  
6. [Additional Notes](#additional-notes)

---

## Overview

- **Technology Stack**: Node.js, Express.js, local file system (JSON).  
- **Purpose**:  
  - Store creator-specific information (token addresses, wallet addresses, social links, etc.) keyed by a `twitterUsername`.  
  - Retrieve the stored data, and if an `nftIpfsCid` is present, automatically fetch the corresponding NFT metadata from IPFS.

---

## Endpoints

### 1. POST `/post-creator-token`

Stores creator data in the JSON file.

#### Request Body

Send JSON with the following structure:

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

- **twitterUsername** (required, `string`): Unique handle for the creator (must match their Twitter username).
- **creatorTokenAddress** (optional, `string`): Address for the creator’s token.
- **distributorContractAddress** (optional, `string`): Distributor contract address.
- **bondingCurveAddress** (optional, `string`): Bonding curve contract address.
- **selfTokenVaultAddress** (optional, `string`): Self token vault address.
- **socialDataUser** (optional, `object`): Contains links to social profiles.
  - **telegramGroup** (optional, `string`)
  - **otherSocialProfiles** (optional, `string`)
- **creatorWalletAddress** (optional, `string`): Creator’s wallet address.
- **nftIpfsCid** (optional, `string`): IPFS CID for the NFT metadata.
- **entryPointAddress** (optional, `string`): Entry point address.
- **attention** (optional, `array`): Reserved for future data on attention/engagement.

#### Response

- **200 OK** on success:
  ```json
  {
    "message": "Data stored successfully"
  }
  ```
- **400 Bad Request** if `twitterUsername` is missing or invalid.
- **500 Internal Server Error** for unexpected issues (e.g., file write errors).

---

### 2. GET `/get-creator-data`

Retrieves creator data by `twitterUsername`, and if an `nftIpfsCid` is found, fetches the corresponding NFT metadata from IPFS.

#### Query Parameters

- **twitterUsername** (required, `string`)

**Example**:  
```
GET /get-creator-data?twitterUsername=johndoe123
```

#### Response

- **200 OK** on success. The response includes:
  - **storedData**: The data retrieved from `creatorData.json`.
  - **nftMetadata**: The JSON metadata fetched from IPFS (if `nftIpfsCid` is present).

**Example Response**:
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

- **400 Bad Request** if `nftIpfsCid` is missing from the stored data.
- **404 Not Found** if:
  - `creatorData.json` file does not exist, or
  - `twitterUsername` is not found in the data file.
- **500 Internal Server Error** for unexpected issues (e.g., file read errors).

---

## Data Model

Data is stored in `creatorData.json` as an object keyed by `twitterUsername`. Each key maps to an object containing all creator-related information. For example:

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

## Error Responses

- **400 Bad Request**:  
  - Missing required fields (e.g., `twitterUsername` in POST).  
  - Attempting to fetch NFT metadata when `nftIpfsCid` is not set.
- **404 Not Found**:  
  - `creatorData.json` does not exist.  
  - No data found for the given `twitterUsername`.
- **500 Internal Server Error**:  
  - File system or unexpected server errors.

---

## Example Usage

### 1. Store Creator Data

**Request**  
```
POST /post-creator-token
Content-Type: application/json

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

**Response**  
```json
{
  "message": "Data stored successfully"
}
```

### 2. Retrieve Creator Data (and NFT Metadata)

**Request**  
```
GET /get-creator-data?twitterUsername=johndoe123
```

**Response**  
```json
{
  "storedData": {
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
  "nftMetadata": {
    // Data fetched from IPFS
  }
}
```

---

## Additional Notes

1. **File-Based Storage**:  
   - Data is persisted in `creatorData.json`.  
   - If concurrency or large-scale usage is expected, consider using a proper database.

2. **IPFS Fetching**:  
   - The NFT metadata is fetched from a specified IPFS gateway using `axios`.  
   - If `nftIpfsCid` is absent, the endpoint will return an error.

3. **Security**:  
   - For production, ensure HTTPS, authentication, and proper access control if storing sensitive information.

4. **Customization**:  
   - You can rename endpoints, adjust the JSON structure, or expand functionality as needed.  
   - The code is structured so that you can easily add new routes or integrate with a different data source.

---

**For further questions or support, please contact the back-end team.**