const request = require("supertest");
const createApp = require("../app");

function createInMemoryChatModel(initialChats = []) {
  let chats = initialChats.map((chat) => ({
    ...chat,
    messages: [...(chat.messages || [])],
    save: async function save() {
      const existingIndex = chats.findIndex((currentChat) => currentChat._id === this._id);
      if (existingIndex >= 0) {
        chats[existingIndex] = this;
      } else {
        chats.push(this);
      }
      return this;
    },
  }));

  const wrapChat = (chat) => ({
    ...chat,
    messages: [...(chat.messages || [])],
    save: async function save() {
      const existingIndex = chats.findIndex((currentChat) => currentChat._id === this._id);
      if (existingIndex >= 0) {
        chats[existingIndex] = this;
      } else {
        chats.push(this);
      }
      return this;
    },
  });

  return {
    async create(payload) {
      const chat = wrapChat({
        _id: payload._id || `chat-${chats.length + 1}`,
        title: payload.title,
        messages: payload.messages || [],
        pinned: payload.pinned || false,
        parentChatId: payload.parentChatId || null,
        branchedFromMessageIndex: payload.branchedFromMessageIndex ?? null,
      });
      chats.push(chat);
      return chat;
    },
    async findById(id) {
      const chat = chats.find((candidate) => candidate._id === id);
      return chat ? wrapChat(chat) : null;
    },
    find() {
      return {
        sort: async () => [...chats].reverse().map((chat) => wrapChat(chat)),
      };
    },
    async findByIdAndUpdate(id, update) {
      const chatIndex = chats.findIndex((candidate) => candidate._id === id);
      if (chatIndex < 0) {
        return null;
      }
      const existing = chats[chatIndex];
      const nextChat = wrapChat({
        ...existing,
        ...update,
        pinned: update.$set?.pinned ?? update.pinned ?? existing.pinned,
      });
      chats[chatIndex] = nextChat;
      return nextChat;
    },
    async findByIdAndDelete(id) {
      const chatIndex = chats.findIndex((candidate) => candidate._id === id);
      if (chatIndex < 0) {
        return null;
      }
      const [deletedChat] = chats.splice(chatIndex, 1);
      return deletedChat;
    },
    async countDocuments(query) {
      return chats.filter((chat) => chat.parentChatId === query.parentChatId).length;
    },
  };
}

describe("chat routes integration", () => {
  it("rejects empty message requests", async () => {
    const ChatModel = createInMemoryChatModel();
    const app = createApp({ ChatModel, provider: "demo" });

    const response = await request(app)
      .post("/api/chats/message")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Message is required" });
  });

  it("creates a chat and returns a demo assistant reply", async () => {
    const ChatModel = createInMemoryChatModel();
    const app = createApp({ ChatModel, provider: "demo" });

    const response = await request(app)
      .post("/api/chats/message")
      .send({ message: "Explain closures" });

    expect(response.status).toBe(201);
    expect(response.body.chat.title).toBe("Explain Closures");
    expect(response.body.chat.messages).toHaveLength(2);
    expect(response.body.chat.messages[1]).toMatchObject({
      role: "assistant",
      content: 'You said: "Explain closures"',
    });
  });

  it("creates a chat directly and derives the title from the first message when needed", async () => {
    const ChatModel = createInMemoryChatModel();
    const app = createApp({ ChatModel, provider: "demo" });

    const response = await request(app)
      .post("/api/chats")
      .send({ messages: [{ role: "user", content: "who is grace hopper?" }] });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe("Grace Hopper");
  });

  it("branches from an assistant message", async () => {
    const ChatModel = createInMemoryChatModel([
      {
        _id: "chat-1",
        title: "Root Chat",
        messages: [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi there" },
        ],
      },
    ]);
    const app = createApp({ ChatModel, provider: "demo" });

    const response = await request(app)
      .post("/api/chats/chat-1/branch")
      .send({ messageIndex: 1 });

    expect(response.status).toBe(201);
    expect(response.body.parentChatId).toBe("chat-1");
    expect(response.body.branchedFromMessageIndex).toBe(1);
    expect(response.body.messages).toEqual([
      { role: "assistant", content: "Hi there" },
    ]);
  });

  it("rejects branching from a user message", async () => {
    const ChatModel = createInMemoryChatModel([
      {
        _id: "chat-1",
        title: "Root Chat",
        messages: [{ role: "user", content: "Hello" }],
      },
    ]);
    const app = createApp({ ChatModel, provider: "demo" });

    const response = await request(app)
      .post("/api/chats/chat-1/branch")
      .send({ messageIndex: 0 });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/assistant message/);
  });

  it("lists chats in descending order", async () => {
    const ChatModel = createInMemoryChatModel([
      { _id: "chat-1", title: "Older Chat", messages: [] },
      { _id: "chat-2", title: "Newer Chat", messages: [] },
    ]);
    const app = createApp({ ChatModel, provider: "demo" });

    const response = await request(app).get("/api/chats");

    expect(response.status).toBe(200);
    expect(response.body.map((chat) => chat._id)).toEqual(["chat-2", "chat-1"]);
  });

  it("returns 404 for unknown chats", async () => {
    const ChatModel = createInMemoryChatModel();
    const app = createApp({ ChatModel, provider: "demo" });

    const response = await request(app).get("/api/chats/missing-chat");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Chat not found" });
  });

  it("toggles a pinned chat", async () => {
    const ChatModel = createInMemoryChatModel([
      {
        _id: "chat-1",
        title: "Pinned Chat",
        pinned: false,
        messages: [],
      },
    ]);
    const app = createApp({ ChatModel, provider: "demo" });

    const response = await request(app).put("/api/chats/chat-1/pin");

    expect(response.status).toBe(200);
    expect(response.body.pinned).toBe(true);
  });

  it("updates a chat title", async () => {
    const ChatModel = createInMemoryChatModel([
      {
        _id: "chat-1",
        title: "Old Title",
        messages: [],
      },
    ]);
    const app = createApp({ ChatModel, provider: "demo" });

    const response = await request(app)
      .put("/api/chats/chat-1/title")
      .send({ title: "New Title" });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe("New Title");
  });

  it("deletes a chat", async () => {
    const ChatModel = createInMemoryChatModel([
      {
        _id: "chat-1",
        title: "Delete Me",
        messages: [],
      },
    ]);
    const app = createApp({ ChatModel, provider: "demo" });

    const response = await request(app).delete("/api/chats/chat-1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Chat deleted successfully" });
  });
});