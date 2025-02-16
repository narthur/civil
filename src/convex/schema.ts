import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
  }),

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
});
