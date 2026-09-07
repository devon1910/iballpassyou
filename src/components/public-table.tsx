import { Leaderboard } from "@/components/leaderboard";
import { PeriodSwitcher } from "@/components/period-switcher";
import { RatingNote } from "@/components/rating-note";
import { CopyButton } from "@/components/copy-button";
import { ShareButton } from "@/components/share-button";
import { leaderboardFor } from "@/lib/view-data";
import { shareText } from "@/lib/format";
import type { Group, LeaderboardPeriod } from "@/types/domain";

export function PublicTable({ group, period, base, playerBase, allowCopy = false }: { group: Group; period: LeaderboardPeriod; base: string; playerBase: string; allowCopy?: boolean }) {
  const rows = leaderboardFor(group, period);
  const periodLabel = { month: "THIS MONTH", last_month: "LAST MONTH", year: "YEAR", all: "ALL TIME" }[period];
  const sharePath = `${base}?period=${period}`;
  return <><PeriodSwitcher active={period} base={base} /><Leaderboard rows={rows} playerHref={(id) => `${playerBase}/${id}`} /><RatingNote /><div className="leaderboard-actions">{allowCopy ? <CopyButton text={shareText(group, rows, periodLabel)} /> : null}<ShareButton text={allowCopy ? shareText(group, rows, periodLabel) : `${group.name} leaderboard · ${periodLabel}`} path={sharePath} admin={allowCopy} /></div></>;
}
