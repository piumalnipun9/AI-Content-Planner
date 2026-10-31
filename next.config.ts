import type { NextConfig } from "next";

// Let the dev server serve its scripts on the public tunnel address (e.g. ngrok) as well as localhost
const appHost = (() => {
  try {
    return process.env.APP_URL ? new URL(process.env.APP_URL).hostname : null
  } catch {
    return null
  }
})()

const nextConfig: NextConfig = {
  // Hide the Next.js "N" badge the dev server shows on every page (errors still surface)
  devIndicators: false,
  allowedDevOrigins: appHost && appHost !== "localhost" ? [appHost] : [],
  // Native/server-only packages used by the scheduler and image pipeline
  serverExternalPackages: ["sharp", "pg"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
