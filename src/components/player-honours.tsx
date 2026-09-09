import { Medal, Trophy, Zap } from "lucide-react";
import { ShareButton } from "@/components/share-button";
import { FORMAT_LABELS, playerHonours, sessionMotm } from "@/lib/achievements";
import type { Group } from "@/types/domain";

export function PlayerHonours({ group, playerId }: { group: Group; playerId: string }) {
  const { motm, mvp, bests } = playerHonours(group, playerId);
  const player = group.players.find(p => p.id === playerId)!;
  const shareBase = group.visibility === "public" && group.publicSlug ? `/groups/${group.publicSlug}` : group.shareToken ? `/g/${group.shareToken}` : undefined;
  const date = (value: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: group.timezone }).format(new Date(value));
  return <section className="player-honours" aria-label="Player honours">
    <p className="section-label">The trophy cabinet</p>
    <div className="honours-grid">
      <details className={`honour-card medal-card ${motm.length ? "earned" : ""}`}>
        <summary><Medal aria-hidden="true" size={36} /><span className="honour-count">×{motm.length}</span><strong>Man of the Match</strong><small>{motm.length ? "View winning sessions +" : "Your first medal is waiting +"}</small></summary>
        <ul className="honour-history">{motm.map(s => { const winners = sessionMotm(s); return <li key={s.id}><time dateTime={s.kickoffAt}>{date(s.kickoffAt)}</time><span>{winners[0].rating} pts · {winners.length > 1 ? "Joint MOTM" : "MOTM"}</span></li>; })}</ul>
        {!motm.length && <p>Top the session rating to earn a medal.</p>}
      </details>
      <details className={`honour-card trophy-card ${mvp.length ? "earned" : ""}`}>
        <summary><Trophy aria-hidden="true" size={36} /><span className="honour-count">×{mvp.length}</span><strong>Monthly MVP</strong><small>{mvp.length ? "View winning months +" : "A month to make your mark +"}</small></summary>
        <ul className="honour-history">{mvp.map(m => <li key={m.month}><span>{m.label}</span><span>{m.winners[0].rating} pts · {m.winners.length > 1 ? "Joint MVP" : "MVP"}</span></li>)}</ul>
        {!mvp.length && <p>Finish a month with the highest total rating to earn a trophy.</p>}
      </details>
    </div>
    <p className="rating-note">MOTM: highest session rating. MVP: highest total rating in a finished month, using {group.timezone} time. Ties share the honour; a positive score is required.</p>
    <div className="personal-bests"><p className="section-label"><Zap size={15} aria-hidden="true" /> Personal bests</p>
      {bests.length ? bests.map(({ session, points }) => {
        const appearance = session.appearances.find(a => a.playerId === playerId)!;
        return <div className="personal-best" key={session.format}>
          <div><strong>{FORMAT_LABELS[session.format]}</strong><small>{appearance.goals} {appearance.goals === 1 ? "goal" : "goals"} · {appearance.assists} {appearance.assists === 1 ? "assist" : "assists"}</small><small>Set on {date(session.kickoffAt)}</small></div><span><b>{points}</b> pts</span>
        </div>;
      }) : <p className="muted">Your first session sets the benchmark. Build from there.</p>}
      <p className="rating-note">Your highest session rating in each format. Goal +4 · Assist +2 · Session win +1. Honours and records update when results change.</p>
      {shareBase && (motm.length > 0 || mvp.length > 0 || bests.length > 0) && <ShareButton
        label="Share player achievements" title={`${player.name} · iBallPassYou honours`}
        path={`${shareBase}/players/${playerId}`}
        text={`${player.name} · ${group.name}\n🏅 MOTM ×${motm.length} · 🏆 Monthly MVP ×${mvp.length}${bests.map(({ session, points }) => `\n⚡ Personal best: ${points} points · ${FORMAT_LABELS[session.format]} · ${date(session.kickoffAt)}`).join("")}`}
      />}
    </div>
  </section>;
}
