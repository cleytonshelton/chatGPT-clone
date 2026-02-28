import React from "react";
import Message from "./Message";

const Messages = ({ messages = [], loading }) => {
  return (
    <div className="chat_messages_container">
      {messages.length === 0 ? (
        <p style={{ color: "#ccc", textAlign: "center", marginTop: "20px" }}>
          Start a conversation...
        </p>
      ) : (
        <>
          {messages.map((msg, index) => (
            <Message
              key={index}
              content={msg.content}
              aiMessage={msg.role === "assistant"}
              animate={msg.role === "assistant" && index === messages.length - 1 && loading}
            />
          ))}
          {loading && (
            <div className="ai_typing_indicator">
              <span className="ai_typing_dot" />
              <span className="ai_typing_dot" />
              <span className="ai_typing_dot" />
              <span className="ai_typing_text">AI is thinking...</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Messages;
