<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from "svelte";
  import { useQuery, useConvexClient } from "$lib/convexClient";
  import { api } from "$lib/convexClient";
  import type { Id } from "../convex/_generated/dataModel";

  // Basic user state for testing
  let userId: Id<"users"> | null = null;
  let userName = "";

  // Conversation list query – no arguments needed
  const conversations = useQuery(api.conversations.listConversations, {});

  const client = useConvexClient();

  let conversationLoading = false;

  async function createTestUser() {
    // Create a test user with the provided name
    try {
      const id = await client.mutation(api.conversations.createUser, { name: userName });
      userId = id;
    } catch (error) {
      console.error("Error creating user:", error);
    }
  }

  async function createNewConversation() {
    if (!userId) return;
    conversationLoading = true;
    try {
      // Create a new conversation with the current user as participant
      const conversationId = await client.mutation(api.conversations.createConversation, { participants: [userId] });
      goto(`/conversation/${conversationId}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      conversationLoading = false;
    }
  }
</script>

<h1>Conversations</h1>

{#if !userId}
  <section class="my-4">
    <h2 class="text-lg font-semibold mb-2">Set Your Test User</h2>
    <div class="flex gap-2">
      <input
        type="text"
        placeholder="Your name"
        bind:value={userName}
        class="border p-2 rounded"
      />
      <button on:click={createTestUser} class="bg-green-500 text-white px-4 py-2 rounded" disabled={!userName}>
        Set User
      </button>
    </div>
  </section>
{/if}

{#if userId}
  <section class="my-4">
    <h2 class="text-lg font-semibold">Welcome, {userName}!</h2>
    <button on:click={createNewConversation} class="mt-2 bg-blue-500 text-white px-4 py-2 rounded" disabled={conversationLoading}>
      {conversationLoading ? "Creating..." : "Create New Conversation"}
    </button>
  </section>
{/if}

<section class="my-4">
  <h2 class="text-xl font-semibold mb-2">Existing Conversations</h2>
  {#if conversations.isLoading}
    <p>Loading conversations...</p>
  {:else if conversations.error}
    <p class="text-red-600">Error: {conversations.error.toString()}</p>
  {:else if conversations.data}
    {#if conversations.data.length === 0}
      <p>No conversations found.</p>
    {:else}
      <ul class="list-disc pl-5 space-y-1">
        {#each conversations.data as conv}
          <li>
            <a class="text-blue-600 hover:underline"
              href="/conversation/{conv._id}">
              Conversation {conv._id} – {conv.status} – {new Date(conv.createdAt).toLocaleString()}
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</section>
