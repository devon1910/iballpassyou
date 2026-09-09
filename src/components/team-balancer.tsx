"use client";
import { useState } from "react";
import Link from "next/link";
import { searchBalancedTeams } from "@/lib/balance/optimizer";
import { assessTeams } from "@/lib/balance/scoring";
import type { BalancePlayer, BalancingProfile, TeamSuggestion } from "@/lib/balance/types";
import { BalancingProfileEditor } from "./balancing-profile-editor";

type Attendee = { id: string; name: string; team: number; isNew?: boolean; balancing?: BalancingProfile };
function Summary({ suggestion, labels }: { suggestion: TeamSuggestion; labels: string[] }) {
  return <div className="balance-summary">
    <p><strong className="balance-quality">{suggestion.quality === "unbalanced" ? "Unbalanced" : `${suggestion.quality} balance`}</strong> · Skill gap: {suggestion.skillGap}</p>
    <p>Position balance: <span className="balance-quality">{suggestion.positionQuality}</span></p>
    {suggestion.teams.map((t, i) => <div key={i}><strong>{labels[i]}</strong> · {t.players.length} players · Skill {t.totalSkill}<br /><small>{t.positionSummary.defender} DEF · {t.positionSummary.midfielder} MID · {t.positionSummary.attacker} ATT · {t.positionSummary.goalkeeper} GK · Keeper capable: {t.hasKeeperCapability ? "Yes" : "No"}</small></div>)}
    {suggestion.warnings.map(w => <p className="muted" key={w.code}>{w.message.replace(/on team (\d+)/, (_, n) => `on ${labels[Number(n) - 1]}`)}</p>)}
  </div>;
}
export function TeamBalancer({ groupId, players, labels, onProfile, onAssign, onAccepted }: {
  groupId: string; players: Attendee[]; labels: string[];
  onProfile: (id: string, profile: BalancingProfile) => void;
  onAssign: (assignments: Map<string, number>) => void; onAccepted: () => void;
}) {
  const [locks, setLocks] = useState<Record<string, number>>({});
  const [options, setOptions] = useState<TeamSuggestion[]>([]);
  const [page, setPage] = useState(0);
  const [chosen, setChosen] = useState(false);
  const [error, setError] = useState("");
  const missing = players.filter(p => !p.balancing?.primaryPosition || !p.balancing.skillLevel);
  const noSelectedProfilesAreReady = missing.length === players.length;
  const inputs: BalancePlayer[] = players.map(p => ({ id: p.id, effectiveSkill: p.balancing?.skillLevel ?? 0, primaryPosition: p.balancing?.primaryPosition ?? null, secondaryPosition: p.balancing?.secondaryPosition ?? null, keeperCapable: p.balancing?.keeperCapable ?? false }));
  const live = chosen ? assessTeams(labels.map((_, i) => inputs.filter(p => players.find(a => a.id === p.id)?.team === i))) : null;
  const generate = () => {
    try {
      setError("");
      const result = searchBalancedTeams({ players: inputs, teamCount: labels.length, locks: Object.entries(locks).map(([playerId, teamIndex]) => ({ playerId, teamIndex })) });
      setOptions(result.suggestions); setPage(0); setChosen(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn’t balance these teams."); }
  };
  const invalidate = () => { setOptions([]); setChosen(false); };
  return <div className="team-balancer form-stack">
    {!chosen && <section className="balance-onboarding" aria-labelledby="balance-onboarding-title">
      <p className="eyebrow">Automatic team suggestions</p>
      <h2 id="balance-onboarding-title">Build fair teams from today’s {players.length} players</h2>
      <p>We compare team size, Skill Level, positions, and keeper coverage to create repeatable suggestions. This is more than a random shuffle.</p>
      <ol className="balance-steps"><li><span>1</span>Complete missing player details</li><li><span>2</span>Add any team locks</li><li><span>3</span>Choose and adjust a suggestion</li></ol>
      <small>Set each player up once, then reuse these private details whenever you balance teams. Skill Level is separate from Performance Rating and never decides who plays.</small>
    </section>}
    {missing.length > 0 && <section className="balance-setup-flow" aria-label="Missing balancing details">
      <div className="setup-flow-head"><div><p className="eyebrow">Player setup</p><h3>{noSelectedProfilesAreReady ? "No selected players are ready yet" : `${missing.length} player${missing.length === 1 ? "" : "s"} need balancing details`}</h3></div><span>{players.length - missing.length}/{players.length} ready</span></div>
      <p>Balance Teams needs a primary position and Skill Level for every selected player. Set each player up once and we reuse those details in future sessions; you can update them in Players any time. You do not need to set up your whole historical roster.</p>
      <p>{noSelectedProfilesAreReady ? `Start with ${missing[0].name} below.` : "Only the selected players missing details are shown."} <Link className="text-link" href={`/app/groups/${groupId}/players`}>Set up player profiles in Players</Link> if you prefer to finish them there; this session draft is kept.</p>
      <BalancingProfileEditor key={missing[0].id} groupId={groupId} playerId={missing[0].id} name={missing[0].name} initial={missing[0].balancing} draftOnly={missing[0].isNew} continueLabel={missing.length > 1} onSaved={profile => { onProfile(missing[0].id, profile); invalidate(); }} />
      {missing.length > 1 && <p className="setup-next">Next: {missing.slice(1, 4).map(player => player.name).join(", ")}{missing.length > 4 ? ` and ${missing.length - 4} more` : ""}</p>}
    </section>}
    {missing.length === 0 && !chosen && <>
      <section className="generation-ready"><p className="eyebrow">Ready to generate</p><h3>All {players.length} selected players are included</h3><p>Keep the team count and names above, add optional locks, then generate your suggestions.</p></section>
      <details className="balance-locks">
        <summary aria-label="Lock players to teams (optional)">Lock players to teams <span>Optional</span></summary>
        <p>Use a lock when someone must be on a specific team. Locked players will never be moved by the generator.</p>
        {players.map(player => <label className="field" key={player.id}>
          Lock {player.name}
          <select className="select" value={locks[player.id] ?? -1} onChange={event => {
            const next = { ...locks };
            if (Number(event.target.value) < 0) delete next[player.id];
            else next[player.id] = Number(event.target.value);
            setLocks(next); invalidate();
          }}>
            <option value={-1}>No lock</option>
            {labels.map((label, index) => <option value={index} key={index}>{label}</option>)}
          </select>
        </label>)}
      </details>
      <button className="button primary" type="button" onClick={generate}>{options.length ? "Regenerate suggestions" : "Generate team suggestions"}</button>
      {options.slice(page, page + 3).map((suggestion, index) => <section className="balance-option" key={page + index} aria-label={`Option ${page + index + 1}`}><p className="eyebrow">Suggestion {page + index + 1}</p><h3>{page + index === 0 ? "Best balance" : "Strong alternative"}</h3><Summary suggestion={suggestion} labels={labels} />{suggestion.teams.map((t, i) => <p key={i}><strong>{labels[i]}:</strong> {t.players.map(p => players.find(a => a.id === p.id)?.name).join(", ")}</p>)}<button className="button" type="button" onClick={() => { onAssign(new Map(suggestion.teams.flatMap((t, i) => t.players.map(p => [p.id, i] as const)))); setChosen(true); }}>Choose option {page + index + 1}</button></section>)}
      {options.length > 0 && (page + 3 < options.length ? <button className="button" type="button" onClick={() => setPage(page + 3)}>Try another</button> : <p>No more distinct suggestions of similar balance.</p>)}
    </>}
    {live && <>
      <div role="status" aria-label="Live balance"><Summary suggestion={live} labels={labels} /></div>
      <p>Tap a player to move or swap. You can accept any balance. Unlock a pinned player before moving them.</p>
      {labels.map((label, teamIndex) => <section key={teamIndex} aria-label={`${label} players`}>
        <h3>{label}</h3>
        {players.filter(p => p.team === teamIndex).map(p => <details className="balance-adjustment" key={p.id}>
          <summary aria-label={`Adjust ${p.name}`}><strong>{p.name}</strong>{locks[p.id] !== undefined ? " · Locked" : ""}</summary>
          <div className="form-stack">
            {locks[p.id] !== undefined && <button className="button" type="button" onClick={() => { const next = { ...locks }; delete next[p.id]; setLocks(next); }}>Unlock {p.name}</button>}
            <label className="field">Move {p.name}<select className="select" disabled={locks[p.id] !== undefined} value={p.team} onChange={e => onAssign(new Map([[p.id, Number(e.target.value)]]))}>{labels.map((l, i) => <option key={i} value={i}>{l}</option>)}</select></label>
            <label className="field">Swap {p.name}<select className="select" disabled={locks[p.id] !== undefined} value="" onChange={e => { const other = players.find(x => x.id === e.target.value); if (other) onAssign(new Map([[p.id, other.team], [other.id, p.team]])); }}><option value="">Choose player</option>{players.filter(x => x.team !== p.team && locks[x.id] === undefined).map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          </div>
        </details>)}
      </section>)}
      <div className="button-row"><button className="button" type="button" onClick={() => setChosen(false)}>View suggestions</button><button className="button primary" type="button" onClick={onAccepted}>Accept teams</button></div>
    </>}
    {error && <p className="notice error" role="alert">{error}</p>}
  </div>;
}
