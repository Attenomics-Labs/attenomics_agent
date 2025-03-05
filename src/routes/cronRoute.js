const router = require("express").Router();
const { defaultHandler } = require("../controllers/defaultController");
const { runHourlyCron } = require("../controllers/cronController");

router.get("/", defaultHandler);
router.get("/runHourlyCron", runHourlyCron);

module.exports = router;