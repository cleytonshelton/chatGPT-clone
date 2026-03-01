import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar/Sidebar";
import Chat from "./Chat/Chat";

import "./dashboard.css";

const Dashboard = () => {
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
            title: message.slice(0, 30) + (message.length > 30 ? "..." : ""),
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

  const handleNewChat = () => {
    setChatId(null);
    setMessages([]);
  };

  const handleSelectChat = async (chat) => {
    setChatId(chat._id);
    setMessages(chat.messages);
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await fetch(`http://localhost:5000/api/chats/${chatId}`, {
        method: "DELETE",
      });
      setChats(prev => prev.filter(c => c._id !== chatId));
      if (chatId === chatId) {
        handleNewChat();
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
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

  return (
    <div className="dashboard_container">
      <Sidebar 
        onNewChat={handleNewChat} 
        chats={chats}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        currentChatId={chatId}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <Chat messages={messages} onSendMessage={handleSendMessage} loading={loading} sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
    </div>
  );
};

export default Dashboard;
