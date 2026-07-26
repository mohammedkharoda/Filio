import type { NextConfig } from "next";

/**
 * Filio is a fully static, client-only app: no backend, no server storage of user
 * data. We therefore export a static site (`output: 'export'`) so it deploys with
 * zero server config on Vercel or Netlify.
 */
const nextConfig: NextConfig = {
  output: "export",
  // Static export cannot use the on-demand Image Optimization server.
  images: { unoptimized: true },
  // Emit trailing-slash directories so static hosts resolve routes predictably.
  trailingSlash: true,
  reactStrictMode: true,
};

export default nextConfig;
