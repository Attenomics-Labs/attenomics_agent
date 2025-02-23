// externalApi/lpfsApi.js

const axios = require('axios');

/**
 * Fetch metadata from IPFS using a public gateway.
 * @param {string} cid - The IPFS CID (e.g., "QmSomeHash").
 * @returns {Promise<Object>} The JSON metadata object from IPFS.
 */
async function fetchMetadataFromIpfs(cid) {
  try {
    // Construct the URL for a public IPFS gateway
    const url = `https://harlequin-secure-tortoise-165.mypinata.cloud/ipfs/${cid}`;
    const response = await axios.get(url);
    return response.data; // Return the fetched metadata
  } catch (error) {
    console.error('Failed to fetch data from IPFS:', error.message);
    throw error;
  }
}

module.exports = {
  fetchMetadataFromIpfs
};
