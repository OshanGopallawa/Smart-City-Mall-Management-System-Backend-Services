const Promotion = require("../models/Promotion");

exports.createPromotion = async (req, res) => {
  try {
    const promotion = new Promotion(req.body);
    const saved = await promotion.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find().populate("storeId");
    res.json(promotions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};