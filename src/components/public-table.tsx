import { Leaderboard } from "@/components/leaderboard";
import { PeriodSwitcher } from "@/components/period-switcher";
import { RatingNote } from "@/components/rating-note";
import { CopyButton } from "@/components/copy-button";
import { ShareLeaderboard } from "@/components/share-leaderboard";
import { leaderboardPeriodLabel } from "@/lib/leaderboard-image";
import { leaderboardFor } from "@/lib/view-data";
import { shareText } from "@/lib/format";
import type { Group, LeaderboardPeriod } from "@/types/domain";

export function PublicTable({ group, period, base, playerBase, allowCopy = false }: { group: Group; period: LeaderboardPeriod; base: string; playerBase: string; allowCopy?: boolean }) {
  const now = new Date();
  const rows = leaderboardFor(group, period, now);
  const periodLabel = { month: "THIS MONTH", last_month: "LAST MONTH", year: "YEAR", all: "ALL TIME" }[period];
  const shareBase = allowCopy ? group.visibility === "public" && group.publicSlug ? `/groups/${group.publicSlug}` : group.shareToken ? `/g/${group.shareToken}` : undefined : base;
  const sharePath = shareBase ? `${shareBase}?period=${period}` : undefined;
  return <><PeriodSwitcher active={period} base={base} /><Leaderboard rows={rows} playerHref={(id) => `${playerBase}/${id}`} /><RatingNote /><div className="leaderboard-actions">{allowCopy ? <CopyButton text={shareText(group, rows, periodLabel)} /> : null}<ShareLeaderboard data={{ groupName: group.name, groupSlug: group.publicSlug, barcodeValue: group.publicSlug ? `https://iballpassyou.com/groups/${group.publicSlug}` : undefined, rows, periodLabel: leaderboardPeriodLabel(period, group.timezone, now), snapshotDate: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: group.timezone }).format(now) }} path={sharePath} /></div></>;
}
