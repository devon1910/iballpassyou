import { Leaderboard } from "@/components/leaderboard";
import { PeriodSwitcher } from "@/components/period-switcher";
import { RatingNote } from "@/components/rating-note";
import { CopyButton } from "@/components/copy-button";
import { ShareLeaderboard } from "@/components/share-leaderboard";
import { ShareMonthlyMvp } from "@/components/share-monthly-mvp";
import { monthlyMvps } from "@/lib/achievements";
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
  const lastMonthLabel = leaderboardPeriodLabel("last_month", group.timezone, now);
  const monthlyAward = period === "month" || period === "last_month" ? monthlyMvps(group, now).find(award => award.label === lastMonthLabel && award.winners.length > 0) : undefined;
  const winner = monthlyAward?.winners[0];
  return <><PeriodSwitcher active={period} base={base} />
    {monthlyAward && winner && <section className="monthly-mvp-card" aria-label="Player of the Month achievement">
      <p className="eyebrow">PLAYER OF THE MONTH · {monthlyAward.label.toUpperCase()}</p>
      <h2>{monthlyAward.winners.map(row => row.name).join(" / ")}</h2>
      <p className="mono">{winner.rating} POINTS · {monthlyAward.winners.length > 1 ? "JOINT WINNERS" : "MONTHLY WINNER"}</p>
      <ShareMonthlyMvp data={{ groupName: group.name, groupSlug: group.publicSlug ?? group.shareToken, barcodeValue: shareBase ? `https://iballpassyou.com${shareBase}?period=last_month` : undefined, month: monthlyAward.label, names: monthlyAward.winners.map(row => row.name), points: winner.rating }} path={shareBase ? `${shareBase}?period=last_month` : undefined} />
    </section>}
    <Leaderboard rows={rows} playerHref={(id) => `${playerBase}/${id}`} /><RatingNote /><div className="leaderboard-actions">{allowCopy ? <CopyButton text={shareText(group, rows, periodLabel)} /> : null}<ShareLeaderboard data={{ groupName: group.name, groupSlug: group.publicSlug, barcodeValue: group.publicSlug ? `https://iballpassyou.com/groups/${group.publicSlug}` : undefined, rows, periodLabel: leaderboardPeriodLabel(period, group.timezone, now), snapshotDate: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: group.timezone }).format(now) }} path={sharePath} /></div></>;
}
