const express = require("express");
const getChat = require("../models/Chat");
const { OpenAI } = require("openai");

function resolveFetch(fetchImpl) {
  if (fetchImpl) {
    return fetchImpl;
  }

  if (typeof global.fetch === "function") {
    return global.fetch.bind(global);
  }

  return require("node-fetch");
}

function normalizeChatTitle(title) {
  const fallback = "New Chat";
  const cleaned = (title || "").replace(/\s+/g, " ").trim();
  return cleaned || fallback;
}

function truncateTitle(title, maxLength = 70) {
  if (title.length <= maxLength) return title;
  return `${title.slice(0, maxLength - 3)}...`;
}

const TITLE_STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "you", "your", "are",
  "was", "were", "have", "has", "had", "but", "not", "about", "into", "can",
  "will", "just", "please", "help", "how", "what", "why", "when", "where",
  "who", "which", "is", "am", "do", "does", "did", "a", "an",
]);

function toTitleCase(word = "") {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function phraseToTitle(value = "") {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => toTitleCase(word))
    .join(" ");
}

function cleanPrompt(message = "") {
  return String(message)
    .replace(/[?!.]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanSubject(value = "") {
  return String(value)
    .replace(/^(is|are|was|were)\s+/i, "")
    .replace(/^(a|an|the)\s+/i, "")
    .replace(/\s+(is|are|was|were)$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getQuestionStyleTitle(message = "") {
  const prompt = cleanPrompt(message);
  const lowerPrompt = prompt.toLowerCase();

  const personMatch = lowerPrompt.match(/^(who\s+(is|was)\s+)(.+)$/i);
  if (personMatch) {
    const subject = cleanSubject(prompt.slice(personMatch[1].length));
    return subject ? phraseToTitle(subject) : "";
  }

  const heightMatch = lowerPrompt.match(/^how\s+tall\s+(.+)$/i);
  if (heightMatch) {
    const subject = cleanSubject(prompt.slice("how tall".length));
    return subject ? `${phraseToTitle(subject)} Height` : "";
  }

  return "";
}

function buildKeywordTitle(message = "") {
  const fallback = "New Chat";
  const intentTitle = getQuestionStyleTitle(message);
  if (intentTitle) {
    return intentTitle;
  }

  const terms = String(message)
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean)
    .map((term) => term.replace(/^[^a-z0-9(]+|[^a-z0-9)+\-*/=%^().:]+$/gi, ""))
    .filter((term) => /[a-z0-9]/i.test(term));

  const filteredWords = terms.filter(
    (term) => term.length > 2 && !TITLE_STOP_WORDS.has(term.toLowerCase())
  );
  const sourceWords = filteredWords.length ? filteredWords : terms.filter((term) => term.length > 1);

  if (!sourceWords.length) {
    return fallback;
  }

  const uniqueWords = [...new Set(sourceWords)].slice(0, 4);
  return truncateTitle(uniqueWords.map(toTitleCase).join(" "), 60);
}

const getOpenAI = () => {
  // instantiate client lazily to avoid initialization errors
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

async function getHuggingFaceResponse(prompt, fetchImpl) {
  const model = process.env.HF_MODEL || "gpt2"; // default fallback
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) throw new Error("HF_API_KEY is required for Hugging Face provider");

  const res = await fetchImpl(`https://api-inference.huggingface.co/models/${model}`, {
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

function createChatRouter(options = {}) {
  const router = express.Router();
  const provider = options.provider || process.env.AI_PROVIDER || "demo";
  const ollamaUrl = options.ollamaUrl || process.env.OLLAMA_URL || "http://localhost:11434";
  const ollamaModel = options.ollamaModel || process.env.OLLAMA_MODEL || "gpt-4";
  const fetchImpl = resolveFetch(options.fetch);
  const resolveChatModel = () => options.ChatModel || getChat();
  const openAIFactory = options.getOpenAI || getOpenAI;

  router.post("/message", async (req, res) => {
  try {
    const Chat = resolveChatModel();
    console.log("Received message request:", req.body);
    console.log("Using provider:", provider);
    console.log("Chat type:", typeof Chat, "Chat.create:", typeof Chat.create);
    
    const { chatId, message, replaceFromIndex } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get existing chat or create new one
    let chat = chatId ? await Chat.findById(chatId) : null;
    
    if (!chat) {
      chat = await Chat.create({
        title: buildKeywordTitle(message),
        messages: [],
      });
    }

    // If editing a message, truncate history from that index
    if (Number.isInteger(replaceFromIndex) && replaceFromIndex >= 0) {
      chat.messages = chat.messages.slice(0, replaceFromIndex);
    }

    // Add user message
    chat.messages.push({ role: "user", content: message });

    let assistantMessage = "";

    if (provider === "openai") {
      // Call OpenAI API
      const openai = openAIFactory();
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
      assistantMessage = await getHuggingFaceResponse(prompt, fetchImpl);
      console.log("HF response received");
    } else if (provider === "ollama") {
      // send only the latest user message as prompt
      const lastUserMsg = chat.messages.filter(m => m.role === "user").slice(-1)[0]?.content || message;
      const prompt = lastUserMsg;
      console.log("Calling Ollama at", ollamaUrl, "model", ollamaModel);
      const res = await fetchImpl(`${ollamaUrl}/api/generate`, {
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

  router.post("/", async (req, res) => {
  try {
    const Chat = resolveChatModel();
    const payload = { ...req.body };

    if (payload.title) {
      payload.title = normalizeChatTitle(payload.title);
    } else {
      const firstMessage = Array.isArray(payload.messages)
        ? payload.messages.find((message) => message?.content)?.content
        : "";
      payload.title = buildKeywordTitle(firstMessage);
    }

    const newChat = await Chat.create(payload);
    res.status(201).json(newChat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  });

  router.post("/:id/branch", async (req, res) => {
  try {
    const Chat = resolveChatModel();
    const sourceChat = await Chat.findById(req.params.id);

    if (!sourceChat) {
      return res.status(404).json({ error: "Source chat not found" });
    }

    const { messageIndex } = req.body || {};

    const resolvedIndex = Number.isInteger(messageIndex)
      ? messageIndex
      : [...sourceChat.messages]
          .map((message, index) => ({ message, index }))
          .filter(({ message }) => message.role === "assistant")
          .pop()?.index;

    if (!Number.isInteger(resolvedIndex)) {
      return res.status(400).json({
        error: "Cannot branch this conversation because it has no assistant response yet",
      });
    }

    if (resolvedIndex < 0 || resolvedIndex >= sourceChat.messages.length) {
      return res.status(400).json({ error: "Invalid message index" });
    }

    const branchPoint = sourceChat.messages[resolvedIndex];
    if (branchPoint.role !== "assistant") {
      return res.status(400).json({
        error: "Conversation branching must start from an assistant message",
      });
    }

    const branchMessages = [{
      role: branchPoint.role,
      content: branchPoint.content,
    }];

    const siblingBranchCount = await Chat.countDocuments({
      parentChatId: sourceChat._id,
    });
    const sourceTitle = normalizeChatTitle(sourceChat.title);
    const title = truncateTitle(`${sourceTitle} - Branch ${siblingBranchCount + 1}`);

    const branchedChat = await Chat.create({
      title,
      messages: branchMessages,
      parentChatId: sourceChat._id,
      branchedFromMessageIndex: resolvedIndex,
    });

    return res.status(201).json(branchedChat);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
  });

  router.get("/", async (req, res) => {
  try {
    const Chat = resolveChatModel();
    const chats = await Chat.find().sort({ updatedAt: -1 });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  });

  router.get("/:id", async (req, res) => {
  try {
    const Chat = resolveChatModel();
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  });

  router.put("/:id", async (req, res) => {
  try {
    const Chat = resolveChatModel();
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

  router.put("/:id/pin", async (req, res) => {
  try {
    const Chat = resolveChatModel();
    const current = await Chat.findById(req.params.id);
    if (!current) return res.status(404).json({ error: "Chat not found" });
    const chat = await Chat.findByIdAndUpdate(
      req.params.id,
      { $set: { pinned: !current.pinned } },
      { new: true, timestamps: false }
    );
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  });

  router.put("/:id/title", async (req, res) => {
  try {
    const Chat = resolveChatModel();
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

  router.delete("/:id", async (req, res) => {
  try {
    const Chat = resolveChatModel();
    const chat = await Chat.findByIdAndDelete(req.params.id);
    
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  });

  return router;
}

module.exports = createChatRouter;
module.exports.helpers = {
  buildKeywordTitle,
  cleanPrompt,
  cleanSubject,
  getQuestionStyleTitle,
  normalizeChatTitle,
  phraseToTitle,
  toTitleCase,
  truncateTitle,
};