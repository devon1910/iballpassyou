import Link from "next/link";
import type { LeaderboardRow } from "@/types/domain";

export function Leaderboard({ rows, playerHref, limit }: { rows: LeaderboardRow[]; playerHref: (id: string) => string; limit?: number }) {
  const visible = limit ? rows.slice(0, limit) : rows;
  if (!visible.length) return <p className="empty">No sessions yet. Log the first one.</p>;
  return <div className="leaderboard" role="table" aria-label="Leaderboard">
    <div className="leader-head" role="row"><span>#</span><span>Player</span><span>Rating</span></div>
    {visible.map((row) => <Link href={playerHref(row.playerId)} className="leader-row" role="row" key={row.playerId}>
      <span className={row.rank === 1 ? "rank rank-one" : "rank"} role="cell">{row.rank}</span>
      <span role="cell"><strong>{row.name}</strong><small>{row.goals}G {row.assists}A</small></span>
      <b className="rating" role="cell">{row.rating}</b>
    </Link>)}
  </div>;
}

