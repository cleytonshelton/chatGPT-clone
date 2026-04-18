# ChatGPT Clone

A full-stack ChatGPT-style app built for ASE285 with multi-chat workflows, conversation branching, search, export, and theme customization.

[Live Demo](https://cleytonshelton.github.io/chatGPT-clone/) | [Project Board Docs](docs/PPP/ppp/ppp.md) | [Test Documentation](docs/tests)

## Snapshot

| Category | Details |
| --- | --- |
| Frontend | React 18, React Icons, React Testing Library |
| Backend | Node.js, Express 5 |
| Database | MongoDB with Mongoose |
| AI Providers | OpenAI, Hugging Face, Ollama, Demo mode |
| Testing | Jest, React Testing Library, Supertest |

## Why This Project

Most chat demos only handle a single thread. This project focuses on conversation management features that are useful in real workflows:

- Multiple saved chats with pin, rename, and delete actions
- Branching from any assistant message to explore alternatives
- Search across conversation titles and message content
- Export to Markdown and JSON with timestamps
- Message editing with regenerated assistant responses

## Feature Map

### Conversation Management
- Create, switch, rename, pin, and delete chats
- Keep chat history in MongoDB for persistence
- Sort and organize chats from the sidebar

### Branching and Editing
- Fork a new chat from an assistant response
- Track parent-child chat relationships
- Edit older user messages and regenerate continuation

### Search and Export
- Search title and message text
- Highlight query matches and show preview snippets
- Export conversations as Markdown or JSON files

### UX and Accessibility
- Light/dark theme toggle with local persistence
- Sidebar collapse/expand
- Keyboard shortcuts for common actions

## Architecture

```text
client (React)
	-> sends chat actions and prompts
	-> renders sidebar, message stream, search, and exports

server (Express)
	-> validates requests
	-> routes provider calls (OpenAI/HF/Ollama/demo)
	-> persists chats/messages via Mongoose

mongo (MongoDB)
	-> stores chat documents with embedded messages
```

Core entry points:

- Frontend shell: [client/src/App.js](client/src/App.js)
- Frontend chat orchestration: [client/src/Dashboard/Dashboard.js](client/src/Dashboard/Dashboard.js)
- API setup: [server/app.js](server/app.js)
- Chat routes: [server/routes/chatRoutes.js](server/routes/chatRoutes.js)
- Chat model: [server/models/Chat.js](server/models/Chat.js)

## Data Model

Chat documents store ordered messages and branch metadata.

- title: Sidebar display name
- messages: Array of user/assistant messages
- pinned: Priority flag for sidebar ordering
- parentChatId: Parent chat reference for branches
- branchedFromMessageIndex: Source message index used to branch
- createdAt and updatedAt: Automatic timestamps

## Run Locally

### Prerequisites
- Node.js 18+
- npm
- MongoDB instance

### 1) Install dependencies

```bash
npm install
npm install --prefix client
npm install --prefix server
```

### 2) Configure server environment

Create [server/.env](server/.env) with values like:

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

Supported AI_PROVIDER values: demo, openai, hf, ollama

### 3) Start both apps

```bash
npm run dev
```

Default local URLs:

- Client: http://localhost:3000
- Server: http://localhost:5000

### Run separately

```bash
npm run server
npm run client
```

## Testing

Run all tests from the root:

```bash
npm test
```

Test summaries by category are documented in [docs/tests](docs/tests).

## Keyboard Shortcuts

Use Ctrl on Windows/Linux or Cmd on macOS.

- Ctrl/Cmd + Shift + N: Start a new chat
- Ctrl/Cmd + Shift + F: Branch from latest assistant response
- Ctrl/Cmd + Shift + E: Export current chat as Markdown
- Ctrl/Cmd + Shift + J: Export current chat as JSON
- Ctrl/Cmd + Shift + R: Rename current chat
- Ctrl/Cmd + Shift + B: Toggle sidebar
- Ctrl/Cmd + Shift + L: Toggle theme
- Ctrl/Cmd + K: Open search

## GitHub Pages

This repository deploys the React client to:

- https://cleytonshelton.github.io/chatGPT-clone/

Note: GitHub Pages only hosts the frontend. The backend API must be deployed separately and configured in the client for full chat functionality in production.

## Author

Cleyton Shelton

