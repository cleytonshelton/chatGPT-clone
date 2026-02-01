# ASE285_Individual_Project

## Project Title
**DialogLab** – A Context-Aware AI Conversation Workspace

---

## 1. Project Overview
**DialogLab** is a full-stack web application designed to explore how users interact with AI when conversations are treated as **structured workspaces rather than simple chat logs**. Instead of focusing on free-form chatting alone, this application emphasizes **context control, conversation analysis, and interaction feedback**.

The system is implemented using **React**, **Node.js with Express**, and **WebSocket-based messaging**, with AI responses powered by the OpenAI API. The project’s primary goal is to deepen understanding of **state management, real-time systems, and client-server coordination** in modern web applications.

---

## 2. Problem Statement
Most conversational AI tools operate as linear message streams with minimal visibility into how context evolves over time. Users cannot easily inspect, reuse, or refine conversations once they grow large, which limits their usefulness for learning, planning, and technical problem solving.

This project addresses that gap by creating a conversational platform where **conversations are organized, analyzable, and adjustable**, allowing users to better understand both their inputs and the AI’s responses.

---

## 3. Core Features and Deliverables

### Phase 1 – Foundation & Communication
- Real-time message exchange using WebSockets
- AI response generation via a secure backend API proxy
- Client-side persistence of conversations using IndexedDB
- Session-based conversation isolation
- Message metadata tracking (time, length, role)
- Connection status indicators (connected / reconnecting / offline)

### Phase 2 – Interaction Intelligence
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

- **Frontend (React)**
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

