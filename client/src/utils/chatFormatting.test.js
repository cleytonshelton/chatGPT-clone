import {
  buildKeywordTitle,
  getObjectIdTimestamp,
  getQuestionStyleTitle,
  resolveMessageTimestamp,
  sanitizeFilename,
  toMarkdownExport,
  toExportPayload,
} from "./chatFormatting";

describe("chatFormatting", () => {
  it("builds question-style titles for person lookups", () => {
    expect(getQuestionStyleTitle("Who is ada lovelace?")) .toBe("Ada Lovelace");
  });

  it("builds a keyword-based title when no question pattern matches", () => {
    expect(buildKeywordTitle("please help me debug react state updates")).toBe("Debug React State Updates");
  });

  it("builds a height title for how tall prompts", () => {
    expect(getQuestionStyleTitle("How tall is mount everest?")) .toBe("Is Mount Everest Height");
  });

  it("falls back to New Chat when no useful words exist", () => {
    expect(buildKeywordTitle("??")).toBe("New Chat");
  });

  it("sanitizes filenames for exports", () => {
    expect(sanitizeFilename("My: Invalid / Chat?")) .toBe("my-invalid-chat");
  });

  it("extracts a timestamp from a valid object id", () => {
    const timestamp = getObjectIdTimestamp("507f1f77bcf86cd799439011");

    expect(timestamp).toBeInstanceOf(Date);
    expect(timestamp.toISOString()).toContain("2012-10-17T");
  });

  it("returns null for invalid object ids", () => {
    expect(getObjectIdTimestamp("invalid-id")).toBeNull();
  });

  it("prefers explicit message createdAt values", () => {
    const timestamp = resolveMessageTimestamp(
      { createdAt: "2025-01-01T00:00:00.000Z" },
      "2024-01-01T00:00:00.000Z"
    );

    expect(timestamp.toISOString()).toBe("2025-01-01T00:00:00.000Z");
  });

  it("creates an export payload with resolved timestamps", () => {
    const payload = toExportPayload({
      _id: "507f1f77bcf86cd799439011",
      title: "History",
      createdAt: "2024-03-10T10:00:00.000Z",
      messages: [
        { _id: "507f1f77bcf86cd799439012", role: "user", content: "Hello" },
      ],
    });

    expect(payload.title).toBe("History");
    expect(payload.messages).toHaveLength(1);
    expect(payload.messages[0]).toMatchObject({
      role: "user",
      content: "Hello",
    });
    expect(payload.messages[0].timestamp).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it("renders markdown exports", () => {
    const markdown = toMarkdownExport({
      _id: "chat-1",
      title: "Sprint Review",
      messages: [{ role: "assistant", content: "Summary" }],
    });

    expect(markdown).toContain("# Sprint Review");
    expect(markdown).toContain("## Messages");
    expect(markdown).toContain("### 1. assistant");
    expect(markdown).toContain("Summary");
  });

  it("uses fallback titles when exporting incomplete chats", () => {
    const payload = toExportPayload({ messages: [] });

    expect(payload.title).toBe("Conversation");
    expect(payload.messages).toEqual([]);
  });
});