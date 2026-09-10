import Link from "next/link";
import { ShareButton } from "@/components/share-button";
import { ShareSessionAchievements } from "@/components/share-session-achievements";
import { sessionMilestones, sessionMotm } from "@/lib/achievements";
import type { FootballSession, Group } from "@/types/domain";

function receiptDate(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "2-digit", month: "2-digit", year: "2-digit", timeZone: timezone }).format(new Date(value)).toUpperCase();
}

function sessionNumber(group: Group, session: FootballSession) {
  return [...group.sessions]
    .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime() || a.id.localeCompare(b.id))
    .findIndex((candidate) => candidate.id === session.id) + 1;
}

export function SessionAchievements({ group, session, reveal = false }: { group: Group; session: FootballSession; reveal?: boolean }) {
  const winners = sessionMotm(session);
  const winnerIds = winners.map((winner) => winner.playerId);
  const milestones = sessionMilestones(group, session, winnerIds);
  const date = receiptDate(session.kickoffAt, group.timezone);
  const shareBase = group.visibility === "public" && group.publicSlug ? `/groups/${group.publicSlug}` : group.shareToken ? `/g/${group.shareToken}` : undefined;
  const groupSlug = group.publicSlug ?? group.shareToken;
  const winner = winners[0];
  const winnerAppearance = winner ? session.appearances.find((appearance) => appearance.playerId === winner.playerId) : undefined;
  const shareData = winner ? {
    groupName: group.name,
    groupSlug,
    barcodeValue: group.publicSlug ? `https://iballpassyou.com/groups/${group.publicSlug}` : group.shareToken ? `https://iballpassyou.com/g/${group.shareToken}` : undefined,
    venue: group.schedules.find((schedule) => schedule.active && schedule.venue)?.venue,
    date,
    sessionNumber: sessionNumber(group, session),
    motm: {
      names: winners.map((item) => item.name),
      points: winner.rating,
      goals: winnerAppearance?.goals,
      assists: winnerAppearance?.assists,
      rating: winner.rating,
    },
    records: milestones.map((milestone) => ({
      playerName: milestone.playerName,
      points: milestone.points,
      goals: milestone.goals,
      assists: milestone.assists,
      clause: milestone.clause,
    })),
  } : undefined;

  return <section className={`session-achievements${reveal ? " receipt-reveal" : ""}`} aria-label="Session achievements">
    <p className="section-label">Session receipt · {date}</p>
    {winner ? <div className="receipt-inline">
      <p className="eyebrow receipt-print-stamp" data-anim="ibpyWipe 260ms cubic-bezier(.16,.84,.28,1) .5s both">MAN OF THE MATCH</p>
      <h2 className="receipt-print-subject" data-anim="ibpyRise 480ms cubic-bezier(.2,.8,.3,1) .76s both">{winners.map((item) => item.name).join(" / ")}</h2>
      <p className="mono receipt-print-total" data-anim="ibpyFade 180ms linear 1.86s both">{winner.rating} POINTS</p>
    </div> : <p className="muted">No positive session rating was recorded.</p>}
    {shareBase && shareData && <>
      <ShareButton label="Share Man of the Match" title="iballpassyou · Man of the Match" path={shareBase} text={`${winners.map((item) => item.name).join(" / ")} · ${winner.rating} points · ${group.name} · ${date}`} />
      <ShareSessionAchievements path={shareBase} data={shareData} />
    </>}
    {milestones.map((milestone, index) => <article className="record-card receipt-print-item" style={{ "--receipt-delay": `${1.24 + index * .11}s` } as React.CSSProperties} data-anim={`ibpyFade 160ms linear ${1.24 + index * .11}s both`} key={milestone.playerId}>
      <p className="eyebrow">Receipt milestone</p>
      <Link className="text-link" href={`/app/groups/${group.id}/players/${milestone.playerId}`}>{milestone.playerName}</Link>
      <p className="record-score mono">{milestone.clause}</p>
      <p className="mono">{milestone.goals}G · {milestone.assists}A · {milestone.points} PTS</p>
    </article>)}
    <p className="rating-note">Goal +4 · Assist +2 · Session win +1. This receipt lists only data-derived milestones.</p>
  </section>;
}
