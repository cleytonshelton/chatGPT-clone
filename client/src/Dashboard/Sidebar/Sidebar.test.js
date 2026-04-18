import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import Sidebar from "./Sidebar";
import { ThemeContext } from "../../ThemeContext";

function renderSidebar(props = {}, themeValue = {}) {
  const defaultProps = {
    onNewChat: jest.fn(),
    chats: [],
    onSelectChat: jest.fn(),
    onDeleteChat: jest.fn(),
    onRenameChat: jest.fn(),
    onPinChat: jest.fn(),
    currentChatId: null,
    searchTerm: "",
    onSearchChange: jest.fn(),
    sidebarOpen: true,
    onToggleSidebar: jest.fn(),
  };

  const value = {
    theme: "light",
    toggleTheme: jest.fn(),
    ...themeValue,
  };

  return render(
    <ThemeContext.Provider value={value}>
      <Sidebar {...defaultProps} {...props} />
    </ThemeContext.Provider>
  );
}

describe("Sidebar", () => {
  const chats = [
    {
      _id: "1",
      title: "Pinned Ada Chat",
      pinned: true,
      messages: [{ role: "assistant", content: "Ada is a mathematician" }],
    },
    {
      _id: "2",
      title: "Debug Session",
      pinned: false,
      messages: [{ role: "user", content: "Need help with state updates" }],
    },
  ];

  it("starts a new chat when the new chat button is clicked", () => {
    const onNewChat = jest.fn();
    renderSidebar({ onNewChat });

    fireEvent.click(screen.getByText("New Chat"));

    expect(onNewChat).toHaveBeenCalledTimes(1);
  });

  it("opens search with the keyboard shortcut and clears it on escape", async () => {
    const onSearchChange = jest.fn();
    renderSidebar({ onSearchChange });

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    const searchInput = screen.getAllByLabelText("Search conversations")[1];
    await waitFor(() => {
      expect(document.activeElement).toBe(searchInput);
    });

    fireEvent.keyDown(window, { key: "Escape", code: "Escape" });

    expect(onSearchChange).toHaveBeenCalledWith("");
  });

  it("filters chats and shows a message preview for search results", () => {
    renderSidebar({ chats, searchTerm: "mathematician" });

    expect(screen.getByText("Pinned Ada Chat")).toBeInTheDocument();
    expect(screen.getByTitle("Ada is a mathematician")).toBeInTheDocument();
    expect(screen.queryByText("Debug Session")).not.toBeInTheDocument();
  });

  it("lets the user rename a conversation", () => {
    const onRenameChat = jest.fn();
    renderSidebar({ chats, onRenameChat });

    fireEvent.click(screen.getAllByLabelText("Conversation actions")[0]);
    fireEvent.click(screen.getByText("Edit title"));

    const input = screen.getByDisplayValue("Pinned Ada Chat");
    fireEvent.change(input, { target: { value: "Renamed Chat" } });
    fireEvent.blur(input);

    expect(onRenameChat).toHaveBeenCalledWith("1", "Renamed Chat");
  });

  it("lets the user pin and delete a conversation from the actions menu", () => {
    const onPinChat = jest.fn();
    const onDeleteChat = jest.fn();
    renderSidebar({ chats, onPinChat, onDeleteChat });

    fireEvent.click(screen.getAllByLabelText("Conversation actions")[1]);
    const menu = screen.getByRole("menu");
    fireEvent.click(within(menu).getByText("Pin"));

    expect(onPinChat).toHaveBeenCalledWith("2");

    fireEvent.click(screen.getAllByLabelText("Conversation actions")[1]);
    fireEvent.click(screen.getByText("Delete conversation"));

    expect(onDeleteChat).toHaveBeenCalledWith("2");
  });

  it("toggles the theme from the footer button", () => {
    const toggleTheme = jest.fn();
    renderSidebar({ chats }, { theme: "light", toggleTheme });

    fireEvent.click(screen.getByTitle("Toggle theme"));

    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });
});