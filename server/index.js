const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const chatRoutes = require("./routes/chatRoutes");
app.use("/api/chats", chatRoutes);

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.listen(5000, () => {
  console.log("Server running on port 5000");
});