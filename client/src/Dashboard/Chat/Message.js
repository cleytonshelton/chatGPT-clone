import React, { useState, useRef, useEffect } from "react";
import { GrUser } from "react-icons/gr";
import { FcMindMap } from "react-icons/fc";
import { BsClipboard, BsCheckCircle } from "react-icons/bs";

const SlowText = (props) => {
  const { speed, text } = props;

  const [placeholder, setPlaceholder] = useState(text ? text[0] : "");
  const index = useRef(0);

  useEffect(() => {
    if (!text) return;
    
    function tick() {
      index.current++;
      setPlaceholder((prev) => prev + text[index.current]);
    }
    if (index.current < text.length - 1) {
      let addChar = setInterval(tick, speed);
      return () => clearInterval(addChar);
    }
  }, [placeholder, speed, text]);

  return <span>{placeholder}</span>;
};

const Message = ({ content, aiMessage, animate }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div
      className="message_container"
      style={{ background: aiMessage ? "rgb(247, 247, 248)" : "white" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="message_avatar_container">
        {aiMessage ? <FcMindMap /> : <GrUser />}
      </div>
      <div className="message_content_wrapper">
        <p className="message_text">
          {animate ? <SlowText speed={20} text={content} /> : content}
        </p>
        {isHovered && (
          <button
            className={`message_copy_button ${isCopied ? 'copied' : ''}`}
            onClick={handleCopy}
            title={isCopied ? "Copied!" : "Copy message"}
          >
            {isCopied ? (
              <BsCheckCircle size={16} />
            ) : (
              <BsClipboard size={16} />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default Message;
