const express = require("express");
const router = express.Router();
const attentionController = require("../controllers/attentionController");

router.get("/get-fraud-proof/", attentionController.getFraudProofByUserName);

module.exports = router;
