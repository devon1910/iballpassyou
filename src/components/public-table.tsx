import { Leaderboard } from "@/components/leaderboard";
import { PeriodSwitcher } from "@/components/period-switcher";
import { RatingNote } from "@/components/rating-note";
import { CopyButton } from "@/components/copy-button";
import { leaderboardFor } from "@/lib/view-data";
import { shareText } from "@/lib/format";
import type { Group, LeaderboardPeriod } from "@/types/domain";

export function PublicTable({ group, period, base, playerBase }: { group: Group; period: LeaderboardPeriod; base: string; playerBase: string }) {
  const rows = leaderboardFor(group, period);
  return <><PeriodSwitcher active={period} base={base} /><Leaderboard rows={rows} playerHref={(id) => `${playerBase}/${id}`} /><RatingNote /><CopyButton text={shareText(group, rows)} /></>;
}
