require("dotenv").config();
const express = require("express");
const cors = require("cors");

const chatRoutes = require("./routes/chat");
const orderRoutes = require("./routes/order");
const portfolioRoutes = require("./routes/portfolio");
const goalsRoutes = require("./routes/goals");
const zerodhaRoutes = require("./routes/zerodha");
const chartDataRoutes = require("./routes/chartData");

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "Bharat Nivesh Saathi API" });
});

// Mount routes
app.use("/chat", chatRoutes);
app.use("/place-order", orderRoutes);
app.use("/portfolio", portfolioRoutes);
app.use("/goals", goalsRoutes);
app.use("/zerodha", zerodhaRoutes);
app.use("/chart-data", chartDataRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bharat Nivesh Saathi backend running on port ${PORT}`);
});
