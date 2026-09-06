import { GroupHeading } from "@/components/group-heading";
import { PublicTable } from "@/components/public-table";
import { SiteNav } from "@/components/site-nav";
import { getPeriod } from "@/lib/view-data";
import { getSharedGroupOr404 } from "@/lib/data";

export const metadata = { robots: { index: false, follow: false } };
export default async function SharedGroupPage({ params, searchParams }: PageProps<"/g/[shareToken]">) {
  const [{ shareToken }, query] = await Promise.all([params, searchParams]); const group = await getSharedGroupOr404(shareToken); const period = getPeriod(typeof query.period === "string" ? query.period : undefined);
  return <main className="shell"><SiteNav /><GroupHeading group={group} /><PublicTable group={group} period={period} base={`/g/${shareToken}`} playerBase={`/g/${shareToken}/players`} /></main>;
}
