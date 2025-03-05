// src/config/config.js

const { ethers } = require("ethers");
const path = require("path");

// Load ABIs from the ../web3/abi folder
const creatorEntryPointAbi = require(path.join(__dirname, "..", "web3", "abi", "AttenomicsCreatorEntryPoint.json")).abi;
const bondingCurveAbi = require(path.join(__dirname, "..", "web3", "abi", "BondingCurve.json")).abi;
const creatorTokenAbi = require(path.join(__dirname, "..", "web3", "abi", "CreatorToken.json")).abi;
const creatorTokenSupporterAbi = require(path.join(__dirname, "..", "web3", "abi", "CreatorTokenSupporter.json")).abi;
const selfTokenVaultAbi = require(path.join(__dirname, "..", "web3", "abi", "SelfTokenVault.json")).abi;

// Set up chain and provider configuration using environment variables
const config = {
  chainId: 57054, // Default to mainnet
  providerUrl: "https://sonic-testnet.drpc.org", // process.env.PROVIDER_URL || "https://sonic-testnet.drpc.org",
};

// Create an ethers provider
const provider = new ethers.JsonRpcProvider(config.providerUrl, config.chainId);

// Create a wallet instance (ensure PRIVATE_KEY is set in your .env file)
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Export contract details with ABI and address (addresses should be provided in your env)
const contracts = {
  creatorEntryPoint: {
    address: process.env.CREATOR_ENTRY_POINT_ADDRESS,
    abi: creatorEntryPointAbi,
  },
  bondingCurve: {
    address: process.env.BONDING_CURVE_ADDRESS,
    abi: bondingCurveAbi,
  },
  creatorToken: {
    address: process.env.CREATOR_TOKEN_ADDRESS,
    abi: creatorTokenAbi,
  },
  creatorTokenSupporter: {
    address: process.env.CREATOR_TOKEN_SUPPORTER_ADDRESS,
    abi: creatorTokenSupporterAbi,
  },
  selfTokenVault: {
    address: process.env.SELF_TOKEN_VAULT_ADDRESS,
    abi: selfTokenVaultAbi,
  },
};

module.exports = {
  config,
  provider,
  wallet,
  contracts,
};
