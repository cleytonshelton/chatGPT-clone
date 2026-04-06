# ASE285_Individual_Project

## Project Title
**ChatGPT Clone**

---

## Running the App Locally

### Prerequisites
- Node.js 18+
- npm

### Install Dependencies
Run these commands once:

```bash
npm install
npm install --prefix client
npm install --prefix server
```

### Run Client + Server Together (One Terminal)
From the project root:

```bash
npm run dev
```

This starts:
- server on `http://localhost:5000`
- client on `http://localhost:3000`

### Run Separately (Two Terminals)
Terminal 1 (server):

```bash
npm run server
```

Terminal 2 (client):

```bash
npm run client
```

### Troubleshooting
If you see `Something is already running on port 3000`, stop the process using that port and re-run `npm run dev`.

---

## 1. Project Overview
This project is a full-stack ChatGPT clone that replicates the core functionality of OpenAI's ChatGPT interface. Users can create and manage multiple conversations, send messages to the Ollama AI, and receive AI-generated responses in real time. Conversations are stored persistently so they survive page reloads, and users can delete individual chats or clear all history. The app features a sidebar for navigating between conversations and a clean chat interface similar to ChatGPT's, built with plain JavaScript on the frontend and Node.js with Express on the backend.

---

## 2. Problem Statement
Most conversational AI tools operate as linear message streams with minimal visibility into how context evolves over time. Users cannot easily inspect, reuse, or refine conversations once they grow large, which limits their usefulness for learning, planning, and technical problem solving.

This project addresses that gap by creating a conversational platform where **conversations are organized, analyzable, and adjustable**, allowing users to better understand both their inputs and the AI’s responses.

---

## 3. Core Features and Deliverables

### Sprint 1 – Foundation & Communication
- Real-time message exchange using WebSockets
- AI response generation via a secure backend API proxy
- Client-side persistence of conversations using IndexedDB
- Session-based conversation isolation
- Message metadata tracking (time, length, role)
- Connection status indicators (connected / reconnecting / offline)

### Sprint 2 – Interaction Intelligence
- AI-assisted conversation labeling based on detected topic
- Inline message evaluation (helpful / unclear flags)
- Keyword-based message highlighting
- Markdown and code block rendering
- Export conversations as structured JSON or Markdown

---

## 4. System Requirements

### Functional Requirements
- Users can create, fork, and delete conversations
- Messages are delivered in real time with low latency
- Conversation history persists across browser reloads

### Non-Functional Requirements
- Average AI response latency under **3 seconds**
- Automatic WebSocket reconnection on failure
- UI adapts to multiple screen sizes
- Backend ensures API keys are never exposed to the client

---

## 5. Architecture and Data Design

### Architecture Overview
The application follows a modular client-server design:

- **Frontend (JavaScript)**
  - Manages conversation state, rendering, and user controls
  - Stores persistent data locally using IndexedDB

- **Backend (Node.js + Express)**
  - Handles authentication of AI requests
  - Controls prompt construction and context window logic

- **Real-Time Layer**
  - WebSockets handle bidirectional message delivery and status updates

---

### Data Model
- **UserSession**: Stores user preferences and references to active conversation threads.
- **ChatThread**: Identified by a unique identifier, includes a label and an ordered collection of messages.
- **ChatMessage**: Represents an individual exchange, including author (user or assistant), timestamp, and message body.

---

## 6. Testing and Validation

- **Manual Validation**
  - Verify conversation branching and context limits
  - Test persistence and recovery scenarios

- **Performance Evaluation**
  - Measure response times under multiple active conversations
  - Lighthouse accessibility and performance audits

---

## 7. Individual Contribution
- **Cleyton Shelton** – Design, implementation, and testing of all system components

---

