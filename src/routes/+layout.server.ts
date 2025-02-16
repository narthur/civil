import { PUBLIC_CONVEX_URL } from '$env/static/public';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
  console.log('Server-side PUBLIC_CONVEX_URL:', PUBLIC_CONVEX_URL);
  return {
    convexUrl: PUBLIC_CONVEX_URL
  };
};
