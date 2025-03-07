const router = require("express").Router();
const { seedCreators } = require("../controllers/creatorController");

// Route to seed creators
router.post("/seed", seedCreators);

module.exports = router; 