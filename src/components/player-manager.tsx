"use client";
import { type FormEvent, useState } from "react";
import type { Player } from "@/types/domain";
import { InlineSpinner } from "@/components/inline-spinner";
import { addPlayerAction, setPlayerActiveAction } from "@/app/app/actions";
import { BalancingProfileEditor } from "@/components/balancing-profile-editor";

const readyToBalance = (player: Player) => Boolean(player.balancing?.primaryPosition && player.balancing.skillLevel);

export function PlayerManager({ initial, groupId }: { initial: Player[]; groupId: string }) {
  const [players, setPlayers] = useState(initial);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pendingLabel, setPendingLabel] = useState("");
  const active = players.filter(player => player.active);
  const configured = active.filter(readyToBalance).length;
  const add = async (event: FormEvent) => {
    event.preventDefault(); const clean = name.trim(); if (!clean) return;
    setError(""); setPendingLabel(`Adding ${clean}`);
    try {
      const result = await addPlayerAction(groupId, clean);
      if (!result.ok) { setError(result.error); return; }
      setPlayers(current => [...current, { id: result.id, name: clean, active: true }]); setName("");
    } catch (caught) { console.error("Add player failed", caught); setError("Couldn’t add the player. Try again."); }
    finally { setPendingLabel(""); }
  };
  const toggle = async (player: Player) => {
    setError(""); setPendingLabel(`${player.active ? "Deactivating" : "Reactivating"} ${player.name}`);
    try {
      const result = await setPlayerActiveAction(groupId, player.id, !player.active);
      if (!result.ok) { setError(result.error); return; }
      setPlayers(current => current.map(item => item.id === player.id ? { ...item, active: !item.active } : item));
    } catch (caught) { console.error("Player status update failed", caught); setError("Couldn’t update the player. Try again."); }
    finally { setPendingLabel(""); }
  };
  const pending = Boolean(pendingLabel);
  return <>
    <section className="balance-admin-intro" aria-labelledby="balance-setup-title">
      <p className="eyebrow">Team balancing setup</p>
      <h2 id="balance-setup-title">{configured} of {active.length} active players ready</h2>
      <p>Add each player’s usual position and private Skill Level once. When you balance a session, only missing attendees will be shown again.</p>
      <div className="balance-progress" role="progressbar" aria-label="Balancing profiles completed" aria-valuemin={0} aria-valuemax={active.length} aria-valuenow={configured}><span style={{ width: `${active.length ? configured / active.length * 100 : 0}%` }} /></div>
      <small>Skill Level helps create teams. It does not change Performance Rating or public leaderboards.</small>
    </section>
    {error && <p className="notice error" role="alert">{error}</p>}
    <form className="button-row" onSubmit={add} aria-busy={pending}>
      <input className="input" disabled={pending} value={name} onChange={event => setName(event.target.value)} placeholder="Player name" aria-label="Player name" />
      <button className="button primary small" disabled={pending || !name.trim()}>{pendingLabel.startsWith("Adding ") && <InlineSpinner />}Add</button>
    </form>
    <div className="player-management-list">{players.map(player => {
      const ready = readyToBalance(player);
      return <article className="player-management-card" key={player.id}>
        <div className="player-management-head">
          <div><strong>{player.name}</strong><span className={`profile-status ${ready ? "ready" : "missing"}`}>{ready ? "Ready to balance" : "Needs balancing details"}</span></div>
          <button className="text-link" disabled={pending} onClick={() => toggle(player)}>{pendingLabel.endsWith(player.name) && <InlineSpinner />}{player.active ? "Deactivate" : "Reactivate"}</button>
        </div>
        <details className="player-profile-details">
          <summary>{ready ? `Edit ${player.name}’s balancing details` : `Set up ${player.name} for balancing`}</summary>
          <BalancingProfileEditor groupId={groupId} playerId={player.id} name={player.name} initial={player.balancing} onSaved={balancing => setPlayers(current => current.map(item => item.id === player.id ? { ...item, balancing } : item))} />
        </details>
      </article>;
    })}</div>
  </>;
}
