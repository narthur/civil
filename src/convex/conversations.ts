import { mutation, query, internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";

export const createUser = mutation({
  args: {
    name: v.string(),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", { name: args.name });
  },
});

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

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }
    if (!conversation.participants.includes(args.senderId)) {
      throw new Error("User is not a participant in this conversation");
    }

    await ctx.db.insert("conversation_messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      content: args.content,
      messageType: "user",
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.conversations.analyzeGuidance, {
      conversationId: args.conversationId,
    });
    return null;
  },
});

export const listConversationMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  returns: v.array(
    v.object({
      _id: v.id("conversation_messages"),
      _creationTime: v.number(),
      conversationId: v.id("conversations"),
      senderId: v.optional(v.id("users")),
      content: v.string(),
      messageType: v.union(v.literal("user"), v.literal("system"), v.literal("guidance")),
    })
  ),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    return await ctx.db
      .query("conversation_messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();
  },
});

export const analyzeGuidance = internalAction({
  args: {
    conversationId: v.id("conversations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const messages = await ctx.runQuery(api.conversations.listConversationMessages, {
      conversationId: args.conversationId,
    });

    // Simple example: If there are multiple messages in quick succession,
    // suggest taking time to reflect
    const recentMessages = messages.slice(-3);
    if (recentMessages.length >= 3) {
      const timeSpan = recentMessages[recentMessages.length - 1]._creationTime - recentMessages[0]._creationTime;
      if (timeSpan < 60000) { // Less than 1 minute
        await ctx.runMutation(internal.conversations.addGuidanceMessage, {
          conversationId: args.conversationId,
          content: "Consider taking a moment to reflect on what's been said. What feelings or needs might be underlying the other person's perspective?",
        });
      }
    }

    return null;
  },
});

export const addGuidanceMessage = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx: any, args: { conversationId: any; content: string }) => {
    await ctx.db.insert("conversation_messages", {
      conversationId: args.conversationId,
      content: args.content,
      messageType: "guidance",
      createdAt: Date.now(),
    });
    return null;
  },
});
