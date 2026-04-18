const express = require("express");
const cors = require("cors");
const createChatRouter = require("./routes/chatRoutes");

function createApp(options = {}) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });

  app.use("/api/chats", createChatRouter(options));

  return app;
}

module.exports = createApp;