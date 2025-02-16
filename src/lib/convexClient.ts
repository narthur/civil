import { ConvexClient } from "convex/browser";
import { setupConvex, useQuery, useConvexClient } from "convex-svelte";

const convex = new ConvexClient("https://prestigious-tortoise-326.convex.cloud");

export { convex, useQuery, useConvexClient };
export { api } from "../convex/_generated/api";
