import React, { useCallback, useContext, useMemo, useState, useEffect } from "react";
import Sidebar from "./Sidebar/Sidebar";
import Chat from "./Chat/Chat";
import { ThemeContext } from "../ThemeContext";

import "./dashboard.css";

const TITLE_STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "you", "your", "are",
  "was", "were", "have", "has", "had", "but", "not", "about", "into", "can",
  "will", "just", "please", "help", "how", "what", "why", "when", "where",
  "who", "which", "is", "am", "do", "does", "did", "a", "an",
]);

const toTitleCase = (word = "") => word.charAt(0).toUpperCase() + word.slice(1);

const phraseToTitle = (value = "") =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => toTitleCase(word))
    .join(" ");

const cleanPrompt = (message = "") =>
  String(message)
    .replace(/[?!.]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

const cleanSubject = (value = "") =>
  String(value)
    .replace(/^(is|are|was|were)\s+/i, "")
    .replace(/^(a|an|the)\s+/i, "")
    .replace(/\s+(is|are|was|were)$/i, "")
    .replace(/\s+/g, " ")
    .trim();

const getQuestionStyleTitle = (message = "") => {
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
};

const buildKeywordTitle = (message = "") => {
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
  return uniqueWords.map(toTitleCase).join(" ");
};

const sanitizeFilename = (value = "conversation") =>
  String(value)
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .slice(0, 60) || "conversation";

const getObjectIdTimestamp = (id) => {
  if (typeof id !== "string" || !/^[a-fA-F0-9]{24}$/.test(id)) {
    return null;
  }

  const unixSeconds = parseInt(id.slice(0, 8), 16);
  if (!Number.isFinite(unixSeconds)) {
    return null;
  }

  return new Date(unixSeconds * 1000);
};

const resolveMessageTimestamp = (message, chatCreatedAt) => {
  if (message?.createdAt) {
    return new Date(message.createdAt);
  }

  const objectIdTimestamp = getObjectIdTimestamp(message?._id);
  if (objectIdTimestamp) {
    return objectIdTimestamp;
  }

  if (chatCreatedAt) {
    return new Date(chatCreatedAt);
  }

  return null;
};

const toExportPayload = (chat) => ({
  chatId: chat?._id,
  title: chat?.title || "Conversation",
  createdAt: chat?.createdAt || null,
  updatedAt: chat?.updatedAt || null,
  exportedAt: new Date().toISOString(),
  messages: Array.isArray(chat?.messages)
    ? chat.messages.map((message, index) => ({
        index,
        role: message?.role || "unknown",
        content: message?.content || "",
        timestamp: resolveMessageTimestamp(message, chat?.createdAt)?.toISOString() || null,
      }))
    : [],
});

const toMarkdownExport = (chat) => {
  const payload = toExportPayload(chat);
  const lines = [
    `# ${payload.title}`,
    "",
    `- Chat ID: ${payload.chatId || "N/A"}`,
    `- Exported At: ${payload.exportedAt}`,
    "",
    "## Messages",
    "",
  ];

  payload.messages.forEach((message, index) => {
    lines.push(`### ${index + 1}. ${message.role}`);
    lines.push("");
    lines.push(`- Timestamp: ${message.timestamp || "N/A"}`);
    lines.push("");
    lines.push(message.content || "");
    lines.push("");
  });

  return lines.join("\n");
};

const downloadFile = ({ filename, content, type }) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const Dashboard = () => {
  const { toggleTheme } = useContext(ThemeContext);
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const currentChat = useMemo(
    () => chats.find((chat) => chat._id === chatId) || null,
    [chats, chatId]
  );

  // Fetch saved chats on mount
  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/chats");
      const data = await response.json();
      setChats(data);
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  const handleSendMessage = async (message) => {
    try {
      setLoading(true);
      console.log("Sending message:", message);

      // Show user message immediately
      setMessages(prev => [...prev, { role: "user", content: message }]);

      let currentChatId = chatId;
      // If no chatId, create a new chat with empty messages and title
      if (!currentChatId) {
        const saveResponse = await fetch("http://localhost:5000/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: buildKeywordTitle(message),
            messages: []
          })
        });
        if (saveResponse.ok) {
          const savedChat = await saveResponse.json();
          currentChatId = savedChat._id;
          setChatId(currentChatId);
        }
      }

      // Now send message to /message endpoint (which will add user message and AI reply)
      if (currentChatId) {
        const response = await fetch("http://localhost:5000/api/chats/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId: currentChatId,
            message: message
          })
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
          console.error("API error:", response.status);
          fetchChats();
          return;
        }

        const data = await response.json();
        console.log("API response:", data);

        // After AI response, reload messages from backend to avoid duplicates
        if (data.chat && data.chat.messages) {
          setMessages(data.chat.messages);
        } else if (data.message) {
          setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
        }
        fetchChats();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      fetchChats();
      fetchChats();
    } finally {
      setLoading(false);
    }
  };

  const handleEditMessage = async (messageIndex, newContent) => {
    if (!chatId) return;
    try {
      setLoading(true);
      // Truncate messages up to (but not including) the edited message, then add the edited one
      const truncated = messages.slice(0, messageIndex);
      const updatedMessages = [...truncated, { role: "user", content: newContent }];
      setMessages(updatedMessages);

      // Persist truncated messages first, then send the edited message for a new AI response
      const response = await fetch(`http://localhost:5000/api/chats/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, message: newContent, replaceFromIndex: messageIndex }),
      });

      if (!response.ok) {
        console.error("Edit failed:", response.status);
        return;
      }

      const data = await response.json();
      if (data.chat && data.chat.messages) {
        setMessages(data.chat.messages);
      }
      fetchChats();
    } catch (error) {
      console.error("Error editing message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = useCallback(() => {
    setChatId(null);
    setMessages([]);
  }, []);

  const handleForkConversation = async (messageIndex) => {
    if (!chatId || !Number.isInteger(messageIndex)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/chats/${chatId}/branch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageIndex }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create branch: ${response.status}`);
      }

      const branchedChat = await response.json();
      setChatId(branchedChat._id);
      setMessages(branchedChat.messages || []);
      fetchChats();
    } catch (error) {
      console.error("Error forking conversation:", error);
    }
  };

  const handleSelectChat = async (chat) => {
    setChatId(chat._id);
    setMessages(chat.messages);
  };

  const handleDeleteChat = async (chatToDeleteId) => {
    try {
      await fetch(`http://localhost:5000/api/chats/${chatToDeleteId}`, {
        method: "DELETE",
      });
      setChats(prev => prev.filter(c => c._id !== chatToDeleteId));
      if (chatToDeleteId === chatId) {
        handleNewChat();
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const handlePinChat = async (chatIdToPin) => {
    try {
      const response = await fetch(`http://localhost:5000/api/chats/${chatIdToPin}/pin`, {
        method: "PUT",
      });
      const updatedChat = await response.json();
      setChats(prev => prev.map(c => c._id === chatIdToPin ? updatedChat : c));
    } catch (error) {
      console.error("Error pinning chat:", error);
    }
  };

  const handleRenameChat = async (chatId, newTitle) => {
    try {
      const response = await fetch(`http://localhost:5000/api/chats/${chatId}/title`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle })
      });
      const updatedChat = await response.json();
      setChats(prev => prev.map(c => c._id === chatId ? updatedChat : c));
    } catch (error) {
      console.error("Error renaming chat:", error);
    }
  };

  useEffect(() => {
    const handleDashboardShortcuts = (event) => {
      const targetTagName = event.target?.tagName?.toLowerCase();
      const isEditableTarget =
        targetTagName === "input" ||
        targetTagName === "textarea" ||
        event.target?.isContentEditable;

      if (isEditableTarget) {
        return;
      }

      const hasCommandModifier = event.ctrlKey || event.metaKey;
      if (!hasCommandModifier || !event.shiftKey) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "n") {
        event.preventDefault();
        handleNewChat();
        return;
      }

      if (key === "f") {
        if (!chatId || !Array.isArray(messages) || messages.length === 0) {
          return;
        }

        const mostRecentAssistantMessageIndex = [...messages]
          .map((message, index) => ({ message, index }))
          .filter(({ message }) => message.role === "assistant")
          .pop()?.index;

        if (!Number.isInteger(mostRecentAssistantMessageIndex)) {
          return;
        }

        event.preventDefault();

        (async () => {
          try {
            const response = await fetch(`http://localhost:5000/api/chats/${chatId}/branch`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ messageIndex: mostRecentAssistantMessageIndex }),
            });

            if (!response.ok) {
              throw new Error(`Failed to create branch: ${response.status}`);
            }

            const branchedChat = await response.json();
            setChatId(branchedChat._id);
            setMessages(branchedChat.messages || []);

            const chatsResponse = await fetch("http://localhost:5000/api/chats");
            if (chatsResponse.ok) {
              const chatList = await chatsResponse.json();
              setChats(chatList);
            }
          } catch (error) {
            console.error("Error forking conversation:", error);
          }
        })();
        return;
      }

      if (key === "e") {
        if (!currentChat?._id) {
          return;
        }

        event.preventDefault();
        const dateSuffix = new Date().toISOString().slice(0, 10);
        const baseName = `${sanitizeFilename(currentChat.title)}-${dateSuffix}`;

        downloadFile({
          filename: `${baseName}.md`,
          content: toMarkdownExport(currentChat),
          type: "text/markdown;charset=utf-8",
        });
        return;
      }

      if (key === "j") {
        if (!currentChat?._id) {
          return;
        }

        event.preventDefault();
        const dateSuffix = new Date().toISOString().slice(0, 10);
        const baseName = `${sanitizeFilename(currentChat.title)}-${dateSuffix}`;

        downloadFile({
          filename: `${baseName}.json`,
          content: JSON.stringify(toExportPayload(currentChat), null, 2),
          type: "application/json;charset=utf-8",
        });
        return;
      }

      if (key === "r") {
        if (!currentChat?._id) {
          return;
        }

        event.preventDefault();
        const nextTitle = window.prompt("Enter a new chat title:", currentChat.title || "");
        if (nextTitle && nextTitle.trim()) {
          (async () => {
            try {
              const response = await fetch(`http://localhost:5000/api/chats/${currentChat._id}/title`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: nextTitle.trim() })
              });

              if (!response.ok) {
                throw new Error(`Failed to rename chat: ${response.status}`);
              }

              const updatedChat = await response.json();
              setChats((previousChats) => previousChats.map(
                (chat) => chat._id === currentChat._id ? updatedChat : chat
              ));
            } catch (error) {
              console.error("Error renaming chat:", error);
            }
          })();
        }
        return;
      }

      if (key === "b") {
        event.preventDefault();
        setSidebarOpen((wasOpen) => !wasOpen);
        return;
      }

      if (key === "l" || key === "t") {
        event.preventDefault();
        toggleTheme();
      }
    };

    window.addEventListener("keydown", handleDashboardShortcuts);

    return () => {
      window.removeEventListener("keydown", handleDashboardShortcuts);
    };
  }, [
    currentChat,
    messages,
    chatId,
    toggleTheme,
    handleNewChat,
  ]);

  return (
    <div className="dashboard_container">
      <Sidebar 
        onNewChat={handleNewChat} 
        chats={chats}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onPinChat={handlePinChat}
        currentChatId={chatId}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <Chat
        messages={messages}
        onSendMessage={handleSendMessage}
        onForkConversation={handleForkConversation}
        onEditMessage={handleEditMessage}
        searchTerm={searchTerm}
        loading={loading}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
    </div>
  );
};

export default Dashboard;
