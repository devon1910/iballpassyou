export const APP_NAME = "iballpassyou";

export const RATING = {
  GOAL: 4,
  ASSIST: 2,
  SESSION_WIN: 1,
} as const;

const LOCAL_SITE_URL = "http://localhost:3000";

// Deployment configuration should never make metadata generation fail. A valid
// public URL is still required in production for canonical and social URLs.
export function resolveSiteUrl(value = process.env.NEXT_PUBLIC_SITE_URL): string {
  try {
    const url = new URL(value?.trim() || LOCAL_SITE_URL);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : LOCAL_SITE_URL;
  } catch {
    return LOCAL_SITE_URL;
  }
}

export const SITE_URL = resolveSiteUrl();
