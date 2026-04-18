import React, { useContext, useEffect, useRef, useState } from "react";
import NewChatButton from "./NewChatButton";
import { ThemeContext } from "../../ThemeContext";
import { BsSun, BsMoon, BsChevronLeft, BsSearch, BsX, BsThreeDots, BsPin, BsPinFill } from "react-icons/bs";

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

const sanitizeFilename = (value = "conversation") =>
  String(value)
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .slice(0, 60) || "conversation";

const getObjectIdTimestamp = (id) => {
  if (typeof id !== "string" || !/^[a-fA-F0-9]{24}$/.test(id)) {
    return null;
  }

  const unixSeconds = parseInt(id.slice(0, 8), 16);
  if (!Number.isFinite(unixSeconds)) {
    return null;
  }

  return new Date(unixSeconds * 1000);
};

const resolveMessageTimestamp = (message, chatCreatedAt) => {
  if (message?.createdAt) {
    return new Date(message.createdAt);
  }

  const objectIdTimestamp = getObjectIdTimestamp(message?._id);
  if (objectIdTimestamp) {
    return objectIdTimestamp;
  }

  if (chatCreatedAt) {
    return new Date(chatCreatedAt);
  }

  return null;
};

const toExportPayload = (chat) => ({
  chatId: chat?._id,
  title: chat?.title || "Conversation",
  createdAt: chat?.createdAt || null,
  updatedAt: chat?.updatedAt || null,
  exportedAt: new Date().toISOString(),
  messages: Array.isArray(chat?.messages)
    ? chat.messages.map((message, index) => ({
        index,
        role: message?.role || "unknown",
        content: message?.content || "",
        timestamp: resolveMessageTimestamp(message, chat?.createdAt)?.toISOString() || null,
      }))
    : [],
});

const toMarkdownExport = (chat) => {
  const payload = toExportPayload(chat);
  const lines = [
    `# ${payload.title}`,
    "",
    `- Chat ID: ${payload.chatId || "N/A"}`,
    `- Exported At: ${payload.exportedAt}`,
    "",
    "## Messages",
    "",
  ];

  payload.messages.forEach((message, index) => {
    lines.push(`### ${index + 1}. ${message.role}`);
    lines.push("");
    lines.push(`- Timestamp: ${message.timestamp || "N/A"}`);
    lines.push("");
    lines.push(message.content || "");
    lines.push("");
  });

  return lines.join("\n");
};


const downloadFile = ({ filename, content, type }) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const Sidebar = ({ 
  onNewChat, 
  chats = [],
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onPinChat,
  currentChatId,
  searchTerm = "",
  onSearchChange,
  sidebarOpen,
  onToggleSidebar
}) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [activeMenuChatId, setActiveMenuChatId] = useState(null);
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

  useEffect(() => {
    const handleClickOutsideMenu = (event) => {
      if (!event.target.closest(".chat_menu_container")) {
        setActiveMenuChatId(null);
      }
    };

    window.addEventListener("mousedown", handleClickOutsideMenu);

    return () => {
      window.removeEventListener("mousedown", handleClickOutsideMenu);
    };
  }, []);

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
  const filteredChats = normalizedSearchTerm
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

  const pinnedChats = filteredChats.filter((c) => c.pinned);
  const unpinnedChats = filteredChats.filter((c) => !c.pinned);
  const visibleChats = [...pinnedChats, ...unpinnedChats];

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

  const handleToggleChatMenu = (chatId) => {
    setActiveMenuChatId((previousMenuChatId) =>
      previousMenuChatId === chatId ? null : chatId
    );
  };

  const handleExportChat = (chat, format) => {
    if (!chat?._id) {
      return;
    }

    const dateSuffix = new Date().toISOString().slice(0, 10);
    const baseName = `${sanitizeFilename(chat.title)}-${dateSuffix}`;

    if (format === "json") {
      downloadFile({
        filename: `${baseName}.json`,
        content: JSON.stringify(toExportPayload(chat), null, 2),
        type: "application/json;charset=utf-8",
      });
      return;
    }

    downloadFile({
      filename: `${baseName}.md`,
      content: toMarkdownExport(chat),
      type: "text/markdown;charset=utf-8",
    });
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
          visibleChats.map((chat, index) => {
            const matchPreview = normalizedSearchTerm
              ? getChatMatchPreview(chat, searchTerm)
              : "";

            const isPinned = Boolean(chat.pinned);
            const showPinnedLabel = !normalizedSearchTerm && isPinned && index === 0;
            const showOtherLabel = !normalizedSearchTerm && !isPinned && pinnedChats.length > 0 && index === pinnedChats.length;

            return (
              <React.Fragment key={chat._id}>
                {showPinnedLabel && (
                  <div className="sidebar_section_label">Pinned</div>
                )}
                {showOtherLabel && (
                  <div className="sidebar_section_label">Conversations</div>
                )}
              <div
                className={`chat_history_item ${currentChatId === chat._id ? 'active' : ''} ${normalizedSearchTerm ? 'search_result' : ''} ${isPinned ? 'pinned' : ''}`}
                onClick={() => {
                  if (editingId !== chat._id) {
                    setActiveMenuChatId(null);
                    onSelectChat(chat);
                  }
                }}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && editingId !== chat._id) {
                    e.preventDefault();
                    setActiveMenuChatId(null);
                    onSelectChat(chat);
                  }
                }}
                role="button"
                tabIndex={0}
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
                        {isPinned && <BsPinFill size={11} className="chat_pin_icon" />}
                        {renderHighlightedText(chat.title, searchTerm)}
                      </div>
                      {normalizedSearchTerm && Boolean(matchPreview) && (
                        <div className="chat_history_match_preview" title={matchPreview}>
                          {renderHighlightedText(matchPreview, searchTerm)}
                        </div>
                      )}
                    </div>
                    <div className="chat_menu_container">
                      <button
                        className="chat_menu_button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleChatMenu(chat._id);
                        }}
                        title="Conversation actions"
                        aria-label="Conversation actions"
                        aria-expanded={activeMenuChatId === chat._id}
                      >
                        <BsThreeDots size={16} />
                      </button>
                      {activeMenuChatId === chat._id && (
                        <div
                          className="chat_menu_dropdown"
                          role="menu"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="chat_menu_item"
                            onClick={() => {
                              onPinChat?.(chat._id);
                              setActiveMenuChatId(null);
                            }}
                            title={isPinned ? "Unpin conversation" : "Pin conversation"}
                          >
                            {isPinned ? <BsPin size={13} /> : <BsPinFill size={13} />}
                            {isPinned ? "Unpin" : "Pin"}
                          </button>
                          <button
                            className="chat_menu_item"
                            onClick={() => {
                              handleExportChat(chat, "md");
                              setActiveMenuChatId(null);
                            }}
                            title="Export as Markdown"
                          >
                            Export as Markdown
                          </button>
                          <button
                            className="chat_menu_item"
                            onClick={() => {
                              handleExportChat(chat, "json");
                              setActiveMenuChatId(null);
                            }}
                            title="Export as JSON"
                          >
                            Export as JSON
                          </button>
                          <button
                            className="chat_menu_item"
                            onClick={() => {
                              handleRenameStart(chat);
                              setActiveMenuChatId(null);
                            }}
                            title="Rename conversation"
                          >
                            Edit title
                          </button>
                          <button
                            className="chat_menu_item danger"
                            onClick={() => {
                              onDeleteChat(chat._id);
                              setActiveMenuChatId(null);
                            }}
                            title="Delete conversation"
                          >
                            Delete conversation
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              </React.Fragment>
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
