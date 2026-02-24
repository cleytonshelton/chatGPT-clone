import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar/Sidebar";
import Chat from "./Chat/Chat";

import "./dashboard.css";

const Dashboard = () => {
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState([]);

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
      // Add user message immediately to UI
      setMessages(prev => [...prev, { role: "user", content: message }]);

      console.log("Sending message:", message);

      // First, save the user message to database
      let currentChatId = chatId;
      
      if (!currentChatId) {
        // Create new chat with user message
        const saveResponse = await fetch("http://localhost:5000/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: message.slice(0, 30) + (message.length > 30 ? "..." : ""),
            messages: [{ role: "user", content: message }]
          })
        });
        
        if (saveResponse.ok) {
          const savedChat = await saveResponse.json();
          currentChatId = savedChat._id;
          setChatId(currentChatId);
        }
      } else {
        // Update existing chat with user message
        await fetch(`http://localhost:5000/api/chats/${currentChatId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, { role: "user", content: message }]
          })
        });
      }
      
      // Refresh chats list to show in sidebar
      fetchChats();

      // Now try to get AI response
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
        // Still update sidebar even if AI response fails
        fetchChats();
        return;
      }

      const data = await response.json();
      console.log("API response:", data);
      
      if (data.message) {
        // Add AI response
        setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
      }
      
      // Refresh chats list
      fetchChats();
    } catch (error) {
      console.error("Error sending message:", error);
      // Refresh sidebar even on error
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
      />
      <Chat messages={messages} onSendMessage={handleSendMessage} loading={loading} />
    </div>
  );
};

export default Dashboard;
