"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Group, SessionFormat } from "@/types/domain";
import { localDateInput, preferredSchedule } from "@/lib/time";
import { matchRoster } from "@/lib/roster";
import { parseTeamSheet, shuffledTeamAssignments, unassignedPlayersLabel } from "@/lib/teams";
import { saveSessionAction } from "@/app/app/actions";
import { ActionOverlay } from "@/components/action-overlay";
import { InfoTip } from "@/components/info-tip";

type DraftPlayer = {
  id: string;
  name: string;
  selected: boolean;
  team: number;
  goals: number;
  assists: number;
  isNew?: boolean;
};

type Draft = {
  clientSessionId: string;
  step: number;
  mode: "roster" | "paste";
  date: string;
  time: string;
  format: SessionFormat;
  players: DraftPlayer[];
  paste: string;
  labels: string[];
  wins: number[];
};

const TEAM_TONES = ["red", "black", "blue", "amber", "green", "purple", "orange", "white"] as const;

function teamTone(label: string, index: number) {
  const normalized = label.toLocaleLowerCase();
  const namedTone = TEAM_TONES.find((tone) => normalized.includes(tone));
  return namedTone ?? TEAM_TONES[index % TEAM_TONES.length];
}

function Counter({ value, setValue, label }: { value: number; setValue: (value: number) => void; label: string }) {
  return (
    <div className="stepper">
      <button type="button" disabled={value === 0} onClick={() => setValue(Math.max(0, value - 1))} aria-label={`Remove ${label}`}>−</button>
      <output aria-label={`${label}: ${value}`}>{value}</output>
      <button type="button" onClick={() => setValue(value + 1)} aria-label={`Add ${label}`}>+</button>
    </div>
  );
}

function FormatHelp() {
  return (
    <InfoTip label="Explain session formats">
      <strong>No teams</strong> records attendance and player stats only. <strong>Fixed teams</strong> uses exactly two teams and one overall result. <strong>Set play</strong> supports 2–8 teams and records how many mini-matches each team won.
    </InfoTip>
  );
}

function SessionDateField({ value, max, onChange }: { value: string; max: string; onChange: (value: string) => void }) {
  const [year, month, day] = value.split("-");
  const displayDate = year && month && day ? `${day}/${month}/${year.slice(-2)}` : "DD/MM/YY";

  return (
    <label className="field date-field">
      <span className="field-label">Session date</span>
      <span className="date-picker-control">
        <span className="date-picker-value" aria-hidden="true">{displayDate}</span>
        <svg className="date-picker-icon" aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="16" rx="1" /><path d="M7 3v4M17 3v4M3 10h18" /></svg>
        <input className="date-picker-native" type="date" lang="en-GB" required max={max} value={value} aria-label="Session date, DD/MM/YY" aria-describedby="session-date-format" onChange={(event) => { const next = event.target.value; if (!next || next <= max) onChange(next); }} />
      </span>
      <small className="date-format-hint" id="session-date-format">DD/MM/YY</small>
    </label>
  );
}

