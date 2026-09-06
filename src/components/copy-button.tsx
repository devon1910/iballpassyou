"use client";
import { useState } from "react";

export function CopyButton({ text, primary = false }: { text: string; primary?: boolean }) {
  const [copied, setCopied] = useState(false);
  return <button className={primary ? "button primary" : "button secondary"} onClick={async () => {
    await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800);
  }}>{copied ? "Copied" : "Copy leaderboard"}</button>;
}
