import { ConvexClient } from "convex/browser";
import { setupConvex, useQuery, useConvexClient } from "convex-svelte";

const convex = new ConvexClient(import.meta.env.VITE_CONVEX_URL);

export { convex, useQuery, useConvexClient };
export { api } from "../convex/_generated/api";
