const express = require("express");
const router = express.Router();
const promotionController = require("../controllers/promotionController");

router.post("/", promotionController.createPromotion);
router.get("/", promotionController.getPromotions);

module.exports = router;