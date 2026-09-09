"use client";

import { useState } from "react";
import { InlineSpinner } from "@/components/inline-spinner";

export function ShareButton({ text, path, admin = false, label = "Share leaderboard", title = "iBallPassYou leaderboard" }: { text: string; path: string; admin?: boolean; label?: string; title?: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function share() {
    setPending(true); setMessage("");
    const url = new URL(path, window.location.origin).toString();
    try {
      if (navigator.share) await navigator.share({ title, text, url });
      else window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, "_blank", "noopener,noreferrer");
      setMessage("Ready to share ✦");
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") {
        if (admin && navigator.clipboard) { await navigator.clipboard.writeText(text); setMessage("Copied to your clipboard ✦"); }
        else setMessage("Sharing was cancelled. Try WhatsApp or your browser share menu.");
      }
    } finally { setPending(false); }
  }
  return <><button className="button" type="button" onClick={share} disabled={pending} aria-busy={pending}>{pending&&<InlineSpinner/>}{pending?"Opening share options":label}</button>{message && <p className="share-message" role="status">{message}</p>}</>;
}
