// src/routes/index.js
const express = require('express');
const router = express.Router();

const exampleRoute = require('./exampleRoute');

router.use('/example', exampleRoute);

module.exports = router;
