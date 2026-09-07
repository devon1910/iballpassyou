"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Group, SessionFormat } from "@/types/domain";
import { localDateInput, preferredSchedule } from "@/lib/time";
import { matchRoster } from "@/lib/roster";
import { shuffledTeamAssignments } from "@/lib/teams";
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

export function SessionLogger({ group }: { group: Group }) {
  const router = useRouter();
  const schedule = preferredSchedule(group.schedules, new Date(), group.timezone);
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
    date: localDateInput(new Date(), group.timezone),
    time: schedule?.kickoffTime ?? "18:00",
    format: group.defaultSessionFormat,
    players: activePlayers.map((player) => ({ id: player.id, name: player.name, selected: false, team: 0, goals: 0, assists: 0 })),
    paste: "",
    labels: ["Team 1", "Team 2"],
    wins: [0, 0],
  }), [activePlayers, group.defaultSessionFormat, group.timezone, schedule?.kickoffTime]);
  const [draft, setDraft] = useState(initial);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const key = `ibpy-session-${group.id}`;

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
          restored.players = restored.players.map((player) => ({ ...player, team: Math.min(Math.max(player.team ?? 0, 0), count - 1) }));
          if (!activePlayers.length && restored.mode === "roster") restored.mode = "paste";
          setDraft(restored);
        } catch {
          localStorage.removeItem(key);
        }
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activePlayers.length, initial, key]);

  useEffect(() => {
    if (ready) localStorage.setItem(key, JSON.stringify(draft));
  }, [draft, key, ready]);

  const selected = draft.players.filter((player) => player.selected);
  const steps = draft.format === "none" ? [1, 3, 4] : [1, 2, 3, 4];
  const updatePlayer = (id: string, update: Partial<DraftPlayer>) => {
    setDraft((current) => ({ ...current, players: current.players.map((player) => player.id === id ? { ...player, ...update } : player) }));
  };
  const changeFormat = (format: SessionFormat) => {
    setDraft((current) => {
      const count = format === "fixed_teams" ? 2 : Math.max(2, current.labels.length);
      return {
        ...current,
        format,
        labels: Array.from({ length: count }, (_, index) => current.labels[index] || `Team ${index + 1}`),
        wins: Array.from({ length: count }, (_, index) => current.wins[index] ?? 0),
        players: current.players.map((player) => ({ ...player, team: player.team < count ? player.team : 0 })),
      };
    });
  };
  const setTeamCount = (requested: number) => {
    const count = Math.min(8, Math.max(2, requested));
    setDraft((current) => ({
      ...current,
      labels: Array.from({ length: count }, (_, index) => current.labels[index] || `Team ${index + 1}`),
      wins: Array.from({ length: count }, (_, index) => current.wins[index] ?? 0),
      players: current.players.map((player) => ({ ...player, team: player.team < count ? player.team : player.team % count })),
    }));
  };
  const assignEvenly = () => {
    const assignments = shuffledTeamAssignments(selected.map((player) => player.id), draft.labels.length);
    setDraft((current) => ({
      ...current,
      players: current.players.map((player) => assignments.has(player.id) ? { ...player, team: assignments.get(player.id)! } : player),
    }));
  };
  const next = () => {
    setError("");
    const index = steps.indexOf(draft.step);
    if (index < steps.length - 1) setDraft((current) => ({ ...current, step: steps[index + 1] }));
  };
  const back = () => {
    setError("");
    const index = steps.indexOf(draft.step);
    if (index > 0) setDraft((current) => ({ ...current, step: steps[index - 1] }));
    else router.back();
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
      router.push(`/app/groups/${group.id}/leaderboard?saved=1`);
    } catch (caught) {
      console.error("Session save request failed", caught);
      setError("The server did not complete the save. Your draft is safe—refresh and try again.");
    } finally {
      setSaving(false);
    }
  };
  const progress = `${draft.step === 1 ? "Players" : draft.step === 2 ? "Teams" : draft.step === 3 ? "Stats" : "Result"} · ${steps.indexOf(draft.step) + 1} of ${steps.length}`;

  if (!ready) return <ActionOverlay label="Restoring session draft" />;

  return (
    <>
      <ActionOverlay active={saving} label="Saving session" />
      <div className="page-head compact">
        <p className="eyebrow">{group.name}</p>
        <h1>{draft.step === 1 ? "WHO PLAYED?" : draft.step === 2 ? "PICK TEAMS" : draft.step === 3 ? "LOG THE STATS" : "RECORD RESULT"}</h1>
      </div>

      {draft.step === 1 && <section>
        <div className="form-stack" style={{ marginBottom: 22 }}>
          <label className="field"><span className="field-label">Session date</span><input className="input" type="date" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} /></label>
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
          <div className="roster-list">{draft.players.filter((player) => !player.isNew).map((player) => <label className="roster-row" key={player.id}><input type="checkbox" checked={player.selected} onChange={(event) => updatePlayer(player.id, { selected: event.target.checked })} /><span className="toggle-box">✓</span><span className="roster-name">{player.name}</span></label>)}</div>
          <p className="count">{selected.length} playing</p>
          <div className="shortcuts">
            <button className="chip" type="button" disabled={!lastPlayerIds.size} title={lastPlayerIds.size ? undefined : "No previous session yet"} onClick={() => setDraft((current) => ({ ...current, players: current.players.map((player) => ({ ...player, selected: lastPlayerIds.has(player.id) })) }))}>Use last session</button>
            <button className="chip" type="button" disabled={!activePlayers.length} onClick={() => setDraft((current) => ({ ...current, players: current.players.map((player) => ({ ...player, selected: !player.isNew })) }))}>Select all</button>
            <button className="chip" type="button" disabled={!selected.length} onClick={() => setDraft((current) => ({ ...current, players: current.players.map((player) => ({ ...player, selected: false })) }))}>Clear</button>
          </div>
        </> : <>
          <label className="field"><span className="field-label">Paste player list</span><textarea className="textarea" value={draft.paste} onChange={(event) => setDraft((current) => ({ ...current, paste: event.target.value }))} placeholder={'1. Davidson\n2. Sean\n3. Tobi'} /></label>
          <button className="button" type="button" disabled={!draft.paste.trim()} onClick={parsePaste} style={{ marginTop: 12 }}>Check names</button>
          {selected.length > 0 && <div className="roster-list" style={{ marginTop: 20 }}>{selected.map((player) => <div className="roster-row" key={player.id}><span className="toggle-box selected">✓</span><span>{player.name}</span><span className="mono muted roster-status">{player.isNew ? "New player" : "Existing"}</span></div>)}</div>}
        </>}
      </section>}

      {draft.step === 2 && <section>
        <div className="section-row team-heading">
          <div><span className="section-label with-tip">Teams <InfoTip label="Explain team assignment">Choose 2–8 teams for set play, then shuffle everyone into balanced teams. You can still move individual players afterwards.</InfoTip></span><strong>{draft.labels.length} teams · {selected.length} players</strong></div>
          {draft.format === "sets" && <div className="mini-stepper" aria-label="Number of teams"><button type="button" disabled={draft.labels.length <= 2} onClick={() => setTeamCount(draft.labels.length - 1)} aria-label="Remove a team">−</button><output>{draft.labels.length}</output><button type="button" disabled={draft.labels.length >= 8} onClick={() => setTeamCount(draft.labels.length + 1)} aria-label="Add a team">+</button></div>}
        </div>
        {draft.format === "fixed_teams" && <p className="notice">Fixed-team sessions always use exactly two teams.</p>}
        <button className="button team-shuffle" type="button" onClick={assignEvenly}>Shuffle evenly</button>
        <div className="team-columns">{draft.labels.map((label, index) => <div className="team-column" key={index}>
          <input className="input" aria-label={`Team ${index + 1} label`} value={label} onChange={(event) => setDraft((current) => ({ ...current, labels: current.labels.map((value, position) => position === index ? event.target.value : value) }))} />
          <span className="team-size">{selected.filter((player) => player.team === index).length} players</span>
          {selected.filter((player) => player.team === index).map((player) => <div className="team-player" key={player.id}>{player.name}</div>)}
        </div>)}</div>
        <details className="manual-teams"><summary>Fine-tune assignments</summary><div className="list">{selected.map((player) => <label className="team-player" key={player.id}>{player.name}<select value={player.team} onChange={(event) => updatePlayer(player.id, { team: Number(event.target.value) })}>{draft.labels.map((label, index) => <option value={index} key={index}>{label}</option>)}</select></label>)}</div></details>
      </section>}

      {draft.step === 3 && <section>
        <p className="lede">Enter each player’s totals for the whole session.</p>
        {selected.map((player) => <div className="player-block" key={player.id}><h3>{player.name}</h3><div className="counter-line"><span>Goals</span><Counter label={`a goal for ${player.name}`} value={player.goals} setValue={(goals) => updatePlayer(player.id, { goals })} /></div><div className="counter-line"><span>Assists</span><Counter label={`an assist for ${player.name}`} value={player.assists} setValue={(assists) => updatePlayer(player.id, { assists })} /></div></div>)}
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
