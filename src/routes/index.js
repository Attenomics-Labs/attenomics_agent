// src/routes/index.js
const express = require('express');
const router = express.Router();

const creatorTokenRoute = require('./creatorTokenRoute');

router.use('/creator', creatorTokenRoute);

module.exports = router;
