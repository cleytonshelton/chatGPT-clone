import React, { useState } from "react";
import { BsSend } from "react-icons/bs";

const NewMessageInput = ({ onSendMessage, loading }) => {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() && !loading) {
      onSendMessage(input);
      setInput("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="new_message_input_container">
      <input
        className="new_message_input"
        placeholder="Send a message ..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
      />
      <div
        className="new_message_icon_container"
        onClick={handleSend}
        style={{ cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1 }}
      >
        <BsSend color="grey" />
      </div>
    </div>
  );
};

export default NewMessageInput;
