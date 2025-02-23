const express = require("express");
const router = express.Router();
const creatorController = require("../controllers/creatorToken");

router.get("/get-creator-data/", creatorController.getDataByUsername);
router.post("/post-creator-token/", creatorController.storeByUsername);

router.get("/usernames/", creatorController.getAllUsernames);
router.get("/nfts/", creatorController.getNftArray);

module.exports = router;
