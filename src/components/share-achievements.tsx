"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Share2, X } from "lucide-react";
import { InlineSpinner } from "@/components/inline-spinner";
import { drawAchievementImage, type AchievementImageData } from "@/lib/achievement-image";

export function ShareAchievements({ data, path }: { data: AchievementImageData; path: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const [file, setFile] = useState<File>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [canShare, setCanShare] = useState(false);
  const record = data.records[selected];

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function generate() {
      try {
        await Promise.all([
          document.fonts.load('800 96px "Archivo Variable"'),
          document.fonts.load('500 24px "IBM Plex Mono"'),
        ]);
        if (cancelled || !canvasRef.current) return;
        drawAchievementImage(canvasRef.current, data, record);
        const blob = await new Promise<Blob>((resolve, reject) => canvasRef.current!.toBlob(value => value ? resolve(value) : reject(new Error("Could not create image")), "image/png"));
        if (cancelled) return;
        const name = data.playerName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 60) || "player";
        const image = new File([blob], `${name.toLowerCase()}-achievements.png`, { type: "image/png" });
        setFile(image);
        setCanShare(Boolean(navigator.canShare?.({ files: [image] }) && navigator.share));
      } catch {
        if (!cancelled) setError("Couldn’t create your image. Close the preview and try again.");
      }
    }
    void generate();
    return () => { cancelled = true; };
  }, [open, data, record]);

  function download() {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url; link.download = file.name;
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Image downloaded. Add it to your story or group chat.");
  }

  async function share() {
    if (!file) return;
    setBusy(true); setMessage(""); setError("");
    try {
      // The file is prepared before the click so native sharing keeps user activation.
      await navigator.share({ files: [file], title: `${data.playerName} · iBallPassYou achievements`, text: `${data.playerName} · ${data.groupName}\nView my player profile: ${new URL(path, window.location.origin)}` });
    } catch (caught) {
      if ((caught as DOMException)?.name !== "AbortError") setError("Couldn’t share the image. Use Download image to save it instead.");
    } finally { setBusy(false); }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(new URL(path, window.location.origin).toString());
      setMessage("Profile link copied.");
    } catch { setError("Couldn’t copy the profile link. Please try again."); }
  }

  return <>
    <button className="button" type="button" onClick={() => { setFile(undefined); setMessage(""); setError(""); setOpen(true); }}><Share2 size={18} aria-hidden="true" /> Share player achievements</button>
    <dialog className="achievement-dialog" ref={dialogRef} onClose={() => setOpen(false)} aria-labelledby="achievement-share-title">
      <div className="achievement-dialog-head"><div><p className="eyebrow">Made for the group chat</p><h2 id="achievement-share-title">Share your achievements</h2></div><button className="achievement-close" type="button" aria-label="Close achievement preview" onClick={() => setOpen(false)}><X aria-hidden="true" /></button></div>
      {data.records.length > 1 && <label className="field"><span className="field-label">Personal best to feature</span><select className="select" value={selected} disabled={busy} onChange={event => { setSelected(Number(event.target.value)); setFile(undefined); setError(""); setMessage(""); }}>{data.records.map((item, index) => <option value={index} key={item.format}>{item.format} · {item.points} points</option>)}</select></label>}
      <div className="achievement-preview" aria-busy={!file && !error}>
        <canvas ref={canvasRef} role="img" aria-label={`${data.playerName}, ${data.groupName}. ${data.motm} Man of the Match medals, ${data.mvp} monthly MVP trophies.${record ? ` Personal best: ${record.points} points, ${record.goals} goals, ${record.assists} assists. ${record.format}, ${record.date}.` : ""}`} />
        {!file && !error && <p role="status"><InlineSpinner /> Creating your image…</p>}
      </div>
      {error && <p className="notice error" role="alert">{error}</p>}
      {message && <p className="share-message" role="status">{message}</p>}
      <div className="achievement-share-actions">
        {canShare && <button className="button primary" type="button" disabled={!file || busy} onClick={share}>{busy ? <InlineSpinner /> : <Share2 size={18} aria-hidden="true" />} Share image</button>}
        <button className={`button ${canShare ? "" : "primary"}`} type="button" disabled={!file || busy} onClick={download}><Download size={18} aria-hidden="true" /> Download image</button>
      </div>
      <p className="rating-note">{canShare ? "Share to an available app, or download for your story." : "Download your image, then add it to WhatsApp, Instagram or your favourite app."} <button className="text-link" type="button" onClick={copyLink}>Copy profile link</button></p>
    </dialog>
  </>;
}
