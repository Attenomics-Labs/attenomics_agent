// src/controllers/nftController.js
const NFT = require('../models/NFT');

// Create a new NFT document
exports.createNFT = async (req, res) => {
  try {
    const nft = await NFT.create(req.body);
    res.status(201).json({ message: 'NFT created successfully', data: nft });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Retrieve all NFT documents
exports.getAllNFTs = async (req, res) => {
  try {
    const nfts = await NFT.find();
    res.status(200).json({ data: nfts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// (Optional) Retrieve a single NFT by ID
exports.getNFTById = async (req, res) => {
  try {
    const nft = await NFT.findById(req.params.id);
    if (!nft) return res.status(404).json({ message: 'NFT not found' });
    res.status(200).json({ data: nft });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
