# One-on-One Constructive Conversation Web App Plan

This document outlines the necessary steps to add structured, safe, and guided one-on-one conversation features to the existing SvelteKit + Convex project.

---

## 1. Schema Changes (Convex Backend)

• Add a new table for conversation sessions:
  - Table: conversations  
    • Fields:
      - participants: v.array(v.id("users"))
      - status: v.string() // e.g., "active", "closed"
      - createdAt: v.number()
  
• Add a table for conversation messages:
  - Table: conversation_messages  
    • Fields:
      - conversationId: v.id("conversations")
      - senderId: v.optional(v.id("users")) // for user or system messages
      - content: v.string()
      - messageType: v.union(v.literal("user"), v.literal("system"), v.literal("guidance"))
      - createdAt: v.number()

• Example schema snippet (to be added in convex/schema.ts):
```ts
// ... existing code ...
conversations: defineTable({
  participants: v.array(v.id("users")),
  status: v.string(),
  createdAt: v.number(),
}),

conversation_messages: defineTable({
  conversationId: v.id("conversations"),
  senderId: v.optional(v.id("users")),
  content: v.string(),
  messageType: v.union(v.literal("user"), v.literal("system"), v.literal("guidance")),
  createdAt: v.number(),
}).index("by_conversation", ["conversationId"]),
// ... existing code ...
```

---

## 2. Convex Functions (Backend API Endpoints)

### a) Conversation Management

• Mutation: createConversation  
  - Args: { participants: array(v.id("users")) }  
  - Returns: conversationId  
  - Pseudocode:
```ts
export const createConversation = mutation({
  args: {
    participants: v.array(v.id("users")),
  },
  returns: v.id("conversations"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("conversations", {
      participants: args.participants,
      status: "active",
      createdAt: Date.now(),
    });
  },
});
```

### b) Messaging

• Mutation: sendMessage  
  - Args: { conversationId: v.id("conversations"), senderId: v.id("users"), content: v.string(), messageType?: v.union(v.literal("user"), v.literal("system"), v.literal("guidance")) }  
  - Returns: v.null()  
  - Pseudocode:
```ts
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    // optional type, default "user"
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("conversation_messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      content: args.content,
      messageType: "user", // default value, or use args.messageType if provided
      createdAt: Date.now(),
    });
    // Optionally schedule guidance analysis if needed:
    await ctx.scheduler.runAfter(
      0,
      internal.conversations.analyzeGuidance,
      { conversationId: args.conversationId }
    );
    return null;
  },
});
```

• Query: listConversationMessages  
  - Args: { conversationId: v.id("conversations") }  
  - Returns: list of messages sorted by createdAt  
  - Pseudocode:
```ts
export const listConversationMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  // Define a validator that returns an array of message objects
  returns: v.array(
    v.object({
      _id: v.id("conversation_messages"),
      createdAt: v.number(),
      conversationId: v.id("conversations"),
      senderId: v.optional(v.id("users")),
      content: v.string(),
      messageType: v.union(v.literal("user"), v.literal("system"), v.literal("guidance")),
    })
  ),
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("conversation_messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();
    return messages;
  },
});
```

### c) Conversation Guidance (Internal Function)

• Internal Action: analyzeGuidance  
  - Purpose: Analyze recent conversation messages and, if needed, insert a guidance (or system) message.
  - Args: { conversationId: v.id("conversations") }  
  - Pseudocode:
```ts
export const analyzeGuidance = internalAction({
  args: {
    conversationId: v.id("conversations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Retrieve last N messages from the conversation
    const messages = await ctx.db
      .query("conversation_messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("desc")
      .take(10);
      
    // Pseudo-code: analyze messages to check for escalation or destructive patterns.
    // If issues are detected, set guidanceText to a constructive prompt.
    const guidanceText = "Remember to focus on understanding each other. Try rephrasing your points calmly."; // example guidance text
    
    if (/* condition based on analysis */ false) {
      // Insert a guidance message into the conversation.
      await ctx.db.insert("conversation_messages", {
        conversationId: args.conversationId,
        // senderId left undefined or null for system messages
        content: guidanceText,
        messageType: "guidance",
        createdAt: Date.now(),
      });
    }
    return null;
  },
});
```

> Note: Replace the pseudo-condition with real logic. One can integrate AI (e.g., GPT-4) to analyze sentiment if needed.

---

## 3. Frontend Changes (SvelteKit)

### a) Conversation Page

• Create a new SvelteKit route (e.g., src/routes/conversation/[id].svelte) that:
  - Uses a load function to fetch conversation messages via listConversationMessages.
  - Displays conversation history in order using Tailwind for responsive design.
  - Contains an input box for sending a new message.
  
• Pseudocode snippet for page component:
```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "$lib/convexClient"; // import Convex client helper

  export let params;
  let messages = [];
  let newMessage = "";
  const conversationId = params.id;

  // Load messages (could also use real-time subscriptions)
  async function loadMessages() {
    messages = await api.conversation.listConversationMessages({ conversationId });
  }
  
  async function sendMessage() {
    await api.conversation.sendMessage({ conversationId, senderId: "currentUserId", content: newMessage });
    newMessage = "";
    await loadMessages();
  }
  
  onMount(loadMessages);
</script>

<div class="container mx-auto p-4">
  <div class="mb-4">
    {#each messages as msg}
      <div class="{msg.messageType === 'guidance' ? 'bg-blue-100 p-2 rounded' : 'p-2'}">
        <span>{msg.content}</span>
      </div>
    {/each}
  </div>
  <input type="text" bind:value={newMessage} placeholder="Type your message" class="w-full border p-2" />
  <button on:click={sendMessage} class="mt-2 bg-green-500 text-white p-2 rounded">Send</button>
</div>
```

### b) Additional UI Improvements

• Create components for:
  - Conversation header (display participant names, conversation status).
  - Guidance message bubble styling.

• Leverage Tailwind CSS classes to ensure responsiveness.

---

## 4. Testing and Security Considerations

• Write backend tests (e.g., in src/**/*.{test,spec}.ts) to:
  - Ensure conversation creation and message insertion work as expected.
  - Validate that only allowed participants can view or send messages.

• Frontend testing with Svelte Testing Library:
  - Test conversation page rendering and message add behavior.

• Data privacy:
  - Implement access control in backend functions to ensure that only conversation participants can interact with a conversation.
  - Consider encryption or secure storage for messages in production.

---

## 5. Summary of Integration Points

• Update Convex schema (convex/schema.ts) with the new tables.  
• Add new API endpoints in Convex (e.g., in a new file convex/conversations.ts or within index.ts).  
• Create a new SvelteKit route (src/routes/conversation/[id].svelte) for the conversation UI.  
• Write tests to validate end-to-end functionality.

This plan provides a clear roadmap for implementing a constructive, guided one-on-one conversation system built upon the existing SvelteKit + Convex project.
