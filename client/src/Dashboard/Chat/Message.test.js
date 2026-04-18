import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Message from "./Message";

describe("Message", () => {
  beforeEach(() => {
    navigator.clipboard = {
      writeText: jest.fn().mockResolvedValue(undefined),
    };
  });

  it("lets the user edit and save their own message", () => {
    const onEditMessage = jest.fn();
    render(
      <Message
        content="Original prompt"
        aiMessage={false}
        messageIndex={2}
        onEditMessage={onEditMessage}
      />
    );

    fireEvent.mouseEnter(screen.getByText("Original prompt").closest(".message_container"));
    fireEvent.click(screen.getByTitle("Edit message"));

    const editor = screen.getByDisplayValue("Original prompt");
    fireEvent.change(editor, { target: { value: "  Updated prompt  " } });
    fireEvent.keyDown(editor, { key: "Enter", code: "Enter" });

    expect(onEditMessage).toHaveBeenCalledWith(2, "Updated prompt");
  });

  it("cancels editing on escape", () => {
    const onEditMessage = jest.fn();
    render(
      <Message
        content="Original prompt"
        aiMessage={false}
        messageIndex={0}
        onEditMessage={onEditMessage}
      />
    );

    fireEvent.mouseEnter(screen.getByText("Original prompt").closest(".message_container"));
    fireEvent.click(screen.getByTitle("Edit message"));

    const editor = screen.getByDisplayValue("Original prompt");
    fireEvent.change(editor, { target: { value: "Changed" } });
    fireEvent.keyDown(editor, { key: "Escape", code: "Escape" });

    expect(onEditMessage).not.toHaveBeenCalled();
    expect(screen.getByText("Original prompt")).toBeInTheDocument();
  });

  it("lets the user copy a message", async () => {
    render(<Message content="Copy me" aiMessage={false} messageIndex={0} />);

    fireEvent.mouseEnter(screen.getByText("Copy me").closest(".message_container"));
    fireEvent.click(screen.getByTitle("Copy message"));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Copy me");
    });
  });

  it("lets the user fork an assistant answer", () => {
    const onForkConversation = jest.fn();
    render(
      <Message
        content="Assistant response"
        aiMessage={true}
        messageIndex={4}
        onForkConversation={onForkConversation}
      />
    );

    fireEvent.mouseEnter(screen.getByText("Assistant response").closest(".message_container"));
    fireEvent.click(screen.getByTitle("Fork conversation from this answer"));

    expect(onForkConversation).toHaveBeenCalledWith(4);
  });

  it("highlights the active search term", () => {
    render(
      <Message
        content="Ada Lovelace wrote the first algorithm"
        aiMessage={true}
        messageIndex={0}
        searchTerm="Ada"
      />
    );

    expect(screen.getByText("Ada").tagName).toBe("MARK");
  });
});