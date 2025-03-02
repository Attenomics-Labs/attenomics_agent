// src/routes/nftRoute.js
const express = require('express');
const router = express.Router();
const nftController = require('../controllers/nftController');

// Endpoint to create a new NFT
router.post('/', nftController.createNFT);

// Endpoint to get all NFTs
router.get('/', nftController.getAllNFTs);

// (Optional) Endpoint to get a single NFT by ID
router.get('/:id', nftController.getNFTById);

module.exports = router;
