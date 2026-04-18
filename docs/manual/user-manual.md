---
marp: true
size: 4:3
paginate: true
title: ChatGPT Clone
---

# ChatGPT Clone User Manual

## 1. Overview

This user manual explains how to use the ChatGPT Clone web app.

The app lets you:
- Start and manage multiple conversations
- Send prompts and get AI responses
- Edit previous user messages and regenerate responses
---
- Branch a conversation from an assistant reply
- Search conversations by title and message content
- Pin, rename, delete, and export conversations
- Switch between built-in visual themes
---
## 2. Accessing the App

### Live site
- Open: https://cleytonshelton.github.io/chatGPT-clone/

Note: The live frontend needs a running backend API to generate real responses.

### Run locally
1. Install dependencies from the project root:

```bash
npm install
npm install --prefix client
npm install --prefix server
```

2. Create server environment file at `server/.env` with values like:

```env
MONGO_URI=your_mongodb_connection_string
AI_PROVIDER=demo

OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4

HF_API_KEY=your_huggingface_key
HF_MODEL=gpt2

OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=gpt-4
```

3. Start the app (client + server):

```bash
npm run dev
```

4. Open:
- Client: http://localhost:3000
- Server API: http://localhost:5000

## 3. Interface Tour

### Sidebar (left)
- New chat button
- Search button and search input
- Conversation list
- Conversation actions menu (three dots)
- Theme menu at the bottom

### Chat panel (right)
- Message history
- Per-message action buttons on hover
- New message input and send button

## 4. Common Tasks

### 4.1 Start a new conversation
1. Click **New Chat** in the sidebar.
2. Type your prompt in the input field.
3. Press **Enter** (or click the send button).

What happens:
- A conversation is created automatically on first message.
- The conversation title is auto-generated from your prompt.

### 4.2 Open an existing conversation
1. In the sidebar, click a conversation title.
2. The full message history loads in the chat panel.

### 4.3 Edit a previous user message
1. Hover over one of your (user) messages.
2. Click the pencil icon.
3. Update the text.
4. Press **Enter** to save (or click **Save**).

Result:
- The conversation is regenerated from that edited point.
- Older continuation after that point is replaced.

### 4.4 Branch from an assistant response
1. Hover over an assistant message.
2. Click the fork icon.

Result:
- A new conversation is created from that assistant message.
- The branch appears in the sidebar (for example: "Original Title - Branch 1").

### 4.5 Search conversations
1. Click the search icon in the sidebar (or use the shortcut in section 6).
2. Enter a search term.

Search behavior:
- Matches conversation titles and message text.
- Matching text is highlighted.
- A preview snippet appears for message-content matches.

### 4.6 Pin or unpin a conversation
1. Open a conversation's three-dot menu.
2. Click **Pin** or **Unpin**.

Behavior:
- Pinned conversations appear at the top under **Pinned**.

### 4.7 Rename a conversation
1. Open the three-dot menu for the conversation.
2. Click **Edit title**.
3. Enter a new title and press **Enter**.

Alternative:
- Use keyboard shortcut for renaming the currently open conversation (section 6).

### 4.8 Delete a conversation
1. Open the three-dot menu.
2. Click **Delete conversation**.

Important:
- Deletion is permanent and removes that chat from the database.

### 4.9 Export a conversation
1. Open the three-dot menu.
2. Choose:
- **Export as Markdown** (`.md`)
- **Export as JSON** (`.json`)

Export includes:
- Chat ID
- Title
- Export timestamp
- Message list with role, content, and timestamps when available

## 5. Themes

Use the theme menu at the bottom of the sidebar.

Available themes:
- Light
- Dark
- Ocean
- Sunset
- Forest

Notes:
- Your selected theme is saved in browser local storage.
- Theme is restored automatically on next visit in the same browser.

## 6. Keyboard Shortcuts

Use **Ctrl** on Windows/Linux or **Cmd** on macOS.

- Ctrl/Cmd + Shift + N: New chat
- Ctrl/Cmd + Shift + F: Branch from latest assistant response
- Ctrl/Cmd + Shift + E: Export current chat as Markdown
- Ctrl/Cmd + Shift + J: Export current chat as JSON
- Ctrl/Cmd + Shift + R: Rename current chat
- Ctrl/Cmd + Shift + B: Toggle sidebar
- Ctrl/Cmd + Shift + L: Cycle theme
- Ctrl/Cmd + K: Open search
- Esc (while search is open): Clear and close search

## 7. Tips for Best Results

- Start each topic in a new chat for cleaner organization.
- Pin important chats so they stay easy to find.
- Use branch when exploring alternative answers.
- Rename chats early to make search more effective.
- Export key conversations for sharing or records.

## 8. Troubleshooting

### No AI response appears
Check:
- Server is running on port 5000
- `server/.env` exists and is valid
- `AI_PROVIDER` is configured

Quick fallback:
- Set `AI_PROVIDER=demo` to verify end-to-end flow without external AI keys.

### Conversations do not persist
Check:
- `MONGO_URI` points to a reachable MongoDB instance
- Server logs for database connection errors

### Search finds nothing
Check:
- Correct spelling and partial words
- Whether the conversation contains the term in title or message text

### Theme does not stay after refresh
Check:
- Browser local storage is enabled
- You are using the same browser/profile

## 9. Data and Privacy Notes

- Conversations are stored in MongoDB used by your server configuration.
- Exported files are downloaded to your local machine.
- API keys should be kept only in server environment variables, not in client code.

## 10. Quick Start Checklist

1. Start app with `npm run dev`
2. Open http://localhost:3000
3. Create a new chat and send a prompt
4. Test search, pin, rename, and export actions
5. Pick your preferred theme
