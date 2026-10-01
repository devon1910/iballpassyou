"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateAppearanceStatsAction } from "@/app/app/actions";
import type { Appearance } from "@/types/domain";

export function SessionPlayerStats({ groupId, sessionId, appearances }: {
  groupId: string;
  sessionId: string;
  appearances: Appearance[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [goals, setGoals] = useState("0");
  const [assists, setAssists] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<Record<string, { goals: number; assists: number }>>({});

  const startEdit = (appearance: Appearance) => {
    if (saving) return;
    setEditingId(appearance.playerId);
    setGoals(String(saved[appearance.playerId]?.goals ?? appearance.goals));
    setAssists(String(saved[appearance.playerId]?.assists ?? appearance.assists));
    setError("");
  };

  const save = async (event: FormEvent<HTMLFormElement>, playerId: string) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const nextGoals = Number(goals);
      const nextAssists = Number(assists);
      const result = await updateAppearanceStatsAction({ groupId, sessionId, playerId, goals: nextGoals, assists: nextAssists });
      if (!result.ok) { setError(result.error); return; }
      setSaved((current) => ({ ...current, [playerId]: { goals: nextGoals, assists: nextAssists } }));
      setEditingId(null);
      router.refresh();
    } catch {
      setError("Couldn’t save these stats. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return <div className="list">{appearances.map((appearance) => {
    const current = saved[appearance.playerId] ?? appearance;
    const editing = editingId === appearance.playerId;
    return <div className="session-stat-row" key={appearance.playerId}>
      <div className="list-row">
        <strong>{appearance.playerName}</strong>
        <div className="session-stat-summary">
          <span className="mono muted">{current.goals}G {current.assists}A</span>
          <button className="text-link" type="button" disabled={saving} onClick={() => editing ? setEditingId(null) : startEdit(appearance)} aria-label={`${editing ? "Cancel editing" : "Edit stats for"} ${appearance.playerName}`}>{editing ? "Cancel" : "Edit"}</button>
        </div>
      </div>
      {editing && <form className="session-stat-editor" onSubmit={(event) => save(event, appearance.playerId)}>
        <div className="session-stat-fields">
          <label className="field"><span className="field-label">Goals</span><input className="input" type="number" inputMode="numeric" min="0" max="2147483647" step="1" required value={goals} disabled={saving} onChange={(event) => setGoals(event.target.value)} aria-label={`${appearance.playerName} goals`} /></label>
          <label className="field"><span className="field-label">Assists</span><input className="input" type="number" inputMode="numeric" min="0" max="2147483647" step="1" required value={assists} disabled={saving} onChange={(event) => setAssists(event.target.value)} aria-label={`${appearance.playerName} assists`} /></label>
        </div>
        {error && <p className="notice" role="alert">{error}</p>}
        <button className="button small" type="submit" disabled={saving || goals === "" || assists === "" || (Number(goals) === current.goals && Number(assists) === current.assists)}>{saving ? "Saving…" : "Save stats"}</button>
      </form>}
    </div>;
  })}</div>;
}
