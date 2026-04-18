# Unit Tests

## Summary
- Category: Unit
- Total test files: 4
- Total tests: 27

## Test Files
- `client/src/Dashboard/Chat/Message.test.js`
- `client/src/Dashboard/Chat/NewMessageInput.test.js`
- `client/src/Dashboard/Sidebar/Sidebar.test.js`
- `client/src/utils/chatFormatting.test.js`

## Tests
### client/src/Dashboard/Chat/Message.test.js (5)
1. lets the user edit and save their own message
2. cancels editing on escape
3. lets the user copy a message
4. lets the user fork an assistant answer
5. highlights the active search term

### client/src/Dashboard/Chat/NewMessageInput.test.js (5)
1. submits a message with the send button
2. submits a message with enter
3. submits with enter and not with shift-enter
4. does not submit blank messages
5. disables the input while loading

### client/src/Dashboard/Sidebar/Sidebar.test.js (6)
1. starts a new chat when the new chat button is clicked
2. opens search with the keyboard shortcut and clears it on escape
3. filters chats and shows a message preview for search results
4. lets the user rename a conversation
5. lets the user pin and delete a conversation from the actions menu
6. toggles the theme from the footer button

### client/src/utils/chatFormatting.test.js (11)
1. builds question-style titles for person lookups
2. builds a keyword-based title when no question pattern matches
3. builds a height title for how tall prompts
4. falls back to New Chat when no useful words exist
5. sanitizes filenames for exports
6. extracts a timestamp from a valid object id
7. returns null for invalid object ids
8. prefers explicit message createdAt values
9. creates an export payload with resolved timestamps
10. renders markdown exports
11. uses fallback titles when exporting incomplete chats
