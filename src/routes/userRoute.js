const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/get-user-following-creators/", userController.getUserFollowersWhoCreatedTokens);

// New route for seeding users
router.post("/seed", userController.seedUsers);

module.exports = router;
