# Civil

A SvelteKit project powered by Convex.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Start the Convex development server:
```bash
pnpm convex dev
```

3. In a new terminal, start the SvelteKit development server:
```bash
pnpm dev
```

You can open the app in a new browser tab by adding the `--open` flag:
```bash
pnpm dev --open
```

## Building

To create a production version of your app:

```bash
pnpm build
```

You can preview the production build with:
```bash
pnpm preview
```

## Development

- The SvelteKit app code lives in `src/`
- Convex backend functions are in `src/convex/`
- Edit `src/routes/+page.svelte` to modify the home page
- Configure Convex in `convex.json`

## Learn More

- [Convex Documentation](https://docs.convex.dev)
- [SvelteKit Documentation](https://kit.svelte.dev/docs)
