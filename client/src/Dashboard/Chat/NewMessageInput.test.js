import { fireEvent, render, screen } from "@testing-library/react";
import NewMessageInput from "./NewMessageInput";

const getSendControl = () => document.querySelector(".new_message_icon_container");

describe("NewMessageInput", () => {
  it("submits a message with the send button", () => {
    const onSendMessage = jest.fn();
    render(<NewMessageInput onSendMessage={onSendMessage} loading={false} />);

    const input = screen.getByPlaceholderText("Send a message ...");
    fireEvent.change(input, {
      target: { value: "Click send" },
    });
    fireEvent.click(getSendControl());

    expect(onSendMessage).toHaveBeenCalledWith("Click send");
    expect(input).toHaveValue("");
  });

  it("submits a message with enter", () => {
    const onSendMessage = jest.fn();
    render(<NewMessageInput onSendMessage={onSendMessage} loading={false} />);

    const input = screen.getByPlaceholderText("Send a message ...");
    fireEvent.change(input, {
      target: { value: "  Hello test  " },
    });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(onSendMessage).toHaveBeenCalledWith("  Hello test  ");
    expect(input).toHaveValue("");
  });

  it("submits with enter and not with shift-enter", () => {
    const onSendMessage = jest.fn();
    render(<NewMessageInput onSendMessage={onSendMessage} loading={false} />);

    const input = screen.getByPlaceholderText("Send a message ...");
    fireEvent.change(input, { target: { value: "Enter message" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(onSendMessage).toHaveBeenCalledWith("Enter message");

    fireEvent.change(input, { target: { value: "Keep editing" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", shiftKey: true });

    expect(onSendMessage).toHaveBeenCalledTimes(1);
  });

  it("does not submit blank messages", () => {
    const onSendMessage = jest.fn();
    render(<NewMessageInput onSendMessage={onSendMessage} loading={false} />);

    fireEvent.keyDown(screen.getByPlaceholderText("Send a message ..."), {
      key: "Enter",
      code: "Enter",
    });

    expect(onSendMessage).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText("Send a message ...")).toHaveValue("");
  });

  it("disables the input while loading", () => {
    render(<NewMessageInput onSendMessage={jest.fn()} loading={true} />);

    expect(screen.getByPlaceholderText("Send a message ...")).toBeDisabled();
    expect(getSendControl()).toHaveStyle({ cursor: "not-allowed" });
  });
});