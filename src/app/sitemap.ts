import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";
import { getPublicGroups } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = [{ url: SITE_URL, changeFrequency: "weekly" as const, priority: 1 }, { url: `${SITE_URL}/explore`, changeFrequency: "daily" as const, priority: .8 }, { url: `${SITE_URL}/feedback`, changeFrequency: "monthly" as const, priority: .3 }];
  const groups = await getPublicGroups();
  return [...base, ...groups.filter((group) => group.publicSlug).map((group) => ({ url: `${SITE_URL}/groups/${group.publicSlug}`, changeFrequency: "daily" as const, priority: .7 }))];
}
