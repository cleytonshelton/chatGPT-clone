const express = require("express");
const getChat = require("../models/Chat");
const { OpenAI } = require("openai");
const fetch = global.fetch || require('node-fetch'); // for HF or other HTTP APIs

const router = express.Router();

// select AI backend via environment variable. "openai", "hf" (Hugging Face), "ollama" or "demo"
// demo is a built-in no‑setup provider that returns a canned reply.
const provider = process.env.AI_PROVIDER || "demo";
console.log(`AI provider set to: ${provider}`);

// configuration for ollama
const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434"; // default local
const ollamaModel = process.env.OLLAMA_MODEL || "gpt-4";

const getOpenAI = () => {
  // instantiate client lazily to avoid initialization errors
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

// helper to query Hugging Face inference endpoint
async function getHuggingFaceResponse(prompt) {
  const model = process.env.HF_MODEL || "gpt2"; // default fallback
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) throw new Error("HF_API_KEY is required for Hugging Face provider");

  const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: prompt }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HF inference failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  // response could be array or object depending on model
  if (Array.isArray(data)) {
    return data[0].generated_text || data[0].text || "";
  }
  return data.generated_text || data.text || "";
}

// Send message and get AI response
router.post("/message", async (req, res) => {
  try {
    const Chat = getChat();
    console.log("Received message request:", req.body);
    console.log("Using provider:", provider);
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

    let assistantMessage = "";

    if (provider === "openai") {
      // Call OpenAI API
      const openai = getOpenAI();
      console.log("Calling OpenAI API...");
      const model = process.env.OPENAI_MODEL || "gpt-4";

      const response = await openai.chat.completions.create({
        model,
        messages: chat.messages,
      });
      console.log("OpenAI response received");
      assistantMessage = response.choices[0].message.content;
    } else if (provider === "hf") {
      // build a simple prompt by concatenating messages
      const prompt = chat.messages
        .map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n") + "\nAssistant:";
      console.log("Calling Hugging Face inference with prompt", prompt);
      assistantMessage = await getHuggingFaceResponse(prompt);
      console.log("HF response received");
    } else if (provider === "ollama") {
      // send only the latest user message as prompt
      const lastUserMsg = chat.messages.filter(m => m.role === "user").slice(-1)[0]?.content || message;
      const prompt = lastUserMsg;
      console.log("Calling Ollama at", ollamaUrl, "model", ollamaModel);
      const res = await fetch(`${ollamaUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ollamaModel,
          prompt,
          stream: false,
          max_tokens: 32,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Ollama failed: ${res.status} ${err}`);
      }
      const data = await res.json();
      assistantMessage = data.response || data.output || "";
      console.log("Ollama response received");
    } else if (provider === "demo") {
      // extremely simple built-in fallback with no external API
      // just repeat the last user message or return generic text
      const lastUser = chat.messages
        .filter(m => m.role === "user")
        .slice(-1)[0];
      assistantMessage = lastUser
        ? `You said: "${lastUser.content}"`
        : "Hello! This is a demo response.";
      console.log("Demo provider used");
    } else {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }
    
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