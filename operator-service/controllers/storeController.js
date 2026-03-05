const Store = require("../models/Store");

exports.createStore = async (req, res) => {
  try {
    const store = new Store(req.body);
    const savedStore = await store.save();
    res.status(201).json(savedStore);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStores = async (req, res) => {
  try {
    const stores = await Store.find();
    res.json(stores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateStore = async (req, res) => {
  try {
    const store = await Store.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(store);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteStore = async (req, res) => {
  try {
    await Store.findByIdAndDelete(req.params.id);
    res.json({ message: "Store deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};