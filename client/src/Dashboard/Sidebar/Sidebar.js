import React, { useContext, useEffect, useRef, useState } from "react";
import NewChatButton from "./NewChatButton";
import { ThemeContext } from "../../ThemeContext";
import { BsSun, BsMoon, BsTrash, BsPencil, BsChevronLeft, BsSearch, BsX } from "react-icons/bs";

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

const getChatMatchPreview = (chat, query = "") => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery || !Array.isArray(chat?.messages)) {
    return "";
  }

  const matchedMessage = chat.messages.find((message) =>
    (message?.content || "").toLowerCase().includes(normalizedQuery)
  );

  if (!matchedMessage?.content) {
    return "";
  }

  const normalizedContent = String(matchedMessage.content).replace(/\s+/g, " ").trim();
  const startIndex = normalizedContent.toLowerCase().indexOf(normalizedQuery);

  if (startIndex < 0) {
    return "";
  }

  const contextBefore = 28;
  const contextAfter = 42;
  const snippetStart = Math.max(0, startIndex - contextBefore);
  const snippetEnd = Math.min(
    normalizedContent.length,
    startIndex + normalizedQuery.length + contextAfter
  );

  let snippet = normalizedContent.slice(snippetStart, snippetEnd);
  if (snippetStart > 0) {
    snippet = `...${snippet}`;
  }
  if (snippetEnd < normalizedContent.length) {
    snippet = `${snippet}...`;
  }

  return snippet;
};

const Sidebar = ({ 
  onNewChat, 
  chats = [],
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  currentChatId,
  searchTerm = "",
  onSearchChange,
  sidebarOpen,
  onToggleSidebar
}) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [hoverChatId, setHoverChatId] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (searchTerm.trim()) {
      setIsSearchOpen(true);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const isOpenShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";

      if (isOpenShortcut) {
        event.preventDefault();
        setIsSearchOpen(true);
        return;
      }

      if (event.key === "Escape" && isSearchOpen) {
        event.preventDefault();
        onSearchChange?.("");
        setIsSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearchOpen, onSearchChange]);

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

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const visibleChats = normalizedSearchTerm
    ? chats.filter((chat) => {
        const titleMatch = (chat.title || "").toLowerCase().includes(normalizedSearchTerm);
        const messageMatch = Array.isArray(chat.messages)
          ? chat.messages.some((message) =>
              (message?.content || "").toLowerCase().includes(normalizedSearchTerm)
            )
          : false;

        return titleMatch || messageMatch;
      })
    : chats;

  const handleSearchToggle = () => {
    if (isSearchOpen && !searchTerm.trim()) {
      setIsSearchOpen(false);
      return;
    }

    setIsSearchOpen(true);
  };

  const handleSearchClose = () => {
    onSearchChange?.("");
    setIsSearchOpen(false);
  };

  return (
    <div className={`sidebar_container ${!sidebarOpen ? 'sidebar_closed' : ''}`}>
      <div className="sidebar_header">
        <div className="sidebar_logo">ChatGPT</div>
        <div className="sidebar_header_actions">
          <button
            className={`sidebar_icon_button ${isSearchOpen ? "active" : ""}`}
            onClick={handleSearchToggle}
            title="Search conversations"
            aria-label="Search conversations"
          >
            <BsSearch size={15} />
          </button>
          <button 
            className="sidebar_close_button" 
            onClick={onToggleSidebar}
            title="Close sidebar"
          >
            <BsChevronLeft size={18} />
          </button>
        </div>
      </div>

      <div className={`sidebar_search_container ${isSearchOpen ? "open" : ""}`}>
        <div className="sidebar_search_input_wrapper">
          <BsSearch size={14} className="sidebar_search_leading_icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="sidebar_search_input"
            placeholder="Search conversations"
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            aria-label="Search conversations"
          />
          <button
            className="sidebar_search_clear"
            onClick={handleSearchClose}
            title="Clear search"
            aria-label="Clear search"
          >
            <BsX size={16} />
          </button>
        </div>
      </div>

      <NewChatButton onClick={onNewChat} />
      
      <div className="sidebar_conversations">
        {visibleChats.length > 0 ? (
          visibleChats.map((chat) => {
            const matchPreview = normalizedSearchTerm
              ? getChatMatchPreview(chat, searchTerm)
              : "";

            return (
              <div
                key={chat._id}
                className={`chat_history_item ${currentChatId === chat._id ? 'active' : ''} ${normalizedSearchTerm ? 'search_result' : ''}`}
                onClick={() => {
                  if (editingId !== chat._id) {
                    onSelectChat(chat);
                  }
                }}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && editingId !== chat._id) {
                    e.preventDefault();
                    onSelectChat(chat);
                  }
                }}
                role="button"
                tabIndex={0}
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
                    <div className="chat_history_main">
                      <div 
                        className="chat_history_title"
                        title={chat.title}
                      >
                        {renderHighlightedText(chat.title, searchTerm)}
                      </div>
                      {normalizedSearchTerm && Boolean(matchPreview) && (
                        <div className="chat_history_match_preview" title={matchPreview}>
                          {renderHighlightedText(matchPreview, searchTerm)}
                        </div>
                      )}
                    </div>
                    {hoverChatId === chat._id && (
                      <div className="chat_history_actions">
                        <button
                          className="chat_action_btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameStart(chat);
                          }}
                          title="Rename"
                        >
                          <BsPencil size={14} />
                        </button>
                        <button
                          className="chat_action_btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(chat._id);
                          }}
                          title="Delete"
                        >
                          <BsTrash size={14} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })
        ) : (
          <p className="no_chats_message">
            {normalizedSearchTerm ? "No matching conversations" : "No conversations yet"}
          </p>
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
