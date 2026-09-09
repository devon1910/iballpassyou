import Link from "next/link";
import { Medal, Zap } from "lucide-react";
import { ShareButton } from "@/components/share-button";
import { ShareSessionAchievements } from "@/components/share-session-achievements";
import { FORMAT_LABELS, sessionMotm, sessionRecord } from "@/lib/achievements";
import type { FootballSession, Group } from "@/types/domain";

export function SessionAchievements({ group, session }: { group: Group; session: FootballSession }) {
  const winners = sessionMotm(session);
  const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: group.timezone }).format(new Date(session.kickoffAt));
  const records = session.appearances.flatMap(a => {
    const record = sessionRecord(group, session, a.playerId);
    return record?.kind ? [{ ...record, player: a }] : [];
  });
  const shareBase = group.visibility === "public" && group.publicSlug ? `/groups/${group.publicSlug}` : group.shareToken ? `/g/${group.shareToken}` : undefined;
  return <section className="session-achievements" aria-label="Session achievements">
    <p className="section-label">Session honours · {date}</p>
    {winners.length > 0 ? <div className="motm-banner"><Medal size={40} aria-hidden="true" /><div><p className="eyebrow">{winners.length > 1 ? "Joint Men of the Match" : "Man of the Match"}</p><h2>{winners.map(w => w.name).join(" & ")}</h2><span className="mono">{winners[0].rating} points · A medal for the cabinet</span></div></div> : <p className="muted">No MOTM this session. A positive rating is needed to earn a medal.</p>}
    {shareBase && winners.length > 0 && <ShareButton label="Share Man of the Match" title="iBallPassYou · Man of the Match" path={shareBase} text={`🏅 ${winners.map(w => w.name).join(" & ")} · ${winners.length > 1 ? "Joint MOTM" : "Man of the Match"}\n${winners[0].rating} points · ${group.name} · ${date}`} />}
    {shareBase && <ShareSessionAchievements path={shareBase} data={{ groupName: group.name, date, motm: { names: winners.length ? winners.map(w => w.name).join(" & ") : "No MOTM", points: winners.length ? winners[0].rating : 0 }, records: records.map(({ player, points }) => ({ playerName: player.playerName, points, goals: player.goals, assists: player.assists })) }} />}
    {records.map(({ player, points, previousBest, kind }) => {
      const title = kind === "broken" ? "New personal best!" : kind === "matched" ? "Personal best matched" : "Your starting benchmark";
      const text = `${player.playerName} · ${title} ${points} points${previousBest !== undefined ? ` (previous best: ${previousBest})` : ""}. ${FORMAT_LABELS[session.format]} · ${group.name} · ${date}.`;
      return <article className={`record-card ${kind === "broken" ? "record-broken" : ""}`} key={player.playerId}>
        <div className="record-heading"><Zap size={20} aria-hidden="true" /><span className="eyebrow">{title}</span></div>
        <Link className="text-link" href={`/app/groups/${group.id}/players/${player.playerId}`}>{player.playerName}</Link>
        <p className="record-score"><b>{points}</b> points</p>
        <p className="mono">{player.goals} {player.goals === 1 ? "goal" : "goals"} · {player.assists} {player.assists === 1 ? "assist" : "assists"}</p>
        <p className="muted">{FORMAT_LABELS[session.format]}{previousBest !== undefined ? ` · Previous best: ${previousBest}` : " · Your first session in this format"}</p>
        {shareBase && <ShareButton text={text} path={`${shareBase}/players/${player.playerId}`} label="Share achievement" title={`${player.playerName} · ${title}`} />}
      </article>;
    })}
    <p className="rating-note">Goal +4 · Assist +2 · Session win +1. MOTM goes to the highest positive rating; ties share the medal. Personal bests compare earlier sessions in the same format.</p>
  </section>;
}
