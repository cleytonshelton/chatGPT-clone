const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  role: String,      // "user" or "assistant"
  content: String,
}, { timestamps: true });

const chatSchema = new mongoose.Schema({
  title: String,
  messages: [messageSchema],
  parentChatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    default: null,
  },
  branchedFromMessageIndex: {
    type: Number,
    default: null,
  },
}, { timestamps: true });

let ChatModel = null;

module.exports = function getChat() {
  if (!ChatModel) {
    ChatModel = mongoose.model("Chat", chatSchema);
  }
  return ChatModel;
};