# ChatGPT Clone

## Project Overview

This project is a full-stack ChatGPT-style application built as an individual ASE285 project. It gives users a structured way to manage AI conversations by supporting multiple chats, persistent storage, branching, search, export, and theme customization.

The README is aligned with the PPP documents and the current codebase, which uses React on the frontend, Express on the backend, and MongoDB with Mongoose for persistence.

## Tech Stack

- Frontend: React 18
- Backend: Node.js and Express 5
- Database: MongoDB
- ODM: Mongoose
- AI integration: OpenAI SDK with configurable provider support for OpenAI, Hugging Face, Ollama, or demo mode
- Testing: Jest, React Testing Library, Supertest

## PPP Features Reflected in This Project

### AI Response Generation
- Sends user prompts from the React client to the Express API.
- Uses the backend as a secure proxy to the configured AI provider.
- Keeps API keys out of the frontend.

### Conversation Persistence
- Stores chats and messages in MongoDB.
- Reloads saved conversations when the application starts.
- Preserves message order and chat history for each conversation.

### Multi-Conversation Management
- Create a new chat.
- Switch between existing chats.
- Rename chats.
- Delete chats.
- Pin chats in the sidebar.

### Conversation Branching
- Create a new conversation from an assistant response in an existing chat.
- Track the parent chat relationship.
- Record which message index the branch came from.

### Conversation Search and Highlighting
- Search through conversation titles and message content.
- Highlight matched text in the sidebar results.
- Show preview snippets for matching messages.

### Exporting Conversations
- Export a chat as Markdown.
- Export a chat as JSON.
- Include message order and timestamps in exported output.

### Theme and Interface Customization
- Toggle between light and dark mode.
- Save theme preference in local storage.
- Collapse and expand the sidebar.
- Use keyboard shortcuts for common actions.

### Message Editing and Regeneration
- Edit an earlier user message.
- Remove later messages from that point.
- Generate a new assistant reply based on the edited input.

## Architecture

### Frontend
- React UI in [client/src/App.js](client/src/App.js) and [client/src/Dashboard/Dashboard.js](client/src/Dashboard/Dashboard.js)
- Handles active chat state, exports, search, branching actions, and theme toggling

### Backend
- Express app in [server/app.js](server/app.js)
- Chat routes in [server/routes/chatRoutes.js](server/routes/chatRoutes.js)
- Supports chat creation, updates, branching, pinning, title edits, deletion, and AI message generation

### Database Layer
- MongoDB connection starts in [server/index.js](server/index.js)
- Mongoose schema is defined in [server/models/Chat.js](server/models/Chat.js)

## Data Model

The app uses a `Chat` document with embedded `messages`.

### Chat
- `title`: conversation name shown in the sidebar
- `messages`: ordered array of embedded messages
- `pinned`: boolean flag for keeping important chats at the top
- `parentChatId`: reference to the original chat when a branch is created
- `branchedFromMessageIndex`: message index used as the branch point
- `createdAt` and `updatedAt`: automatic timestamps

### Message
- `role`: `user` or `assistant`
- `content`: message text
- `createdAt` and `updatedAt`: automatic timestamps

This data model supports the PPP requirements by preserving persistent conversation history, enabling chat organization, and recording branch relationships between related chats.

## Running the App Locally

### Prerequisites
- Node.js 18 or newer
- npm
- A MongoDB instance

### Environment Setup

Create a `.env` file inside the `server` folder. Typical variables are:

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

Supported `AI_PROVIDER` values are `demo`, `openai`, `hf`, and `ollama`.

### Install Dependencies

From the project root:

```bash
npm install
npm install --prefix client
npm install --prefix server
```

### Run Client and Server Together

From the project root:

```bash
npm run dev
```

This starts:
- Client on `http://localhost:3000`
- Server on `http://localhost:5000`

### Run Separately

Server:

```bash
npm run server
```

Client:

```bash
npm run client
```

## Testing

Run all tests from the project root:

```bash
npm test
```

The repository includes client component tests and server integration tests.

## Keyboard Shortcuts

Use `Ctrl` on Windows/Linux or `Cmd` on macOS.

- `Ctrl/Cmd + Shift + N`: start a new chat
- `Ctrl/Cmd + Shift + F`: branch from the most recent assistant response
- `Ctrl/Cmd + Shift + E`: export current chat as Markdown
- `Ctrl/Cmd + Shift + J`: export current chat as JSON
- `Ctrl/Cmd + Shift + R`: rename the current chat
- `Ctrl/Cmd + Shift + B`: toggle the sidebar
- `Ctrl/Cmd + Shift + L`: toggle theme
- `Ctrl/Cmd + K`: open conversation search

## Author

- Cleyton Shelton

---

