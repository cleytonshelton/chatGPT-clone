const express = require("express");
const Chat = require("../models/Chat");

const router = express.Router();

// Save chat
router.post("/", async (req, res) => {
  try {
    const newChat = await Chat.create(req.body);
    res.status(201).json(newChat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all chats
router.get("/", async (req, res) => {
  try {
    const chats = await Chat.find();
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;