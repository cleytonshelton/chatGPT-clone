const mongoose = require("mongoose");
require("dotenv").config();
const createApp = require("./app");

async function startServer({ mongoUri = process.env.MONGO_URI, port = 5000 } = {}) {
  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB Connected");

    const app = createApp();
    return app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };