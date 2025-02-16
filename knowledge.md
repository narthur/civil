# Civil Project Knowledge

## Project Structure
- SvelteKit frontend in `src/`
- Convex backend in `src/convex/`
- Uses pnpm for package management
- Tailwind for styling

## Development Workflow
- Must run both Convex and SvelteKit dev servers
- Convex server: `pnpm dlx convex dev`
- SvelteKit server: `pnpm dev`
- Run servers in separate terminals

## Testing
- Client tests: `src/**/*.svelte.{test,spec}.{js,ts}`
- Server tests: `src/**/*.{test,spec}.{js,ts}` (excluding Svelte tests)
- Run tests with `pnpm test`

## Style Guidelines
- Use Prettier for formatting
- Use ESLint for linting
- Tailwind for styling
- Keep components focused and minimal

## Architecture
- SvelteKit for frontend routing and SSR
- Convex for backend and real-time data
- Static adapter for deployment

## Convex Integration
- Use setupConvex in root layout with PUBLIC_CONVEX_URL
- Use useQuery for real-time data subscriptions
- Use useConvexClient().mutation for mutations
- Handle loading/error states in components using query.isLoading and query.error
