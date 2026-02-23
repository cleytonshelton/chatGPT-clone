import React from "react";
import NewChatButton from "./NewChatButton";
import ListItem from "./ListItem";
import DeleteConversationsButton from "./DeleteConversationsButton";

const Sidebar = ({ onNewChat }) => {
  return (
    <div className="sidebar_container">
      <NewChatButton onClick={onNewChat} />
      <ListItem title="History 1" />
      <ListItem title="Test" />
      <ListItem title="Truck" />
      <DeleteConversationsButton />
    </div>
  );
};

export default Sidebar;
