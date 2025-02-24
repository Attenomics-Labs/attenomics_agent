// src/config/config.js

const { ethers } = require("ethers");
const path = require("path");

// Load ABIs from the ../abi folder
const creatorEntryPointAbi = require(path.join(__dirname, "..", "abi", "AttenomicsCreatorEntryPoint.json")).abi;
const bondingCurveAbi = require(path.join(__dirname, "..", "abi", "BondingCurve.json")).abi;
const creatorTokenAbi = require(path.join(__dirname, "..", "abi", "CreatorToken.json")).abi;
const creatorTokenSupporterAbi = require(path.join(__dirname, "..", "abi", "CreatorTokenSupporter.json")).abi;
const selfTokenVaultAbi = require(path.join(__dirname, "..", "abi", "SelfTokenVault.json")).abi;

// Chain and provider configuration
const chainId = process.env.CHAIN_ID || 1; // default to mainnet
const providerUrl = process.env.PROVIDER_URL || "http://localhost:8545";

// Create ethers provider
const provider = new ethers.providers.JsonRpcProvider(providerUrl, chainId);

// Create a wallet instance using your private key from .env
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Contract addresses (should be provided in your .env file)
const creatorEntryPointAddress = process.env.CREATOR_ENTRY_POINT_ADDRESS;
const bondingCurveAddress = process.env.BONDING_CURVE_ADDRESS;
const creatorTokenAddress = process.env.CREATOR_TOKEN_ADDRESS;
const creatorTokenSupporterAddress = process.env.CREATOR_TOKEN_SUPPORTER_ADDRESS;
const selfTokenVaultAddress = process.env.SELF_TOKEN_VAULT_ADDRESS;

// Create contract instances connected to the wallet (for signing transactions)
const creatorEntryPointContract = new ethers.Contract(creatorEntryPointAddress, creatorEntryPointAbi, wallet);
const bondingCurveContract = new ethers.Contract(bondingCurveAddress, bondingCurveAbi, wallet);
const creatorTokenContract = new ethers.Contract(creatorTokenAddress, creatorTokenAbi, wallet);
const creatorTokenSupporterContract = new ethers.Contract(creatorTokenSupporterAddress, creatorTokenSupporterAbi, wallet);
const selfTokenVaultContract = new ethers.Contract(selfTokenVaultAddress, selfTokenVaultAbi, wallet);

// Export an object with the wallet and contracts for global use
module.exports = {
  wallet,
  contracts: {
    creatorEntryPoint: creatorEntryPointContract,
    bondingCurve: bondingCurveContract,
    creatorToken: creatorTokenContract,
    creatorTokenSupporter: creatorTokenSupporterContract,
    selfTokenVault: selfTokenVaultContract,
  },
  provider,
  chainId,
  providerUrl,
};
