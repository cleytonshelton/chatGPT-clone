import { fireEvent, render, screen } from "@testing-library/react";
import Chat from "./Chat";

describe("Chat integration", () => {
  it("shows the empty-state logo and prompt when there are no messages", () => {
    render(
      <Chat
        messages={[]}
        onSendMessage={jest.fn()}
        onForkConversation={jest.fn()}
        onEditMessage={jest.fn()}
        searchTerm=""
        loading={false}
        sidebarOpen={true}
        onToggleSidebar={jest.fn()}
      />
    );

    expect(screen.getByText("ChatGPT")).toBeInTheDocument();
    expect(screen.getByText("Start a conversation")).toBeInTheDocument();
    expect(screen.getByText("Start a conversation...")).toBeInTheDocument();
  });

  it("opens the sidebar from the chat area when collapsed", () => {
    const onToggleSidebar = jest.fn();
    render(
      <Chat
        messages={[]}
        onSendMessage={jest.fn()}
        onForkConversation={jest.fn()}
        onEditMessage={jest.fn()}
        searchTerm=""
        loading={false}
        sidebarOpen={false}
        onToggleSidebar={onToggleSidebar}
      />
    );

    fireEvent.click(screen.getByTitle("Open sidebar"));

    expect(onToggleSidebar).toHaveBeenCalledTimes(1);
  });

  it("submits a message through the embedded input", () => {
    const onSendMessage = jest.fn();
    render(
      <Chat
        messages={[{ role: "assistant", content: "Hello there" }]}
        onSendMessage={onSendMessage}
        onForkConversation={jest.fn()}
        onEditMessage={jest.fn()}
        searchTerm=""
        loading={false}
        sidebarOpen={true}
        onToggleSidebar={jest.fn()}
      />
    );

    const input = screen.getByPlaceholderText("Send a message ...");
    fireEvent.change(input, { target: { value: "Integrated send" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(onSendMessage).toHaveBeenCalledWith("Integrated send");
  });

  it("renders the typing indicator while loading a reply", () => {
    render(
      <Chat
        messages={[{ role: "assistant", content: "Working on it" }]}
        onSendMessage={jest.fn()}
        onForkConversation={jest.fn()}
        onEditMessage={jest.fn()}
        searchTerm=""
        loading={true}
        sidebarOpen={true}
        onToggleSidebar={jest.fn()}
      />
    );

    expect(screen.getByText("AI is thinking...")).toBeInTheDocument();
  });
});