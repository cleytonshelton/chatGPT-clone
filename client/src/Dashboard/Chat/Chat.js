import React from "react";
import Messages from "./Messages";
import NewMessageInput from "./NewMessageInput";
import { BsList } from "react-icons/bs";

const ChatLogo = () => {
  return (
    <div className="chat_gpt_logo_container">
      <p className="chat_gpt_logo">ChatGPT</p>
      <p className="chat_gpt_logo_subtitle">Start a conversation</p>
    </div>
  );
};

const Chat = ({ messages, onSendMessage, loading, sidebarOpen, onToggleSidebar }) => {
  return (
    <div className="chat_container">
      {!sidebarOpen && (
        <button className="sidebar_toggle_button" onClick={onToggleSidebar} title="Open sidebar">
          <BsList size={24} />
        </button>
      )}
      {messages.length === 0 && <ChatLogo />}
      <div className="chat_selected_container">
        <Messages messages={messages} />
        <NewMessageInput onSendMessage={onSendMessage} loading={loading} />
      </div>
    </div>
  );
};

export default Chat;
