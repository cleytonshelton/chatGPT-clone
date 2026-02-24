import React, { useContext } from "react";
import NewChatButton from "./NewChatButton";
import ListItem from "./ListItem";
import DeleteConversationsButton from "./DeleteConversationsButton";
import { ThemeContext } from "../../ThemeContext";
import { BsSun, BsMoon } from "react-icons/bs";

const Sidebar = ({ onNewChat }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div className="sidebar_container">
      <NewChatButton onClick={onNewChat} />
      <div className="sidebar_conversations">
        <ListItem title="History 1" />
        <ListItem title="Test" />
        <ListItem title="Truck" />
      </div>
      <div className="sidebar_footer">
        <DeleteConversationsButton />
        <button className="theme_toggle_button" onClick={toggleTheme} title="Toggle theme">
          {theme === "light" ? <BsMoon size={18} /> : <BsSun size={18} />}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
