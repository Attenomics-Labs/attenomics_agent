const router = require("express").Router();
const { updateCreatorList, getCreatorList } = require("../controllers/creatorListController");

// Get the current list of creators
router.get("/", getCreatorList);

// Update the list of creators
router.post("/", updateCreatorList);

module.exports = router; 