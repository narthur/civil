# Authentication Implementation Plan

This document outlines the changes needed to add authentication to the Civil project. The plan leverages a third-party provider (e.g. Auth0 or Clerk) to protect user data, integrate a proper auth flow on the frontend, and update both the Convex schema and backend functions to enforce authentication.

---

## 1. Third-Party Auth Provider Integration

- Choose an auth provider (for instance, Auth0 or Clerk).  
- Install the corresponding SDK in the SvelteKit frontend, e.g. for Auth0:
  - npm install @auth0/auth0-spa-js  
- Add provider-specific configuration (client ID, domain, etc.) to your environment file (.env.local).
  - Example:  
    CLIENT_ID="your-client-id"  
    CLIENT_DOMAIN="your-auth-domain"
- Create SvelteKit pages/routes for login, logout, and callback handling.

---

## 2. Update Convex Schema

- Modify the “users” table (in src/convex/schema.ts) to store additional fields from authentication.
  
  Pseudocode snippet for the updated users table:
  ```
  // In src/convex/schema.ts
  users: defineTable({
    name: v.string(),
    authId: v.string(),   // Unique ID from auth provider (e.g. Auth0 sub)
    email: v.optional(v.string()),  // Optionally store user email
  }),
  ```
- This change helps link the Convex user record to the authenticated identity.

---

## 3. Update Convex Functions

### a. Register/Fetch User

- Update the createUser mutation (or create a new “registerUser” mutation) to check for an auth token.  
- In the mutation:
  - Check if the context contains valid auth information (for instance, using `ctx.auth`).
  - Extract the unique user identifier (e.g., `ctx.auth.userId` or `ctx.auth.sub`).
  - If a record already exists for that authId, return the existing user ID.
  - Otherwise, insert a new record with the provided name, authId, and (if available) email.
  
  Example pseudocode:
  ```
  export const registerUser = mutation({
    args: { name: v.string() },
    returns: v.id("users"),
    handler: async (ctx, args) => {
      if (!ctx.auth) throw new Error("Not authorized");
      const authId = ctx.auth.sub; // or equivalent property from auth token
      
      // check if user exists based on authId
      const user = await ctx.db.query("users")
         .filter(user => user.authId === authId)
         .unique();
      if (user) return user._id;
      
      // otherwise, create a new user record
      return await ctx.db.insert("users", {
         name: args.name,
         authId,
         email: ctx.auth.email  // if available
      });
    }
  });
  ```

### b. Secure Other Mutations/Queries

- In functions like `createConversation` and `sendMessage`, add a check for a valid authenticated user:
  - Verify that the request comes with `ctx.auth`.
  - Compare the provided user ID (e.g. senderId in sendMessage) with the authenticated user's authId.
  
  Pseudocode example for sendMessage:
  ```
  export const sendMessage = mutation({
    args: {
      conversationId: v.id("conversations"),
      senderId: v.id("users"),
      content: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
      if (!ctx.auth) {
         throw new Error("Not authenticated");
      }
      // Optionally validate that ctx.auth.sub matches the sender's auth record
      // fetch the conversation and check that the sender is a participant
      
      // normal processing...
    }
  });
  ```

- Add similar authentication checks in other sensitive functions to ensure that only the authenticated user can modify or access their data.

---

## 4. Update Frontend (SvelteKit)

### a. Auth Provider Setup

- In the root layout (src/routes/+layout.svelte), import and initialize the selected auth provider.
- Replace the “createTestUser” flow with a proper sign-in/sign-up flow using the auth provider.
- Expose the auth state (logged in/out, user info) in a Svelte store accessible across the app.

### b. Auth-Based UI Updates

- Add a sign-in component that handles:
  - Initiating authentication (redirect to provider)
  - Handling the callback and storing the user’s token (and possibly persisting in sessionStorage)
- Add a logout mechanism.
- Update secured pages:
  - Check for an authenticated state; if not authenticated, either redirect to the login page or show an error.
  - When calling Convex mutations/queries (via the Convex client), attach the auth token (e.g. in headers) if required by Convex.

### c. Example Code Snippet

Pseudocode change in +layout.svelte:
```
<script>
  import { initAuth } from 'path/to/authProvider';
  // run onMount or in a store initializer
  initAuth({
    domain: import.meta.env.VITE_CLIENT_DOMAIN,
    clientId: import.meta.env.VITE_CLIENT_ID,
  });
</script>

<slot />
```
- Replace manual user creation in +page.svelte with buttons for “Sign In” and “Register”.  
- Ensure that when a user is signed in, call `registerUser` mutation to synchronize with Convex.

---

## Summary of Changes

- Modify the Convex schema by updating the “users” table to include authId (and email).
- Update backend functions to enforce authentication using `ctx.auth` checks.
- Integrate a third-party auth provider (e.g. Auth0 or Clerk) in the SvelteKit app.
- Update frontend components to manage auth state, show login/logout buttons, and trigger the new authentication flow.
- Update Convex client calls to work with authenticated requests.

This plan provides a clear path for protecting user data, integrating third-party authentication, modifying the backend to store and verify the authenticated identity, and updating the frontend to support a full auth flow.
