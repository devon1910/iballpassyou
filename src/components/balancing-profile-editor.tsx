"use client";
import { useState } from "react";
import { EMPTY_PROFILE, POSITIONS, type BalancingProfile, type Position } from "@/lib/balance/types";
import { saveBalancingProfileAction } from "@/app/app/actions";

export function BalancingProfileEditor({ groupId, playerId, name, initial, onSaved, draftOnly = false }: {
  groupId: string; playerId: string; name: string; initial?: BalancingProfile;
  onSaved: (profile: BalancingProfile) => void; draftOnly?: boolean;
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
    <label className="field">Primary position<select className="select" value={profile.primaryPosition ?? ""} onChange={e => setProfile({ ...profile, primaryPosition: e.target.value as Position })}><option value="" disabled>Choose position</option>{POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}</select></label>
    <label className="field">Secondary position<select className="select" value={profile.secondaryPosition ?? ""} onChange={e => setProfile({ ...profile, secondaryPosition: e.target.value as Position || null })}><option value="">None</option>{POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}</select></label>
    <label className="radio-row"><input type="checkbox" checked={profile.keeperCapable} onChange={e => setProfile({ ...profile, keeperCapable: e.target.checked })} />Keeper capable</label>
    <label className="field">Skill Level<select className="select" value={profile.skillLevel ?? ""} onChange={e => setProfile({ ...profile, skillLevel: Number(e.target.value) })}><option value="" disabled>Choose Skill Level</option>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{"★".repeat(n)} · {n}</option>)}</select></label>
    <small>Admin-only assessment for balancing. Separate from Performance Rating.</small>
    {error && <p role="alert">{error}</p>}
    {saved && <p role="status">Balancing details saved.</p>}
    <button className="button" type="button" disabled={pending || !profile.primaryPosition || !profile.skillLevel} onClick={save}>{pending ? "Saving…" : "Save balancing details"}</button>
  </fieldset>;
}
