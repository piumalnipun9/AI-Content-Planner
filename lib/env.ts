
function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable ${name} (see .env.example)`)
  return value
}

export const env = {
  sessionSecret: () => required("SESSION_SECRET"),
  /** Public base URL. Instagram downloads images from here, so it must be reachable from the internet. */
  appUrl: () => (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, ""),
  geminiKey: () => required("GEMINI_API_KEY"),
  textModel: () => process.env.GEMINI_TEXT_MODEL || "gemini-3.5-flash",
  imageModel: () => process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image",
  /** Used when the main model stays overloaded after retries */
  fallbackTextModel: () => process.env.GEMINI_FALLBACK_TEXT_MODEL || "gemini-3.1-flash-lite",
  fallbackImageModel: () => process.env.GEMINI_FALLBACK_IMAGE_MODEL || "gemini-3.1-flash-lite-image",
  metaAppId: () => required("META_APP_ID"),
  metaAppSecret: () => required("META_APP_SECRET"),
  /** Facebook Login for Business configuration ID (replaces the scope list in the login dialog) */
  metaConfigId: () => process.env.META_CONFIG_ID || undefined,
  graphVersion: () => process.env.META_GRAPH_VERSION || "v25.0",
  /** Overrides for pointing the app at local mock APIs in tests */
  graphBaseUrl: () => (process.env.META_GRAPH_BASE_URL || "https://graph.facebook.com").replace(/\/$/, ""),
  geminiBaseUrl: () => process.env.GEMINI_BASE_URL || undefined,
  hasGemini: () => Boolean(process.env.GEMINI_API_KEY),
  hasMeta: () => Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
}
