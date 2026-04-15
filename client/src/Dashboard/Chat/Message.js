import React, { useState, useRef, useEffect } from "react";
import { GrUser } from "react-icons/gr";
import { FcMindMap } from "react-icons/fc";
import { BsClipboard, BsCheckCircle, BsPencil, BsX, BsCheck } from "react-icons/bs";
import { CgGitFork } from "react-icons/cg";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const renderHighlightedText = (text = "", query = "") => {
  if (!query.trim()) {
    return text;
  }

  const regex = new RegExp(`(${escapeRegExp(query.trim())})`, "ig");
  const parts = String(text).split(regex);
  const normalizedQuery = query.trim().toLowerCase();

  return parts.map((part, index) =>
    part.toLowerCase() === normalizedQuery ? (
      <mark key={`${part}-${index}`} className="search_highlight_mark">
        {part}
      </mark>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    )
  );
};

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

const Message = ({ content, aiMessage, animate, messageIndex, onForkConversation, onEditMessage, searchTerm = "" }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);
  const textareaRef = useRef(null);
  const hasSearchTerm = searchTerm.trim().length > 0;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleEditStart = () => {
    setEditValue(content);
    setIsEditing(true);
  };

  const handleEditSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== content) {
      onEditMessage?.(messageIndex, trimmed);
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditValue(content);
    setIsEditing(false);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEditSave();
    }
    if (e.key === "Escape") {
      handleEditCancel();
    }
  };

  return (
    <div
      className={`message_container ${aiMessage ? 'ai_message' : 'user_message'}`}
      onMouseEnter={() => !isEditing && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="message_avatar_container">
        {aiMessage ? <FcMindMap /> : <GrUser />}
      </div>
      <div className="message_content_wrapper">
        {isEditing ? (
          <div className="message_edit_container">
            <textarea
              ref={textareaRef}
              className="message_edit_textarea"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleEditKeyDown}
              rows={3}
            />
            <div className="message_edit_actions">
              <button className="message_edit_save_button" onClick={handleEditSave} title="Save (Enter)">
                <BsCheck size={16} /> Save
              </button>
              <button className="message_edit_cancel_button" onClick={handleEditCancel} title="Cancel (Esc)">
                <BsX size={16} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="message_text">
              {animate && !hasSearchTerm
                ? <SlowText speed={20} text={content} />
                : renderHighlightedText(content, searchTerm)}
            </p>
            {isHovered && (
              <div className="message_actions">
                {aiMessage && (
                  <button
                    className="message_action_button"
                    onClick={() => onForkConversation?.(messageIndex)}
                    title="Fork conversation from this answer"
                  >
                    <CgGitFork size={16} />
                  </button>
                )}
                {!aiMessage && (
                  <button
                    className="message_action_button"
                    onClick={handleEditStart}
                    title="Edit message"
                  >
                    <BsPencil size={16} />
                  </button>
                )}
                <button
                  className={`message_action_button ${isCopied ? 'copied' : ''}`}
                  onClick={handleCopy}
                  title={isCopied ? "Copied!" : "Copy message"}
                >
                  {isCopied ? (
                    <BsCheckCircle size={16} />
                  ) : (
                    <BsClipboard size={16} />
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Message;
