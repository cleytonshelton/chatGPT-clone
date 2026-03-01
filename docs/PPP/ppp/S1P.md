---
marp: true
size: 4:3
paginate: true
title: ChatGPT Clone
---

## ASE285 Individual Project
### ChatGPT Clone
- By: Cleyton Shelton
  
---

## Project Metrics
-  Burndown rate: 4/9 (45%)
- 12/24 Requirements (50%)


---

## What Went Wrong

- Setting up the AI was hard for me, I haven't tried it before so it took me a little while to set up
- I was having trouble with the UI that would send a duplicate message of the users once the AI would respond

---

## What Went Well

- Getting the chats to save was easier than I thought
- Getting the UI theme to change
- Changing the conversation name

---

## Analysis & Improvement Plan

- Spend more time and have better planning week by week

---

## Week-by-Week Progress Summary

- Week 4: Set up github rep
- Week 5: Better planning and figuring out features
- Week 6: Conversation Managment: Switching between chats and allow users to edit chat names and delete chats
- Week 7: Set up an AI model, conversation persistence and the real time messaging system
- Week 8: Ran some testing and bug fixes

---

# Sprint 2 Plan

---

## Individual Progress - Cley Shelton

### Sprint 2 Schedule (Weeks 10-14)

---

### Week 10: Sprint 2 Planning + Conversation Branching

Define Sprint 2 goals, acceptance criteria, and task breakdown.

Implement conversation branching:
- Create a new chat from a selected previous message
- Maintain parent-child relationship between original and branch
- Verify branched conversation stays independent from original

---

### Week 11: Conversation Search and Highlighting

Add in-conversation keyword search:
- Search messages inside the active conversation
- Highlight matching words/phrases in results
- Update matches dynamically as user input changes

Test search behavior with short and long chat histories.

---

### Week 12: Exporting Conversations

Implement conversation export options:
- Export a conversation as Markdown
- Export a conversation as JSON
- Preserve message order and timestamps in export files

Validate export output format and file download flow.

---

### Week 13: Theme and Interface Customization Finalization

Complete and polish UI customization:
- Finalize light/dark mode behavior across all main views
- Persist theme selection across sessions
- Improve responsive layout for desktop and mobile screens

Run UI consistency checks and fix styling issues.

---

### Week 14: Testing, Bug Fixes, and Sprint Wrap-Up

Run full Sprint 2 validation:
- Manual regression testing for branching, search, export, and themes
- Fix remaining bugs and edge cases
- Update documentation and prepare final demo notes

Finalize Sprint 2 deliverables and project handoff materials.