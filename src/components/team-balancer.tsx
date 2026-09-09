"use client";
import { useState } from "react";
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
    <p>Balance the {players.length} selected players. Everyone plays; you make the final call.</p>
    {missing.length > 0 && <section aria-label="Missing balancing details"><h3>{missing.length} players need balancing details</h3>{missing.map(p => <BalancingProfileEditor key={p.id} groupId={groupId} playerId={p.id} name={p.name} initial={p.balancing} draftOnly={p.isNew} onSaved={profile => { onProfile(p.id, profile); invalidate(); }} />)}</section>}
    {!chosen && <>
      <details><summary>Lock players to teams (optional)</summary>{players.map(p => <label className="field" key={p.id}>Lock {p.name}<select className="select" value={locks[p.id] ?? -1} onChange={e => { const next = { ...locks }; if (Number(e.target.value) < 0) delete next[p.id]; else next[p.id] = Number(e.target.value); setLocks(next); invalidate(); }}><option value={-1}>No lock</option>{labels.map((label, i) => <option value={i} key={i}>{label}</option>)}</select></label>)}</details>
      <button className="button primary" type="button" disabled={missing.length > 0} onClick={generate}>Generate teams</button>
      {options.slice(page, page + 3).map((suggestion, index) => <section className="balance-option" key={page + index} aria-label={`Option ${page + index + 1}`}><h3>Option {page + index + 1}</h3><Summary suggestion={suggestion} labels={labels} />{suggestion.teams.map((t, i) => <p key={i}><strong>{labels[i]}:</strong> {t.players.map(p => players.find(a => a.id === p.id)?.name).join(", ")}</p>)}<button className="button" type="button" onClick={() => { onAssign(new Map(suggestion.teams.flatMap((t, i) => t.players.map(p => [p.id, i] as const)))); setChosen(true); }}>Choose option {page + index + 1}</button></section>)}
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
