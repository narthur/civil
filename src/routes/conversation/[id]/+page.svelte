<script lang="ts">
  import { onMount } from "svelte";
  import { useQuery, useConvexClient } from "$lib/convexClient";
  import { api } from "$lib/convexClient";
  import type { Id } from "../../../convex/_generated/dataModel";

  const props = $props<{ data: { conversationId: Id<"conversations"> } }>();
  const conversationId = props.data.conversationId;
  
  const messages = useQuery(api.conversations.listConversationMessages, { 
    conversationId 
  });
  const client = useConvexClient();
  
  let newMessage = $state("");
  let userId = $state<Id<"users"> | null>(null); // TODO: Replace with actual user management
  
  async function handleSend() {
    if (!newMessage.trim() || !userId) return;
    
    await client.mutation(api.conversations.sendMessage, {
      conversationId,
      senderId: userId,
      content: newMessage.trim(),
    });
    
    newMessage = "";
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSend();
    }
  }
</script>

<div class="container mx-auto p-4 max-w-3xl">
  <div class="bg-white rounded-lg shadow-lg p-6">
    <div class="space-y-4 mb-6 max-h-[60vh] overflow-y-auto">
      {#if messages.isLoading}
        <div>Loading...</div>
      {:else if messages.error}
        <div>Error: {messages.error.toString()}</div>
      {:else if messages.data}
        {#each messages.data as message}
          <div class="flex flex-col {message.messageType === 'guidance' ? 'bg-blue-50 p-3 rounded-lg' : ''}">
            {#if message.messageType === 'guidance'}
              <div class="text-blue-600 font-medium">Guidance</div>
              <p class="text-gray-700">{message.content}</p>
            {:else}
              <div class="flex items-start gap-2">
                <div class="bg-gray-100 p-3 rounded-lg flex-1">
                  <p class="text-gray-900">{message.content}</p>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      {/if}
    </div>

    <div class="border-t pt-4">
      <div class="flex gap-2">
        <input
          type="text"
          bind:value={newMessage}
          placeholder="Type your message..."
          class="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onkeydown={handleKeydown}
        />
        <button
          onclick={handleSend}
          class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          disabled={!userId}
        >
          Send
        </button>
      </div>
    </div>
  </div>
</div>
