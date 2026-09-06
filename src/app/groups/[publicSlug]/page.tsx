import { GroupHeading } from "@/components/group-heading";
import { PublicTable } from "@/components/public-table";
import { SiteNav } from "@/components/site-nav";
import { getPeriod } from "@/lib/view-data";
import { getPublicGroupOr404 } from "@/lib/data";

export default async function PublicGroupPage({ params, searchParams }: PageProps<"/groups/[publicSlug]">) {
  const [{ publicSlug }, query] = await Promise.all([params, searchParams]);
  const group = await getPublicGroupOr404(publicSlug); const period = getPeriod(typeof query.period === "string" ? query.period : undefined);
  return <main className="shell"><SiteNav backHref="/explore" /><GroupHeading group={group} privateLabel={false} /><PublicTable group={group} period={period} base={`/groups/${publicSlug}`} playerBase={`/groups/${publicSlug}/players`} /></main>;
}
