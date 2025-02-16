<script>
  import "../app.css";
  import { setupConvex } from "convex-svelte";
  import { PUBLIC_CONVEX_URL } from '$env/static/public';

  console.log("Layout Convex URL:", PUBLIC_CONVEX_URL);
  setupConvex(PUBLIC_CONVEX_URL);
</script>

<slot />
