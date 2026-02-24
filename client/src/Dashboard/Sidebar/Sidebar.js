import React, { useContext, useState } from "react";
import NewChatButton from "./NewChatButton";
import { ThemeContext } from "../../ThemeContext";
import { BsSun, BsMoon, BsTrash, BsPencil } from "react-icons/bs";

const Sidebar = ({ 
  onNewChat, 
  chats = [],
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  currentChatId
}) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [hoverChatId, setHoverChatId] = useState(null);

  const handleRenameStart = (chat) => {
    setEditingId(chat._id);
    setEditingTitle(chat.title);
  };

  const handleRenameSave = (chatId) => {
    if (editingTitle.trim()) {
      onRenameChat(chatId, editingTitle);
    }
    setEditingId(null);
  };

  const handleRenameCancel = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  return (
    <div className="sidebar_container">
      <NewChatButton onClick={onNewChat} />
      
      <div className="sidebar_conversations">
        {chats.length > 0 ? (
          chats.map((chat) => (
            <div
              key={chat._id}
              className={`chat_history_item ${currentChatId === chat._id ? 'active' : ''}`}
              onMouseEnter={() => setHoverChatId(chat._id)}
              onMouseLeave={() => setHoverChatId(null)}
            >
              {editingId === chat._id ? (
                <input
                  type="text"
                  className="chat_rename_input"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameSave(chat._id);
                    if (e.key === "Escape") handleRenameCancel();
                  }}
                  onBlur={() => handleRenameSave(chat._id)}
                  autoFocus
                />
              ) : (
                <>
                  <div 
                    className="chat_history_title"
                    onClick={() => onSelectChat(chat)}
                    title={chat.title}
                  >
                    {chat.title}
                  </div>
                  {hoverChatId === chat._id && (
                    <div className="chat_history_actions">
                      <button
                        className="chat_action_btn"
                        onClick={() => handleRenameStart(chat)}
                        title="Rename"
                      >
                        <BsPencil size={14} />
                      </button>
                      <button
                        className="chat_action_btn delete"
                        onClick={() => onDeleteChat(chat._id)}
                        title="Delete"
                      >
                        <BsTrash size={14} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        ) : (
          <p className="no_chats_message">No conversations yet</p>
        )}
      </div>

      <div className="sidebar_footer">
        <button className="theme_toggle_button" onClick={toggleTheme} title="Toggle theme">
          {theme === "light" ? <BsMoon size={18} /> : <BsSun size={18} />}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
