const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/get-user-following-creators/", userController.getUserFollowersWhoCreatedTokens);


module.exports = router;
