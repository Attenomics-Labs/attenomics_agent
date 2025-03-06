const router = require("express").Router();
const { runHourlyCron } = require("../controllers/cronController");

router.get("/runHourlyCron", runHourlyCron);

module.exports = router;