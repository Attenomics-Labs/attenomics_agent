// src/routes/items.js
const express = require('express');
const router = express.Router();
const Item = require('../models/Item');

// POST /api/items - Create a new item
router.post('/', async (req, res, next) => {
  try {
    const newItem = await Item.create(req.body);
    res.status(201).json(newItem);
  } catch (error) {
    next(error);
  }
});

// GET /api/items - Retrieve all items
router.get('/', async (req, res, next) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
