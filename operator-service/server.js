require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const storeRoutes = require("./routes/storeRoutes");
const promotionRoutes = require("./routes/promotionRoutes");
const eventRoutes = require("./routes/eventRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/stores", storeRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/events", eventRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Operator Service running on port ${PORT}`);
});