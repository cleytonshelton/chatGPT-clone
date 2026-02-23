import React, { useState } from "react";
import Sidebar from "./Sidebar/Sidebar";
import Chat from "./Chat/Chat";

import "./dashboard.css";

const Dashboard = () => {
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (message) => {
    try {
      setLoading(true);
      // Add user message immediately
      setMessages(prev => [...prev, { role: "user", content: message }]);

      console.log("Sending message:", message);

      const response = await fetch("http://localhost:5000/api/chats/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: chatId,
          message: message
        })
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("API response:", data);
      
      if (data.chatId) {
        setChatId(data.chatId);
      }
      
      if (data.message) {
        // Add AI response
        setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
      } else {
        console.error("No message in response:", data);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Add error message to chat
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setChatId(null);
    setMessages([]);
  };

  return (
    <div className="dashboard_container">
      <Sidebar onNewChat={handleNewChat} />
      <Chat messages={messages} onSendMessage={handleSendMessage} loading={loading} />
    </div>
  );
};

export default Dashboard;
