"use client";
import { useState } from "react";
import { EMPTY_PROFILE, POSITIONS, type BalancingProfile, type Position } from "@/lib/balance/types";
import { saveBalancingProfileAction } from "@/app/app/actions";

const positionLabel = (position: Position) => position[0].toUpperCase() + position.slice(1);

export function BalancingProfileEditor({ groupId, playerId, name, initial, onSaved, draftOnly = false, continueLabel = false }: {
  groupId: string; playerId: string; name: string; initial?: BalancingProfile;
  onSaved: (profile: BalancingProfile) => void; draftOnly?: boolean; continueLabel?: boolean;
}) {
  const [profile, setProfile] = useState(initial ?? EMPTY_PROFILE);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const save = async () => {
    setPending(true); setError(""); setSaved(false);
    try {
      const result = draftOnly ? { ok: true as const } : await saveBalancingProfileAction(groupId, playerId, profile);
      if (!result.ok) { setError(result.error ?? "Couldn’t save details."); return; }
      onSaved(profile);
      setSaved(true);
    } finally { setPending(false); }
  };
  return <fieldset className="balance-profile form-stack" disabled={pending}>
    <legend>{name}</legend>
    <label className="field">Primary position<small>Where {name} usually plays</small><select aria-label="Primary position" className="select" value={profile.primaryPosition ?? ""} onChange={e => setProfile({ ...profile, primaryPosition: e.target.value as Position })}><option value="" disabled>Choose position</option>{POSITIONS.map(p => <option key={p} value={p}>{positionLabel(p)}</option>)}</select></label>
    <label className="field">Secondary position <span className="optional-label">Optional</span><small>A realistic alternative position</small><select aria-label="Secondary position" className="select" value={profile.secondaryPosition ?? ""} onChange={e => setProfile({ ...profile, secondaryPosition: e.target.value as Position || null })}><option value="">None</option>{POSITIONS.map(p => <option key={p} value={p}>{positionLabel(p)}</option>)}</select></label>
    <label className="radio-row"><input type="checkbox" checked={profile.keeperCapable} onChange={e => setProfile({ ...profile, keeperCapable: e.target.checked })} />Keeper capable</label>
    <label className="field">Skill Level<small>Your private 1–5 estimate of overall football strength</small><select aria-label="Skill Level" className="select" value={profile.skillLevel ?? ""} onChange={e => setProfile({ ...profile, skillLevel: Number(e.target.value) })}><option value="" disabled>Choose Skill Level</option>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{"★".repeat(n)} · Level {n}</option>)}</select></label>
    <small>Saved once for future team suggestions. You can update it later; goals, assists, and Performance Rating do not set this value.</small>
    {error && <p role="alert">{error}</p>}
    {saved && <p role="status">Balancing details saved.</p>}
    <button className="button" type="button" disabled={pending || !profile.primaryPosition || !profile.skillLevel} onClick={save}>{pending ? "Saving…" : continueLabel ? "Save and set up next player" : "Save balancing details"}</button>
  </fieldset>;
}
