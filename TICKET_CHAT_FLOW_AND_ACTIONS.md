# Ticket-First Flow & AI Actions

## Rule: A Ticket Must Exist Before Chat

Chat is **always** tied to a ticket. There is no standalone AI chat.

1. **Step 1: Create ticket**
   - `POST /api/tickets/` → Ticket #27 created.

2. **Step 2: Chat (anytime after)**
   - `POST /api/tickets/27/chat/` → Conversation created on first message.
   - Same ticket → same conversation; history is loaded when the user opens that ticket again.

---

## User Flows

### New issue (simple flow)

1. User clicks **Get AI Help**.
2. User describes the issue (e.g. “My printer won’t connect”).
3. Frontend creates ticket → then opens chat for that ticket (same session).
4. User and AI chat until resolved.
5. User can click **Mark as Resolved** when done.

### Existing ticket

1. User opens an existing ticket (e.g. from list or detail).
2. User clicks **AI Chat** (or equivalent).
3. Frontend loads that ticket’s conversation history (`GET /api/tickets/{id}/chat/history/`).
4. User can continue the conversation or just read it; all messages are for that ticket only.

---

## Suggested Actions vs Quick Replies

The AI can return both in `metadata`. They are used differently.

### Suggested actions (trigger backend actions)

- **Purpose:** Perform an action (resolve, escalate, etc.), not send a chat message.
- **Location:** `metadata.suggested_actions` (array of strings).
- **Examples:** `"Auto Resolve"`, `"Request Clarification"`, `"Escalate To Agent"`.
- **Frontend:** Render as **buttons** that call `handleSuggestedAction(action)`.

**Mapping (case-insensitive):**

| Label (example)        | Action |
|------------------------|--------|
| Auto Resolve           | `PATCH/POST` ticket status → `resolved` |
| Escalate / Escalate To Agent | `POST /api/tickets/{id}/escalate/` |
| Request Clarification  | Send a clarification message into the chat (e.g. “Could you provide more details?”) so the AI can respond |

Rough frontend pattern:

```jsx
{aiMessage.metadata?.suggested_actions?.length > 0 && (
  <div className="suggested-actions">
    <p className="text-sm text-gray-600">Suggested actions:</p>
    <div className="flex gap-2">
      {aiMessage.metadata.suggested_actions.map(action => (
        <button
          key={action}
          onClick={() => handleSuggestedAction(action)}
          className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
        >
          {action}
        </button>
      ))}
    </div>
  </div>
)}
```

### Quick replies (send as chat message)

- **Purpose:** Pre-written **messages** the user can send with one click.
- **Location:** `metadata.quick_replies` (array of `{ label, value }`).
- **Examples:**
  - `{ label: "Apply this solution", value: "Please apply this solution to my ticket" }`
  - `{ label: "Talk to a human", value: "I need to speak with support staff" }`
- **Frontend:** Render as **buttons** that send `reply.value` as the user message: `sendMessage(reply.value)`.

Rough frontend pattern:

```jsx
{aiMessage.metadata?.quick_replies?.length > 0 && (
  <div className="quick-replies mt-2">
    <p className="text-xs text-gray-500">Quick responses:</p>
    <div className="flex flex-wrap gap-2">
      {aiMessage.metadata.quick_replies.map(reply => (
        <button
          key={reply.label}
          onClick={() => sendMessage(reply.value)}
          className="px-3 py-1 border rounded-full text-sm hover:bg-gray-50"
        >
          {reply.label}
        </button>
      ))}
    </div>
  </div>
)}
```

---

## Example AI response payload

```json
{
  "text": "I've identified the issue. Here are the steps...",
  "confidence": 0.85,
  "metadata": {
    "suggested_actions": [
      "Auto Resolve",
      "Request Clarification",
      "Escalate To Agent"
    ],
    "quick_replies": [
      {
        "label": "Apply this solution",
        "value": "Please apply this solution to my ticket"
      },
      {
        "label": "Show similar tickets",
        "value": "Show me similar resolved tickets"
      },
      {
        "label": "Talk to a human",
        "value": "I need to speak with support staff"
      }
    ]
  }
}
```

- **Suggested actions** → Buttons that run backend actions (resolve, escalate, or send a clarification prompt).
- **Quick replies** → Buttons that send the given string as the next user message.

---

## Where this is implemented

- **Ticket-first flow:**  
  - New: `SimpleTicketCreation` (create ticket → then chat in same flow).  
  - Existing: `AIChatPanel` only opens when a ticket is selected; it loads that ticket’s chat history.

- **Suggested actions:**  
  - `AIChatPanel.jsx`: `handleSuggestedAction(action)` + buttons.  
  - `SimpleTicketCreation.jsx`: same logic and buttons.

- **Quick replies:**  
  - Both components: buttons that call `sendMessage(reply.value)` (with “Quick responses:” label where applicable).

- **History and continuity:**  
  - When opening an existing ticket and clicking AI Chat, the app loads that ticket’s conversation so the user can continue or view the same chat.
