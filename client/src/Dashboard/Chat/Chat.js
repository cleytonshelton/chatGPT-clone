import React from "react";
import Messages from "./Messages";
import NewMessageInput from "./NewMessageInput";

const ChatLogo = () => {
  return (
    <div className="chat_gpt_logo_container">
      <p className="chat_gpt_logo">ChatGPT</p>
    </div>
  );
};

const Chat = ({ messages, onSendMessage, loading }) => {
  return (
    <div className="chat_container">
      <ChatLogo />
      <div className="chat_selected_container">
        <Messages messages={messages} />
        <NewMessageInput onSendMessage={onSendMessage} loading={loading} />
      </div>
    </div>
  );
};

export default Chat;
