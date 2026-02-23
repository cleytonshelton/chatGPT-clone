const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  role: String,      // "user" or "assistant"
  content: String,
});

const chatSchema = new mongoose.Schema({
  title: String,
  messages: [messageSchema],
}, { timestamps: true });

let ChatModel = null;

module.exports = function getChat() {
  if (!ChatModel) {
    ChatModel = mongoose.model("Chat", chatSchema);
  }
  return ChatModel;
};