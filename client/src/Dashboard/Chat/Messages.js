import React from "react";
import Message from "./Message";

const Messages = ({ messages = [] }) => {
  return (
    <div className="chat_messages_container">
      {messages.length === 0 ? (
        <p style={{ color: "#ccc", textAlign: "center", marginTop: "20px" }}>
          Start a conversation...
        </p>
      ) : (
        messages.map((msg, index) => (
          <Message
            key={index}
            content={msg.content}
            aiMessage={msg.role === "assistant"}
            animate={msg.role === "assistant"}
          />
        ))
      )}
    </div>
  );
};

export default Messages;
