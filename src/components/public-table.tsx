import { Leaderboard } from "@/components/leaderboard";
import { Trophy } from "lucide-react";
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
  const monthlyAward = period === "month"
    ? { label: leaderboardPeriodLabel("month", group.timezone, now), winners: rows.filter(row => row.rank === 1 && row.rating > 0) }
    : period === "last_month"
      ? monthlyMvps(group, now).find(award => award.label === lastMonthLabel && award.winners.length > 0)
      : undefined;
  const winner = monthlyAward?.winners[0];
  return <><PeriodSwitcher active={period} base={base} />
    {monthlyAward && winner && <section className="monthly-mvp-card" aria-label="Player of the Month achievement">
      <div className="monthly-mvp-card-head"><span className="monthly-mvp-emblem"><Trophy size={30} strokeWidth={1.6} aria-hidden="true" /></span><div><p className="eyebrow">PLAYER OF THE MONTH</p><p className="monthly-mvp-month mono">{monthlyAward.label.toUpperCase()} · {period === "month" ? "LEADING THE MONTH" : "CROWNED FOR THE MONTH"}</p></div></div>
      <h2>{monthlyAward.winners.map(row => row.name).join(" / ")}</h2>
      <div className="monthly-mvp-total"><strong>{winner.rating}</strong><span>TOTAL POINTS</span></div>
      {period === "month" && <p className="mono monthly-mvp-progress">CURRENT LEADER · MONTH IN PROGRESS</p>}
      {monthlyAward.winners.length > 1 && <p className="mono">JOINT WINNERS</p>}
      <div className="monthly-mvp-winners">{monthlyAward.winners.map(row => <div className="monthly-mvp-winner" key={row.playerId}>
        {monthlyAward.winners.length > 1 && <h3>{row.name}</h3>}
        <dl><div><dt>Goals</dt><dd>{row.goals}</dd></div><div><dt>Assists</dt><dd>{row.assists}</dd></div></dl>
      </div>)}</div>
      <ShareMonthlyMvp data={{ groupName: group.name, groupSlug: group.publicSlug ?? group.shareToken, barcodeValue: sharePath ? `https://iballpassyou.com${sharePath}` : undefined, month: monthlyAward.label, winners: monthlyAward.winners.map(row => ({ name: row.name, goals: row.goals, assists: row.assists })), points: winner.rating, inProgress: period === "month" }} path={sharePath} />
    </section>}
    <Leaderboard rows={rows} playerHref={(id) => `${playerBase}/${id}`} /><RatingNote /><div className="leaderboard-actions">{allowCopy ? <CopyButton text={shareText(group, rows, periodLabel)} /> : null}<ShareLeaderboard data={{ groupName: group.name, groupSlug: group.publicSlug, barcodeValue: group.publicSlug ? `https://iballpassyou.com/groups/${group.publicSlug}` : undefined, rows, periodLabel: leaderboardPeriodLabel(period, group.timezone, now), snapshotDate: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: group.timezone }).format(now) }} path={sharePath} /></div></>;
}
