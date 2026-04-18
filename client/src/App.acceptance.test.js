import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";

describe("App acceptance flow", () => {
  const createFetchMock = (initialChats = []) => {
    let chatsState = initialChats.map((chat) => ({ ...chat }));

    return jest.fn((url, options = {}) => {
      if (url === "http://localhost:5000/api/chats" && !options.method) {
        return Promise.resolve({
          ok: true,
          json: async () => chatsState,
        });
      }

      if (url === "http://localhost:5000/api/chats" && options.method === "POST") {
        const body = JSON.parse(options.body);
        const newChat = {
          _id: "chat-1",
          title: body.title,
          messages: [],
          pinned: false,
        };
        chatsState = [newChat, ...chatsState];
        return Promise.resolve({
          ok: true,
          json: async () => newChat,
        });
      }

      if (url === "http://localhost:5000/api/chats/message" && options.method === "POST") {
        const body = JSON.parse(options.body);
        const updatedChat = {
          _id: body.chatId,
          title: "Who Is Ada Lovelace",
          pinned: false,
          messages: [
            { role: "user", content: body.message },
            { role: "assistant", content: `You said: \"${body.message}\"` },
          ],
        };
        chatsState = chatsState.map((chat) => (chat._id === body.chatId ? updatedChat : chat));
        return Promise.resolve({
          ok: true,
          json: async () => ({
            chatId: updatedChat._id,
            message: updatedChat.messages[1].content,
            chat: updatedChat,
          }),
        });
      }

      if (/\/api\/chats\/[^/]+$/.test(url) && options.method === "DELETE") {
        const chatId = url.split("/").pop();
        chatsState = chatsState.filter((chat) => chat._id !== chatId);
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: "Chat deleted successfully" }),
        });
      }

      if (/\/api\/chats\/[^/]+\/pin$/.test(url) && options.method === "PUT") {
        const chatId = url.split("/").slice(-2)[0];
        let updatedChat;
        chatsState = chatsState.map((chat) => {
          if (chat._id !== chatId) return chat;
          updatedChat = { ...chat, pinned: !chat.pinned };
          return updatedChat;
        });
        return Promise.resolve({ ok: true, json: async () => updatedChat });
      }

      if (/\/api\/chats\/[^/]+\/title$/.test(url) && options.method === "PUT") {
        const chatId = url.split("/").slice(-2)[0];
        const body = JSON.parse(options.body);
        let updatedChat;
        chatsState = chatsState.map((chat) => {
          if (chat._id !== chatId) return chat;
          updatedChat = { ...chat, title: body.title };
          return updatedChat;
        });
        return Promise.resolve({ ok: true, json: async () => updatedChat });
      }

      throw new Error(`Unhandled fetch request: ${url}`);
    });
  };

  beforeEach(() => {
    global.fetch = createFetchMock();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("lets a user start a conversation and see the assistant reply", async () => {
    render(<App />);

    const input = await screen.findByPlaceholderText("Send a message ...");
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/chats");
    });

    fireEvent.change(input, { target: { value: "Who is Ada Lovelace?" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(await screen.findByText("Who is Ada Lovelace?")).toBeInTheDocument();
    expect(await screen.findByText('You said: "Who is Ada Lovelace?"')).toBeInTheDocument();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/chats");
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/chats",
        expect.objectContaining({ method: "POST" })
      );
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/chats/message",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("lets a user open an existing conversation from the sidebar", async () => {
    global.fetch = createFetchMock([
      {
        _id: "chat-9",
        title: "Existing Chat",
        messages: [
          { role: "user", content: "Earlier question" },
          { role: "assistant", content: "Earlier answer" },
        ],
        pinned: false,
      },
    ]);

    render(<App />);

    fireEvent.click(await screen.findByText("Existing Chat"));

    expect(await screen.findByText("Earlier question")).toBeInTheDocument();
    expect(await screen.findByText("Earlier answer")).toBeInTheDocument();
  });

  it("lets a user search conversations from the sidebar", async () => {
    global.fetch = createFetchMock([
      {
        _id: "chat-1",
        title: "Ada Chat",
        messages: [{ role: "assistant", content: "Ada wrote algorithms" }],
        pinned: false,
      },
      {
        _id: "chat-2",
        title: "React Chat",
        messages: [{ role: "assistant", content: "Use state carefully" }],
        pinned: false,
      },
    ]);

    render(<App />);

    const searchInput = (await screen.findAllByLabelText("Search conversations"))[1];
    fireEvent.change(searchInput, { target: { value: "Ada" } });

    expect(await screen.findByTitle("Ada Chat")).toBeInTheDocument();
    expect(screen.queryByText("React Chat")).not.toBeInTheDocument();
    expect(screen.getByTitle("Ada wrote algorithms")).toBeInTheDocument();
  });

  it("lets a user delete a conversation from the sidebar menu", async () => {
    global.fetch = createFetchMock([
      {
        _id: "chat-1",
        title: "Disposable Chat",
        messages: [],
        pinned: false,
      },
    ]);

    render(<App />);

    fireEvent.click((await screen.findAllByLabelText("Conversation actions"))[0]);
    fireEvent.click(screen.getByText("Delete conversation"));

    await waitFor(() => {
      expect(screen.queryByText("Disposable Chat")).not.toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:5000/api/chats/chat-1",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});