export function SessionLogger({ group }: { group: Group }) {
  const router = useRouter();
  const schedule = preferredSchedule(group.schedules, new Date(), group.timezone);
  const latestSessionDate = localDateInput(new Date(), group.timezone);
  const activePlayers = useMemo(() => group.players.filter((player) => player.active), [group.players]);
  const lastSession = group.sessions[0];
  const lastPlayerIds = useMemo(
    () => new Set(lastSession?.appearances.map((appearance) => appearance.playerId) ?? []),
    [lastSession],
  );
  const initial = useMemo<Draft>(() => ({
    clientSessionId: crypto.randomUUID(),
    step: 1,
    mode: activePlayers.length ? "roster" : "paste",
    date: latestSessionDate,
    time: schedule?.kickoffTime ?? "18:00",
    format: group.defaultSessionFormat,
    players: activePlayers.map((player) => ({ id: player.id, name: player.name, selected: false, team: -1, goals: 0, assists: 0 })),
    paste: "",
    labels: ["Team 1", "Team 2"],
    wins: [0, 0],
  }), [activePlayers, group.defaultSessionFormat, latestSessionDate, schedule?.kickoffTime]);
  const [draft, setDraft] = useState(initial);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTeam, setActiveTeam] = useState(0);
  const [teamSheet, setTeamSheet] = useState("");
  const [teamMessage, setTeamMessage] = useState("");
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [playerMessage, setPlayerMessage] = useState("");
  const [navigationLabel, setNavigationLabel] = useState("");
  const key = `ibpy-session-${group.id}`;

  useEffect(() => {
    if (!navigationLabel) return;
    const timer = window.setTimeout(() => setNavigationLabel(""), 10000);
    return () => window.clearTimeout(timer);
  }, [navigationLabel]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const restored = { ...initial, ...JSON.parse(saved) } as Draft;
          const labels = Array.isArray(restored.labels) ? restored.labels.slice(0, 8) : initial.labels;
          while (labels.length < 2) labels.push(`Team ${labels.length + 1}`);
          const count = restored.format === "fixed_teams" ? 2 : labels.length;
          restored.labels = labels.slice(0, count);
          restored.wins = Array.from({ length: count }, (_, index) => Number(restored.wins?.[index] ?? 0));
          restored.players = restored.players.map((player) => ({ ...player, team: player.team >= 0 && player.team < count ? player.team : -1 }));
          if (restored.date > latestSessionDate) restored.date = latestSessionDate;
          if (!activePlayers.length && restored.mode === "roster") restored.mode = "paste";
          setDraft(restored);
        } catch {
          localStorage.removeItem(key);
        }
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activePlayers.length, initial, key, latestSessionDate]);

  useEffect(() => {
    if (ready) localStorage.setItem(key, JSON.stringify(draft));
  }, [draft, key, ready]);

  const selected = draft.players.filter((player) => player.selected);
  const statsGroups = draft.format === "none"
    ? []
    : draft.labels.map((label, team) => ({
        label,
        team,
        tone: teamTone(label, team),
        players: selected.filter((player) => player.team === team),
      }));
  const unassigned = selected.filter((player) => player.team < 0 || player.team >= draft.labels.length);
  const unassignedLabel = unassignedPlayersLabel(unassigned.map((player) => player.name));
  const canReuseLastTeams = Boolean(lastSession?.teams.length && (draft.format === "sets" ? lastSession.teams.length >= 2 && lastSession.teams.length <= 8 : lastSession.teams.length === 2));
  const steps = draft.format === "none" ? [1, 3, 4] : [1, 2, 3, 4];
  const updatePlayer = (id: string, update: Partial<DraftPlayer>) => {
    setDraft((current) => ({ ...current, players: current.players.map((player) => player.id === id ? { ...player, ...update } : player) }));
  };
  const addNewPlayer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newPlayerName.trim();
    if (!name) return;
    const normalized = name.toLocaleLowerCase();
    const rosterPlayer = group.players.find((player) => player.name.trim().toLocaleLowerCase() === normalized);
    const draftPlayer = draft.players.find((player) => player.name.trim().toLocaleLowerCase() === normalized);
    if (draftPlayer) {
      updatePlayer(draftPlayer.id, { selected: true });
      setPlayerMessage(`${draftPlayer.name} is already listed and has been selected.`);
    } else if (rosterPlayer) {
      setDraft((current) => ({ ...current, players: [...current.players, { id: rosterPlayer.id, name: rosterPlayer.name, selected: true, team: -1, goals: 0, assists: 0 }] }));
      setPlayerMessage(`${rosterPlayer.name} is already on the roster and has been selected.`);
    } else {
      setDraft((current) => ({ ...current, players: [...current.players, { id: `new-${crypto.randomUUID()}`, name, selected: true, team: -1, goals: 0, assists: 0, isNew: true }] }));
      setPlayerMessage(`${name} added to this session.`);
    }
    setNewPlayerName("");
  };
  const changeFormat = (format: SessionFormat) => {
    if (format === "fixed_teams") setActiveTeam((current) => Math.min(current, 1));
    setDraft((current) => {
      const count = format === "fixed_teams" ? 2 : Math.max(2, current.labels.length);
      return {
        ...current,
        format,
        labels: Array.from({ length: count }, (_, index) => current.labels[index] || `Team ${index + 1}`),
        wins: Array.from({ length: count }, (_, index) => current.wins[index] ?? 0),
        players: current.players.map((player) => ({ ...player, team: player.team < count ? player.team : -1 })),
      };
    });
  };
  const setTeamCount = (requested: number) => {
    const count = Math.min(8, Math.max(2, requested));
    setActiveTeam((current) => Math.min(current, count - 1));
    setTeamMessage("");
    setDraft((current) => ({
      ...current,
      labels: Array.from({ length: count }, (_, index) => current.labels[index] || `Team ${index + 1}`),
      wins: Array.from({ length: count }, (_, index) => current.wins[index] ?? 0),
      players: current.players.map((player) => ({ ...player, team: player.team < count ? player.team : -1 })),
    }));
  };
  const assignEvenly = () => {
    const assignments = shuffledTeamAssignments(selected.map((player) => player.id), draft.labels.length);
    setDraft((current) => ({
      ...current,
      players: current.players.map((player) => assignments.has(player.id) ? { ...player, team: assignments.get(player.id)! } : player),
    }));
    setTeamMessage(`${selected.length} players shuffled into ${draft.labels.length} balanced teams.`);
  };
  const reuseLastTeams = () => {
    if (!lastSession?.teams.length) return;
    const labels = lastSession.teams.map((team) => team.label);
    if (draft.format === "fixed_teams" && labels.length !== 2) {
      setError("The previous session did not use exactly two teams.");
      return;
    }
    const teamById = new Map(lastSession.teams.map((team, index) => [team.id, index]));
    const assignments = new Map(lastSession.appearances.flatMap((appearance) => {
      const team = appearance.teamId ? teamById.get(appearance.teamId) : undefined;
      return team === undefined ? [] : [[appearance.playerId, team] as const];
    }));
    setActiveTeam(0);
    setError("");
    setDraft((current) => ({
      ...current,
      labels,
      wins: labels.map(() => 0),
      players: current.players.map((player) => player.selected ? { ...player, team: assignments.get(player.id) ?? -1 } : player),
    }));
    setTeamMessage("Previous team assignments applied. Any new attendees remain unassigned.");
  };
  const applyTeamSheet = () => {
    const parsed = parseTeamSheet(teamSheet);
    if (draft.format === "fixed_teams" && parsed.teams.length !== 2) parsed.errors.push("Fixed-team sessions need exactly two team headings.");
    if (parsed.errors.length) {
      setError(parsed.errors[0]);
      return;
    }
    const availablePlayers = draft.players.map((player) => ({ id: player.id, name: player.name, active: true }));
    const assignments = new Map<string, number>();
    const problemNames: string[] = [];
    for (const [teamIndex, team] of parsed.teams.entries()) {
      for (const result of matchRoster(team.names.join("\n"), availablePlayers)) {
        if (result.status !== "matched") {
          problemNames.push(result.input);
          continue;
        }
        if (assignments.has(result.player.id)) problemNames.push(result.input);
        else assignments.set(result.player.id, teamIndex);
      }
    }
    if (problemNames.length) {
      setError(`Check missing, ambiguous, or repeated names: ${problemNames.join(", ")}.`);
      return;
    }
    setActiveTeam(0);
    setError("");
    setDraft((current) => ({
      ...current,
      labels: parsed.teams.map((team) => team.label),
      wins: parsed.teams.map(() => 0),
      players: current.players.map((player) => assignments.has(player.id)
        ? { ...player, selected: true, team: assignments.get(player.id)! }
        : player.selected ? { ...player, team: -1 } : player),
    }));
    setTeamMessage(`${assignments.size} players assigned from the pasted team sheet.`);
  };
  const next = () => {
    setError("");
    if (draft.step === 2 && unassigned.length) {
      setError(unassigned.length < 3
        ? `${unassignedLabel} Assign before continuing.`
        : `Assign ${unassigned.length} remaining players before continuing.`);
      return;
    }
    const index = steps.indexOf(draft.step);
    if (index < steps.length - 1) setDraft((current) => ({ ...current, step: steps[index + 1] }));
  };
  const back = () => {
    setError("");
    const index = steps.indexOf(draft.step);
    if (index > 0) setDraft((current) => ({ ...current, step: steps[index - 1] }));
    else {
      setNavigationLabel("Going back");
      router.back();
    }
  };
  const parsePaste = () => {
    setError("");
    const matched = matchRoster(draft.paste, group.players);
    const ambiguous = matched.filter((row) => row.status === "ambiguous");
    if (ambiguous.length) {
      setError(`Check these ambiguous names: ${ambiguous.map((row) => row.input).join(", ")}.`);
      return;
    }
    const existing = new Set(draft.players.map((player) => player.id));
    const additions: DraftPlayer[] = [];
    for (const row of matched) {
      if (row.status === "matched") updatePlayer(row.player.id, { selected: true });
      else {
        const id = `new-${row.input.toLowerCase().replace(/\W+/g, "-")}`;
        if (!existing.has(id)) additions.push({ id, name: row.input, selected: true, team: 0, goals: 0, assists: 0, isNew: true });
      }
    }
    setDraft((current) => ({ ...current, players: [...current.players, ...additions] }));
  };
  const save = async () => {
    const cleanLabels = draft.labels.map((label) => label.trim());
    if (draft.format !== "none" && (cleanLabels.some((label) => !label) || new Set(cleanLabels.map((label) => label.toLocaleLowerCase())).size !== cleanLabels.length)) {
      setError("Give every team a different name before saving.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const result = await saveSessionAction({
        group_id: group.id,
        client_session_id: draft.clientSessionId,
        date: draft.date,
        time: draft.time,
        timezone: group.timezone,
        format: draft.format,
        teams: draft.format === "none" ? [] : cleanLabels.map((label, index) => ({ client_key: String(index), label, set_wins: draft.wins[index] })),
        players: selected.map((player) => ({
          ...(player.isNew ? { name: player.name } : { player_id: player.id }),
          team_key: draft.format === "none" ? undefined : String(player.team),
          goals: player.goals,
          assists: player.assists,
        })),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      localStorage.removeItem(key);
      setSaving(false);
      setNavigationLabel("Opening leaderboard");
      router.push(`/app/groups/${group.id}/leaderboard?saved=1&session=${encodeURIComponent(result.id)}`);
    } catch (caught) {
      console.error("Session save request failed", caught);
      setError("The server did not complete the save. Your draft is safe. Refresh and try again.");
    } finally {
      setSaving(false);
    }
  };
  const progress = `${draft.step === 1 ? "Players" : draft.step === 2 ? "Teams" : draft.step === 3 ? "Stats" : "Result"} · ${steps.indexOf(draft.step) + 1} of ${steps.length}`;

  if (!ready) return <ActionOverlay label="Restoring session draft" />;

  return (
    <>
      <ActionOverlay active={saving || Boolean(navigationLabel)} label={saving ? "Saving session" : navigationLabel} />
      <div className="page-head compact">
        <p className="eyebrow">{group.name}</p>
        <h1>{draft.step === 1 ? "WHO PLAYED?" : draft.step === 2 ? "PICK TEAMS" : draft.step === 3 ? "LOG THE STATS" : "RECORD RESULT"}</h1>
      </div>

      {draft.step === 1 && <section>
        <div className="form-stack" style={{ marginBottom: 22 }}>
          <SessionDateField value={draft.date} max={latestSessionDate} onChange={(date) => setDraft((current) => ({ ...current, date }))} />
          <label className="field"><span className="field-label">Kickoff time</span><input className="input" type="time" value={draft.time} onChange={(event) => setDraft((current) => ({ ...current, time: event.target.value }))} /></label>
          <div className="field">
            <span className="field-label with-tip">Format <FormatHelp /></span>
            <select className="select" aria-label="Session format" value={draft.format} onChange={(event) => changeFormat(event.target.value as SessionFormat)}>
              <option value="none">No teams</option>
              <option value="fixed_teams">Fixed teams · one result</option>
              <option value="sets">Set play · multiple teams</option>
            </select>
          </div>
        </div>
        <div className="tabs">
          <button type="button" disabled={!activePlayers.length} className={draft.mode === "roster" ? "active" : ""} onClick={() => setDraft((current) => ({ ...current, mode: "roster" }))}>From roster</button>
          <button type="button" className={draft.mode === "paste" ? "active" : ""} onClick={() => setDraft((current) => ({ ...current, mode: "paste" }))}>Paste list</button>
        </div>
        {draft.mode === "roster" ? <>
          <div className="roster-list">{draft.players.map((player) => <label className="roster-row" key={player.id}><input type="checkbox" checked={player.selected} onChange={(event) => updatePlayer(player.id, { selected: event.target.checked })} /><span className="toggle-box">✓</span><span className="roster-name">{player.name}</span>{player.isNew && <span className="mono muted roster-status">New player</span>}</label>)}</div>
          <p className="count">{selected.length} playing</p>
          <div className="shortcuts">
            <button className="chip" type="button" disabled={!lastPlayerIds.size} title={lastPlayerIds.size ? undefined : "No previous session yet"} onClick={() => setDraft((current) => ({ ...current, players: current.players.map((player) => ({ ...player, selected: lastPlayerIds.has(player.id) })) }))}>Use last session</button>
            <button className="chip" type="button" disabled={!draft.players.length} onClick={() => setDraft((current) => ({ ...current, players: current.players.map((player) => ({ ...player, selected: true })) }))}>Select all</button>
            <button className="chip" type="button" disabled={!selected.length} onClick={() => setDraft((current) => ({ ...current, players: current.players.map((player) => ({ ...player, selected: false })) }))}>Clear</button>
          </div>
        </> : <>
          <label className="field"><span className="field-label">Paste player list</span><textarea className="textarea" value={draft.paste} onChange={(event) => setDraft((current) => ({ ...current, paste: event.target.value }))} placeholder={'1. Davidson\n2. Sean\n3. Tobi'} /></label>
          <button className="button" type="button" disabled={!draft.paste.trim()} onClick={parsePaste} style={{ marginTop: 12 }}>Check names</button>
          {selected.length > 0 && <div className="roster-list" style={{ marginTop: 20 }}>{selected.map((player) => <div className="roster-row" key={player.id}><span className="toggle-box selected">✓</span><span>{player.name}</span><span className="mono muted roster-status">{player.isNew ? "New player" : "Existing"}</span></div>)}</div>}
        </>}
        <div className="add-player-control">
          {!addingPlayer ? <button className="add-player-trigger" type="button" onClick={() => { setAddingPlayer(true); setPlayerMessage(""); }}><span aria-hidden="true">+</span> Add new player</button> : <form className="add-player-form" onSubmit={addNewPlayer}>
            <label className="sr-only" htmlFor="new-session-player">New player name</label>
            <input id="new-session-player" className="input" autoFocus maxLength={80} value={newPlayerName} onChange={(event) => setNewPlayerName(event.target.value)} placeholder="Player name" />
            <button className="button primary small" type="submit" disabled={!newPlayerName.trim()}>Add</button>
            <button className="add-player-close" type="button" aria-label="Close add player" onClick={() => { setAddingPlayer(false); setNewPlayerName(""); }}>×</button>
          </form>}
          {playerMessage && <p className="add-player-message" role="status">{playerMessage}</p>}
        </div>
      </section>}

      {draft.step === 2 && <section>
        <div className="section-row team-heading">
          <div><span className="section-label with-tip">Teams <InfoTip label="Explain team assignment">For pre-arranged teams, reuse the previous teams or paste a grouped team sheet. On the pitch, choose a team and tap each player going into it.</InfoTip></span><strong>{draft.labels.length} teams · {selected.length} players</strong></div>
          {draft.format === "sets" && <div className="mini-stepper" aria-label="Number of teams"><button type="button" disabled={draft.labels.length <= 2} onClick={() => setTeamCount(draft.labels.length - 1)} aria-label="Remove a team">−</button><output>{draft.labels.length}</output><button type="button" disabled={draft.labels.length >= 8} onClick={() => setTeamCount(draft.labels.length + 1)} aria-label="Add a team">+</button></div>}
        </div>
        {draft.format === "fixed_teams" && <p className="notice">Fixed-team sessions always use exactly two teams.</p>}
        <div className="team-quick-actions">
          <button className="button" type="button" onClick={assignEvenly}>Shuffle evenly</button>
          <button className="button" type="button" disabled={!canReuseLastTeams} onClick={reuseLastTeams}>Reuse last teams</button>
        </div>
        <details className="team-sheet">
          <summary>Paste pre-arranged teams</summary>
          <p className="muted">Put each team name before a colon, followed by its players.</p>
          <textarea className="textarea" aria-label="Grouped team sheet" value={teamSheet} onChange={(event) => setTeamSheet(event.target.value)} placeholder={'Red:\nAda\nBola\n\nBlue:\nChidi\nDele'} />
          <button className="button" type="button" disabled={!teamSheet.trim()} onClick={applyTeamSheet}>Apply team sheet</button>
        </details>
        {teamMessage && <p className="notice" role="status">{teamMessage}</p>}
        <div className="team-target-grid">{draft.labels.map((label, index) => <div className={`team-target team-tone-${teamTone(label, index)} ${activeTeam === index ? "active" : ""}`} key={index}>
          <input className="input" aria-label={`Team ${index + 1} label`} value={label} onChange={(event) => setDraft((current) => ({ ...current, labels: current.labels.map((value, position) => position === index ? event.target.value : value) }))} />
          <button type="button" onClick={() => setActiveTeam(index)} aria-pressed={activeTeam === index}><strong>Assign here</strong><span>{selected.filter((player) => player.team === index).length} players</span></button>
        </div>)}</div>
        <div className="assignment-head"><p>Tap players to put them in <strong>{draft.labels[activeTeam]}</strong>.</p><span>{unassignedLabel}</span></div>
        {unassigned.length > 0 && <button className="chip assign-remaining" type="button" onClick={() => { setDraft((current) => ({ ...current, players: current.players.map((player) => player.selected && player.team < 0 ? { ...player, team: activeTeam } : player) })); setTeamMessage(`${unassigned.length} remaining players moved to ${draft.labels[activeTeam]}.`); }}>Assign all remaining here</button>}
        <div className="assignment-board">{selected.map((player) => {
          const assignedTone = player.team >= 0 ? `team-tone-${teamTone(draft.labels[player.team], player.team)}` : "";
          return <button className={`assignment-player ${assignedTone} ${player.team === activeTeam ? "active" : ""} ${player.team < 0 ? "unassigned" : ""}`} type="button" key={player.id} onClick={() => updatePlayer(player.id, { team: activeTeam })}><span>{player.name}</span><small>{player.team < 0 ? "Unassigned" : draft.labels[player.team]}</small></button>;
        })}</div>
      </section>}

      {draft.step === 3 && <section>
        <p className="lede">Enter each player’s totals for the whole session.</p>
        {draft.format === "none"
          ? selected.map((player) => <div className="player-block" key={player.id}><h3>{player.name}</h3><div className="counter-line"><span>Goals</span><Counter label={`a goal for ${player.name}`} value={player.goals} setValue={(goals) => updatePlayer(player.id, { goals })} /></div><div className="counter-line"><span>Assists</span><Counter label={`an assist for ${player.name}`} value={player.assists} setValue={(assists) => updatePlayer(player.id, { assists })} /></div></div>)
          : <div className="team-stats-list">{statsGroups.map((team) => <section className={`team-stats-group team-tone-${team.tone}`} key={team.team} aria-labelledby={`team-stats-${team.team}`}>
              <header className="team-stats-head">
                <div><span className="team-stats-swatch" /><h2 id={`team-stats-${team.team}`}>{team.label}</h2></div>
                <span>{team.players.length} player{team.players.length === 1 ? "" : "s"}</span>
              </header>
              <div className="team-stats-players">{team.players.map((player) => <div className="player-block" key={player.id}><h3>{player.name}</h3><div className="counter-line"><span>Goals</span><Counter label={`a goal for ${player.name}`} value={player.goals} setValue={(goals) => updatePlayer(player.id, { goals })} /></div><div className="counter-line"><span>Assists</span><Counter label={`an assist for ${player.name}`} value={player.assists} setValue={(assists) => updatePlayer(player.id, { assists })} /></div></div>)}</div>
            </section>)}</div>}
      </section>}

      {draft.step === 4 && <section>
        {draft.format === "none" ? <p className="notice">No team result for this session. Goals and assists will still count.</p> : draft.format === "fixed_teams" ? <div className="form-stack">{draft.labels.map((label, index) => <label className="radio-row" key={index}><input type="radio" name="winner" checked={draft.wins[index] === 1} onChange={() => setDraft((current) => ({ ...current, wins: current.wins.map((_, position) => position === index ? 1 : 0) }))} /><span>{label} won</span></label>)}<label className="radio-row"><input type="radio" name="winner" checked={draft.wins.every((wins) => wins === 0)} onChange={() => setDraft((current) => ({ ...current, wins: current.wins.map(() => 0) }))} /><span>No winner</span></label></div> : <>
          <span className="section-label with-tip">Set wins <InfoTip label="Explain set wins">A set is one completed mini-match. Add every set won by each team; there is no two-set limit.</InfoTip></span>
          {draft.labels.map((label, index) => <div className="counter-line" key={index}><strong>{label}</strong><Counter label={`a set win for ${label}`} value={draft.wins[index]} setValue={(value) => setDraft((current) => ({ ...current, wins: current.wins.map((wins, position) => position === index ? value : wins) }))} /></div>)}
        </>}
      </section>}

      {error && <p className="notice error" role="alert">{error}</p>}
      <div className="sticky-action">
        <button className="text-link" type="button" onClick={back}>Back</button>
        <span className="step-progress">{progress}</span>
        <button className="button primary" type="button" disabled={saving || (draft.step === 1 && selected.length === 0)} onClick={draft.step === 4 ? save : next}>{saving ? "Saving…" : draft.step === 4 ? "Save session" : "Continue"}</button>
      </div>
    </>
  );
}
