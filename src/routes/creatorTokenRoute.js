// src/routes/exampleRoute.js
const express = require('express');
const router = express.Router();
const creatorController = require('../controllers/creatorToken');

router.get('/get-creator-tokens', creatorController.getCreators);
router.post('/post-creator-token', creatorController.storeCreatorToken);

module.exports = router;
