# Integration Tests

## Summary
- Category: Integration
- Total test files: 2
- Total tests: 14

## Test Files
- `client/src/Dashboard/Chat/Chat.integration.test.js`
- `server/tests/chatRoutes.integration.test.js`

## Tests
### client/src/Dashboard/Chat/Chat.integration.test.js (4)
1. shows the empty-state logo and prompt when there are no messages
2. opens the sidebar from the chat area when collapsed
3. submits a message through the embedded input
4. renders the typing indicator while loading a reply

### server/tests/chatRoutes.integration.test.js (10)
1. rejects empty message requests
2. creates a chat and returns a demo assistant reply
3. creates a chat directly and derives the title from the first message when needed
4. branches from an assistant message
5. rejects branching from a user message
6. lists chats in descending order
7. returns 404 for unknown chats
8. toggles a pinned chat
9. updates a chat title
10. deletes a chat
