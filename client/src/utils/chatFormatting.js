export const TITLE_STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "you", "your", "are",
  "was", "were", "have", "has", "had", "but", "not", "about", "into", "can",
  "will", "just", "please", "help", "how", "what", "why", "when", "where",
  "who", "which", "is", "am", "do", "does", "did", "a", "an",
]);

export const toTitleCase = (word = "") => word.charAt(0).toUpperCase() + word.slice(1);

export const phraseToTitle = (value = "") =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => toTitleCase(word))
    .join(" ");

export const cleanPrompt = (message = "") =>
  String(message)
    .replace(/[?!.]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

export const cleanSubject = (value = "") =>
  String(value)
    .replace(/^(is|are|was|were)\s+/i, "")
    .replace(/^(a|an|the)\s+/i, "")
    .replace(/\s+(is|are|was|were)$/i, "")
    .replace(/\s+/g, " ")
    .trim();

export const getQuestionStyleTitle = (message = "") => {
  const prompt = cleanPrompt(message);
  const lowerPrompt = prompt.toLowerCase();

  const personMatch = lowerPrompt.match(/^(who\s+(is|was)\s+)(.+)$/i);
  if (personMatch) {
    const subject = cleanSubject(prompt.slice(personMatch[1].length));
    return subject ? phraseToTitle(subject) : "";
  }

  const heightMatch = lowerPrompt.match(/^how\s+tall\s+(.+)$/i);
  if (heightMatch) {
    const subject = cleanSubject(prompt.slice("how tall".length));
    return subject ? `${phraseToTitle(subject)} Height` : "";
  }

  return "";
};

export const buildKeywordTitle = (message = "") => {
  const fallback = "New Chat";
  const intentTitle = getQuestionStyleTitle(message);
  if (intentTitle) {
    return intentTitle;
  }

  const terms = String(message)
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean)
    .map((term) => term.replace(/^[^a-z0-9(]+|[^a-z0-9)+\-*/=%^().:]+$/gi, ""))
    .filter((term) => /[a-z0-9]/i.test(term));

  const filteredWords = terms.filter(
    (term) => term.length > 2 && !TITLE_STOP_WORDS.has(term.toLowerCase())
  );
  const sourceWords = filteredWords.length ? filteredWords : terms.filter((term) => term.length > 1);

  if (!sourceWords.length) {
    return fallback;
  }

  const uniqueWords = [...new Set(sourceWords)].slice(0, 4);
  return uniqueWords.map(toTitleCase).join(" ");
};

export const sanitizeFilename = (value = "conversation") =>
  String(value)
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .slice(0, 60) || "conversation";

export const getObjectIdTimestamp = (id) => {
  if (typeof id !== "string" || !/^[a-fA-F0-9]{24}$/.test(id)) {
    return null;
  }

  const unixSeconds = parseInt(id.slice(0, 8), 16);
  if (!Number.isFinite(unixSeconds)) {
    return null;
  }

  return new Date(unixSeconds * 1000);
};

export const resolveMessageTimestamp = (message, chatCreatedAt) => {
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

export const toExportPayload = (chat) => ({
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

export const toMarkdownExport = (chat) => {
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