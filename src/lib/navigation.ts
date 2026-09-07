export function safeAppPath(value: unknown, fallback = "/app") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value === "/app" || value.startsWith("/app/") || value.startsWith("/app?") ? value : fallback;
}
