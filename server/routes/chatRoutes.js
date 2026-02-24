const express = require("express");
const getChat = require("../models/Chat");
const { OpenAI } = require("openai");

const router = express.Router();

const getOpenAI = () => {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

// Send message and get AI response
router.post("/message", async (req, res) => {
  try {
    const Chat = getChat();
    console.log("Received message request:", req.body);
    console.log("Chat type:", typeof Chat, "Chat.create:", typeof Chat.create);
    
    const { chatId, message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get existing chat or create new one
    let chat = chatId ? await Chat.findById(chatId) : null;
    
    if (!chat) {
      chat = await Chat.create({
        title: message.slice(0, 30) + (message.length > 30 ? "..." : ""),
        messages: [],
      });
    }

    // Add user message
    chat.messages.push({ role: "user", content: message });

    // Call OpenAI API
    const openai = getOpenAI();
    console.log("Calling OpenAI API...");
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: chat.messages,
    });

    console.log("OpenAI response received");
    const assistantMessage = response.choices[0].message.content;
    
    // Add assistant response to chat
    chat.messages.push({ role: "assistant", content: assistantMessage });
    
    // Save to database
    await chat.save();

    console.log("Chat saved, sending response");
    res.status(201).json({
      chatId: chat._id,
      message: assistantMessage,
      chat: chat,
    });
  } catch (error) {
    console.error("Error in /message endpoint:", error);
    res.status(500).json({ error: error.message });
  }
});

// Save chat
router.post("/", async (req, res) => {
  try {
    const Chat = getChat();
    const newChat = await Chat.create(req.body);
    res.status(201).json(newChat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all chats
router.get("/", async (req, res) => {
  try {
    const Chat = getChat();
    const chats = await Chat.find();
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single chat
router.get("/:id", async (req, res) => {
  try {
    const Chat = getChat();
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update chat (add messages)
router.put("/:id", async (req, res) => {
  try {
    const Chat = getChat();
    const { messages } = req.body;
    
    const chat = await Chat.findByIdAndUpdate(
      req.params.id,
      { messages },
      { new: true }
    );
    
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update chat title
router.put("/:id/title", async (req, res) => {
  try {
    const Chat = getChat();
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const chat = await Chat.findByIdAndUpdate(
      req.params.id,
      { title },
      { new: true }
    );
    
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a chat
router.delete("/:id", async (req, res) => {
  try {
    const Chat = getChat();
    const chat = await Chat.findByIdAndDelete(req.params.id);
    
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;